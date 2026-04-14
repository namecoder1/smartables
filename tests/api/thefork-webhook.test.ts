import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleTheForkReservation } from "@/app/api/webhooks/thefork/_handlers/reservation";
import { captureCritical } from "@/lib/monitoring";

vi.mock("@/lib/monitoring", () => ({
  captureCritical: vi.fn(),
  captureWarning: vi.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const ORG_ID = "org_123";
const LOC_ID = "loc_456";

function makeSupabase(overrides: {
  existingBooking?: unknown;
  existingCustomerByPhone?: unknown;
  existingCustomerByEmail?: unknown;
  insertBooking?: { error: null } | { error: { message: string } };
} = {}) {
  const {
    existingBooking = null,
    existingCustomerByPhone = null,
    existingCustomerByEmail = null,
    insertBooking = { error: null },
  } = overrides;

  const chain: Record<string, unknown> = {};

  const makeChain = (finalValue: unknown) => {
    const c: Record<string, unknown> = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: finalValue }),
      single: vi.fn().mockResolvedValue({ data: finalValue }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: "new_customer_id" }, error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(insertBooking),
      }),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c.select as any).mockReturnValue(c);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c.eq as any).mockReturnValue(c);
    return c;
  };

  let callCount = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain as any).from = vi.fn().mockImplementation((table: string) => {
    if (table === "bookings") {
      // First call = check existing booking by external_id
      // Second call = insert new booking
      if (callCount === 0) {
        callCount++;
        const c = makeChain(existingBooking);
        c.insert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }),
        });
        // override insert to track new booking creation
        (c as Record<string, unknown>).insert = vi.fn().mockResolvedValue(insertBooking);
        return c;
      }
      return makeChain(null);
    }
    if (table === "customers") {
      // First customers call = lookup by phone, second = lookup by email, third = insert
      if (callCount === 1) {
        callCount++;
        return makeChain(existingCustomerByPhone);
      }
      if (callCount === 2) {
        callCount++;
        return makeChain(existingCustomerByEmail);
      }
      // Insert new customer
      return makeChain({ id: "new_customer_id" });
    }
    return makeChain(null);
  });

  return chain;
}

const basePayload = {
  mealUuid: "thefork-res-uuid-001",
  mealStatus: "RECORDED" as const,
  mealDate: "2026-03-24T20:00:00.000Z",
  covers: 4,
  customer: {
    id: "tf-guest-001",
    firstName: "Mario",
    lastName: "Rossi",
    phone: "+393331234567",
    email: "mario.rossi@example.com",
    allergies: ["Glutine"],
    dietaryRestrictions: ["Vegetariano"],
    seatingPreferences: ["Interno"],
  },
  table: { name: "T5", area: "Sala principale" },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("handleTheForkReservation", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("existing booking (by external_id)", () => {
    it("updates status to 'arrived' when mealStatus is RECORDED", async () => {
      const existing = { id: "booking_123", customer_id: "cust_456", status: "confirmed" };
      const supabase = makeSupabase({ existingBooking: existing });

      const updateEq = vi.fn().mockResolvedValue({ error: null });
      const updateChain = { update: vi.fn().mockReturnValue({ eq: updateEq }) };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from.mockImplementation((table: string) => {
        if (table === "bookings") return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: existing }),
              }),
            }),
          }),
          update: updateChain.update,
        };
        if (table === "customers") return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { metadata: {}, email: null, name: null } }),
          update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        };
        return supabase;
      });

      await handleTheForkReservation(supabase as never, LOC_ID, ORG_ID, basePayload);

      expect(updateChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: "arrived", sync_status: "synced" }),
      );
    });

    it("maps NO_SHOW to 'no_show' status", async () => {
      const existing = { id: "booking_123", customer_id: null, status: "confirmed" };
      const updateFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

      const supabase = { from: vi.fn() } as never;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from.mockImplementation((table: string) => {
        if (table === "bookings") return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: existing }),
              }),
            }),
          }),
          update: updateFn,
        };
        return {};
      });

      await handleTheForkReservation(
        supabase,
        LOC_ID,
        ORG_ID,
        { ...basePayload, mealStatus: "NO_SHOW" },
      );

      expect(updateFn).toHaveBeenCalledWith(
        expect.objectContaining({ status: "no_show" }),
      );
    });

    it("maps CANCELED to 'cancelled' status", async () => {
      const existing = { id: "booking_123", customer_id: null, status: "confirmed" };
      const updateFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

      const supabase = { from: vi.fn() } as never;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from.mockImplementation((table: string) => {
        if (table === "bookings") return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: existing }),
              }),
            }),
          }),
          update: updateFn,
        };
        return {};
      });

      await handleTheForkReservation(
        supabase,
        LOC_ID,
        ORG_ID,
        { ...basePayload, mealStatus: "CANCELED" },
      );

      expect(updateFn).toHaveBeenCalledWith(
        expect.objectContaining({ status: "cancelled" }),
      );
    });

    it("does not update status if it is already correct", async () => {
      const existing = { id: "booking_123", customer_id: null, status: "arrived" };
      const updateFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

      const supabase = { from: vi.fn() } as never;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from.mockImplementation((table: string) => {
        if (table === "bookings") return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: existing }),
              }),
            }),
          }),
          update: updateFn,
        };
        return {};
      });

      await handleTheForkReservation(supabase, LOC_ID, ORG_ID, basePayload); // RECORDED → arrived

      expect(updateFn).not.toHaveBeenCalled();
    });
  });

  describe("new booking (no existing match)", () => {
    it("creates a new booking with source=thefork and external_id", async () => {
      const insertFn = vi.fn().mockResolvedValue({ error: null });
      const supabase = { from: vi.fn() } as never;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from.mockImplementation((table: string) => {
        if (table === "bookings") return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null }), // no existing booking
              }),
            }),
          }),
          insert: insertFn,
        };
        if (table === "customers") return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: "cust_123", metadata: {}, email: null, name: null } }),
          update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          single: vi.fn().mockResolvedValue({ data: { id: "cust_123" } }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: "new_cust" } }),
            }),
          }),
        };
        return {};
      });

      await handleTheForkReservation(supabase, LOC_ID, ORG_ID, basePayload);

      expect(insertFn).toHaveBeenCalledWith(
        expect.objectContaining({
          source: "thefork",
          external_id: "thefork-res-uuid-001",
          sync_status: "synced",
          guests_count: 4,
          booking_time: "2026-03-24T20:00:00.000Z",
          location_id: LOC_ID,
          organization_id: ORG_ID,
        }),
      );
    });

    it("sets allergies from customer payload", async () => {
      const insertFn = vi.fn().mockResolvedValue({ error: null });
      const supabase = { from: vi.fn() } as never;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from.mockImplementation((table: string) => {
        if (table === "bookings") return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null }),
              }),
            }),
          }),
          insert: insertFn,
        };
        if (table === "customers") return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: "cust_123", metadata: {}, email: null, name: null } }),
          update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          single: vi.fn().mockResolvedValue({ data: { id: "cust_123" } }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: "new_cust" } }),
            }),
          }),
        };
        return {};
      });

      await handleTheForkReservation(supabase, LOC_ID, ORG_ID, basePayload);

      expect(insertFn).toHaveBeenCalledWith(
        expect.objectContaining({ allergies: "Glutine" }),
      );
    });

    it("builds guest name from firstName + lastName", async () => {
      const insertFn = vi.fn().mockResolvedValue({ error: null });
      const supabase = { from: vi.fn() } as never;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from.mockImplementation((table: string) => {
        if (table === "bookings") return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null }),
              }),
            }),
          }),
          insert: insertFn,
        };
        if (table === "customers") return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: "cust_123", metadata: {}, email: null, name: null } }),
          update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          single: vi.fn().mockResolvedValue({ data: { id: "cust_123" } }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: "new_cust" } }),
            }),
          }),
        };
        return {};
      });

      await handleTheForkReservation(supabase, LOC_ID, ORG_ID, basePayload);

      expect(insertFn).toHaveBeenCalledWith(
        expect.objectContaining({ guest_name: "Mario Rossi" }),
      );
    });
  });
});

// ── Additional handler tests ───────────────────────────────────────────────────

// Helper: supabase mock for "new booking, no customer" path (anonymous)
function makeAnonBookingSupabase(insertFn: ReturnType<typeof vi.fn>) {
  const supabase = { from: vi.fn() } as never;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (supabase as any).from.mockImplementation((table: string) => {
    if (table === "bookings") return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      }),
      insert: insertFn,
    };
    return {};
  });
  return supabase;
}

// Helper: supabase mock for "existing booking, enrich customer" path.
// Uses a booking that already has the target status so the status-update
// branch is skipped, isolating the enrichCustomer call.
function makeEnrichSupabase(
  currentCustomer: { metadata: object; email: string | null; name: string | null },
  updateFn: ReturnType<typeof vi.fn>,
) {
  const existingBooking = { id: "booking_123", customer_id: "cust_456", status: "arrived" };
  const supabase = { from: vi.fn() } as never;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (supabase as any).from.mockImplementation((table: string) => {
    if (table === "bookings") return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: existingBooking }),
          }),
        }),
      }),
    };
    if (table === "customers") return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: currentCustomer }),
      update: updateFn,
    };
    return {};
  });
  return supabase;
}

// ── Status mapping — edge cases ───────────────────────────────────────────────

describe("status mapping — edge cases", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps LEFT to 'arrived' (meal complete)", async () => {
    const existing = { id: "booking_123", customer_id: null, status: "confirmed" };
    const updateFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

    const supabase = { from: vi.fn() } as never;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from.mockImplementation((table: string) => {
      if (table === "bookings") return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: existing }),
            }),
          }),
        }),
        update: updateFn,
      };
      return {};
    });

    await handleTheForkReservation(supabase, LOC_ID, ORG_ID, { ...basePayload, mealStatus: "LEFT" });

    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({ status: "arrived" }),
    );
  });
});

// ── Anonymous booking (no customer data) ─────────────────────────────────────

describe("anonymous booking (no customer data)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates booking with 'Ospite TheFork' as guest name", async () => {
    const insertFn = vi.fn().mockResolvedValue({ error: null });
    const supabase = makeAnonBookingSupabase(insertFn);

    await handleTheForkReservation(supabase, LOC_ID, ORG_ID, {
      ...basePayload,
      customer: undefined,
    });

    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({ guest_name: "Ospite TheFork", customer_id: null }),
    );
  });

  it("sets guest_phone to empty string when no customer", async () => {
    const insertFn = vi.fn().mockResolvedValue({ error: null });
    const supabase = makeAnonBookingSupabase(insertFn);

    await handleTheForkReservation(supabase, LOC_ID, ORG_ID, {
      ...basePayload,
      customer: undefined,
    });

    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({ guest_phone: "" }),
    );
  });
});

// ── Notes building ────────────────────────────────────────────────────────────

describe("notes building", () => {
  beforeEach(() => vi.clearAllMocks());

  it("includes table name and area", async () => {
    const insertFn = vi.fn().mockResolvedValue({ error: null });
    const supabase = makeAnonBookingSupabase(insertFn);

    await handleTheForkReservation(supabase, LOC_ID, ORG_ID, {
      ...basePayload,
      customer: undefined,
      table: { name: "T5", area: "Terrazza" },
    });

    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({ notes: "Tavolo TheFork: T5 (Terrazza)" }),
    );
  });

  it("includes table name without area when area is omitted", async () => {
    const insertFn = vi.fn().mockResolvedValue({ error: null });
    const supabase = makeAnonBookingSupabase(insertFn);

    await handleTheForkReservation(supabase, LOC_ID, ORG_ID, {
      ...basePayload,
      customer: undefined,
      table: { name: "T5" },
      loyaltyDiscount: undefined,
      prepayment: undefined,
    });

    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({ notes: "Tavolo TheFork: T5" }),
    );
  });

  it("adds loyalty discount note", async () => {
    const insertFn = vi.fn().mockResolvedValue({ error: null });
    const supabase = makeAnonBookingSupabase(insertFn);

    await handleTheForkReservation(supabase, LOC_ID, ORG_ID, {
      ...basePayload,
      customer: undefined,
      table: undefined,
      loyaltyDiscount: { percentage: 10 },
      prepayment: undefined,
    });

    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({ notes: "Sconto loyalty applicato" }),
    );
  });

  it("adds prepayment note", async () => {
    const insertFn = vi.fn().mockResolvedValue({ error: null });
    const supabase = makeAnonBookingSupabase(insertFn);

    await handleTheForkReservation(supabase, LOC_ID, ORG_ID, {
      ...basePayload,
      customer: undefined,
      table: undefined,
      loyaltyDiscount: undefined,
      prepayment: { amount: 20 },
    });

    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({ notes: "Prepagato" }),
    );
  });

  it("concatenates table + loyalty + prepayment with ' · '", async () => {
    const insertFn = vi.fn().mockResolvedValue({ error: null });
    const supabase = makeAnonBookingSupabase(insertFn);

    await handleTheForkReservation(supabase, LOC_ID, ORG_ID, {
      ...basePayload,
      customer: undefined,
      table: { name: "T1" },
      loyaltyDiscount: { percentage: 5 },
      prepayment: { amount: 20 },
    });

    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        notes: "Tavolo TheFork: T1 · Sconto loyalty applicato · Prepagato",
      }),
    );
  });

  it("sets notes to null when no table, loyalty or prepayment", async () => {
    const insertFn = vi.fn().mockResolvedValue({ error: null });
    const supabase = makeAnonBookingSupabase(insertFn);

    await handleTheForkReservation(supabase, LOC_ID, ORG_ID, {
      ...basePayload,
      customer: undefined,
      table: undefined,
      loyaltyDiscount: undefined,
      prepayment: undefined,
    });

    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({ notes: null }),
    );
  });
});

// ── Customer upsert — lookup by email ─────────────────────────────────────────

describe("customer upsert — lookup by email", () => {
  beforeEach(() => vi.clearAllMocks());

  it("finds customer by email when phone is absent", async () => {
    const insertFn = vi.fn().mockResolvedValue({ error: null });
    const existingCustomer = { id: "cust_by_email", metadata: {}, email: "mario.rossi@example.com", name: "Mario Rossi" };

    const supabase = { from: vi.fn() } as never;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from.mockImplementation((table: string) => {
      if (table === "bookings") return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
        }),
        insert: insertFn,
      };
      if (table === "customers") return {
        // Handles both: maybeSingle (email lookup) and single (enrichCustomer select)
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: existingCustomer }),
        single: vi.fn().mockResolvedValue({ data: existingCustomer }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      };
      return {};
    });

    // No phone → handler skips phone lookup, goes straight to email lookup
    const noPhonePayload = {
      ...basePayload,
      customer: { ...basePayload.customer, phone: undefined },
    };
    await handleTheForkReservation(supabase, LOC_ID, ORG_ID, noPhonePayload);

    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({ customer_id: "cust_by_email" }),
    );
  });
});

// ── Customer upsert — new customer creation ───────────────────────────────────

describe("customer upsert — new customer creation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates new customer when neither phone nor email matches", async () => {
    const insertBookingFn = vi.fn().mockResolvedValue({ error: null });
    const insertCustomerFn = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: "new_cust_id" }, error: null }),
      }),
    });

    let customersCallCount = 0;
    const supabase = { from: vi.fn() } as never;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from.mockImplementation((table: string) => {
      if (table === "bookings") return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
        }),
        insert: insertBookingFn,
      };
      if (table === "customers") {
        customersCallCount++;
        // call 1 = phone lookup, call 2 = email lookup → both null
        if (customersCallCount <= 2) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          };
        }
        // call 3 = insert new customer
        return { insert: insertCustomerFn };
      }
      return {};
    });

    await handleTheForkReservation(supabase, LOC_ID, ORG_ID, basePayload);

    expect(insertCustomerFn).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: ORG_ID,
        location_id: LOC_ID,
        phone_number: "+393331234567",
        name: "Mario Rossi",
        email: "mario.rossi@example.com",
      }),
    );
    expect(insertBookingFn).toHaveBeenCalledWith(
      expect.objectContaining({ customer_id: "new_cust_id" }),
    );
  });
});

// ── Customer enrichment ───────────────────────────────────────────────────────

describe("customer enrichment on existing booking", () => {
  beforeEach(() => vi.clearAllMocks());

  // Uses RECORDED (→ "arrived") with existing booking already at "arrived"
  // so the status-update branch is skipped and we isolate enrichCustomer.

  it("fills email when customer record has no email", async () => {
    const updateFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    const supabase = makeEnrichSupabase({ metadata: {}, email: null, name: "Mario Rossi" }, updateFn);

    await handleTheForkReservation(supabase, LOC_ID, ORG_ID, basePayload);

    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({ email: "mario.rossi@example.com" }),
    );
  });

  it("fills name when customer record has no name", async () => {
    const updateFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    const supabase = makeEnrichSupabase({ metadata: {}, email: "mario.rossi@example.com", name: null }, updateFn);

    await handleTheForkReservation(supabase, LOC_ID, ORG_ID, basePayload);

    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Mario Rossi" }),
    );
  });

  it("does not overwrite existing email or name", async () => {
    const updateFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    const supabase = makeEnrichSupabase(
      { metadata: {}, email: "existing@example.com", name: "Nome Esistente" },
      updateFn,
    );

    await handleTheForkReservation(supabase, LOC_ID, ORG_ID, basePayload);

    expect(updateFn).toHaveBeenCalledWith(
      expect.not.objectContaining({ email: expect.anything(), name: expect.anything() }),
    );
  });
});

// ── Error handling ────────────────────────────────────────────────────────────

describe("error handling", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls captureCritical when booking insert fails", async () => {
    const insertBookingFn = vi.fn().mockResolvedValue({ error: { message: "unique constraint", code: "23505" } });
    const insertCustomerFn = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: "new_cust_id" }, error: null }),
      }),
    });

    let customersCallCount = 0;
    const supabase = { from: vi.fn() } as never;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from.mockImplementation((table: string) => {
      if (table === "bookings") return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
        }),
        insert: insertBookingFn,
      };
      if (table === "customers") {
        customersCallCount++;
        if (customersCallCount <= 2) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          };
        }
        return { insert: insertCustomerFn };
      }
      return {};
    });

    await handleTheForkReservation(supabase, LOC_ID, ORG_ID, basePayload);

    expect(vi.mocked(captureCritical)).toHaveBeenCalledWith(
      expect.objectContaining({ message: "unique constraint" }),
      expect.objectContaining({
        flow: "thefork_booking_creation",
        mealUuid: basePayload.mealUuid,
        locationId: LOC_ID,
        organizationId: ORG_ID,
      }),
    );
  });
});
