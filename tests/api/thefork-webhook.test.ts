import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleTheForkReservation } from "@/app/api/webhooks/thefork/_handlers/reservation";

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
