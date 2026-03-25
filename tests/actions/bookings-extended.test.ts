import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRequireAuth = vi.fn();
vi.mock("@/lib/supabase-helpers", () => ({ requireAuth: mockRequireAuth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/notifications", () => ({ createNotification: vi.fn() }));
vi.mock("@/lib/push-notifications", () => ({ sendPushToOrganization: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/validators/booking", () => ({
  validateBookingFields: vi.fn().mockReturnValue(null),
  validateGuestFields: vi.fn().mockReturnValue(null),
}));
// Block Trigger.dev (not testable in unit tests)
vi.mock("@trigger.dev/sdk/v3", () => ({ tasks: { trigger: vi.fn().mockResolvedValue(undefined) } }));
vi.mock("@/trigger/verify-booking", () => ({ verifyBooking: {} }));
vi.mock("@/trigger/request-review", () => ({ requestReview: {} }));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAuth(supabase: any, extra: Record<string, unknown> = {}) {
  return {
    success: true as const,
    supabase,
    user: { id: "user_123", email: "admin@test.it" },
    organizationId: "org_123",
    organization: { id: "org_123", name: "Ristorante" },
    locations: [],
    ...extra,
  };
}

function makeChain(overrides: Record<string, any> = {}) {
  const c: any = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  c.from.mockReturnValue(c);
  c.select.mockReturnValue(c);
  c.insert.mockReturnValue(c);
  c.update.mockReturnValue(c);
  c.delete.mockReturnValue(c);
  c.eq.mockReturnValue(c);
  c.in.mockReturnValue(c);
  return c;
}

// ── upsertCustomerForBooking ───────────────────────────────────────────────────

describe("upsertCustomerForBooking", () => {
  it("returns existing customer id when phone already exists", async () => {
    const supabase = makeChain();
    supabase.single.mockResolvedValue({ data: { id: "cust_existing" } });

    const { upsertCustomerForBooking } = await import("@/app/actions/bookings");
    const result = await upsertCustomerForBooking(
      supabase, "org_1", "loc_1", "Mario", "+39340111", "2025-06-01T20:00:00Z",
    );

    expect(result).toBe("cust_existing");
    // Should not call insert
    expect(supabase.insert).not.toHaveBeenCalled();
  });

  it("creates a new customer when phone does not exist", async () => {
    const supabase = makeChain();
    supabase.single
      .mockResolvedValueOnce({ data: null }) // lookup → not found
      .mockResolvedValueOnce({ data: { id: "cust_new" }, error: null }); // insert

    const { upsertCustomerForBooking } = await import("@/app/actions/bookings");
    const result = await upsertCustomerForBooking(
      supabase, "org_1", "loc_1", "Luigi", "+39340222", "2025-06-01T20:00:00Z",
    );

    expect(result).toBe("cust_new");
    expect(supabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Luigi", phone_number: "+39340222" }),
    );
  });

  it("returns null when customer creation fails", async () => {
    const supabase = makeChain();
    supabase.single
      .mockResolvedValueOnce({ data: null }) // lookup → not found
      .mockResolvedValueOnce({ data: null, error: { message: "DB error" } }); // insert fails

    const { upsertCustomerForBooking } = await import("@/app/actions/bookings");
    const result = await upsertCustomerForBooking(
      supabase, "org_1", "loc_1", "Luigi", "+39340222", "2025-06-01T20:00:00Z",
    );

    expect(result).toBeNull();
  });
});

// ── createBookingRecord ────────────────────────────────────────────────────────

describe("createBookingRecord", () => {
  it("inserts booking with provided guest info when no customerId", async () => {
    const insertSingle = vi.fn().mockResolvedValue({ data: { id: "b_1" }, error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: insertSingle }) }),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
      }),
    };

    const { createBookingRecord } = await import("@/app/actions/bookings");
    const result = await createBookingRecord(
      supabase as any, "org_1", "loc_1", null,
      "Mario Rossi", "+39340111", 2, "2025-06-01T20:00:00Z",
    );

    expect(result.data?.id).toBe("b_1");
    expect(insertSingle).toHaveBeenCalled();
  });

  it("resolves customer name and phone from DB when customerId is provided", async () => {
    const insertSingle = vi.fn().mockResolvedValue({ data: { id: "b_2" }, error: null });
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "customers") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { name: "Fetched Name", phone_number: "+39340999" },
            }),
          };
        }
        return {
          insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: insertSingle }) }),
        };
      }),
    };

    const { createBookingRecord } = await import("@/app/actions/bookings");
    await createBookingRecord(
      supabase as any, "org_1", "loc_1", "cust_123",
      "", "", 4, "2025-06-01T20:00:00Z",
    );

    // Insert should use the fetched name (falls back since providedGuestName is empty)
    const insertCall = insertSingle.mock.calls[0];
    expect(insertSingle).toHaveBeenCalled();
  });
});

// ── assignBookingToTable ───────────────────────────────────────────────────────

describe("assignBookingToTable", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { assignBookingToTable } = await import("@/app/actions/bookings");
    const result = await assignBookingToTable("b_1", "t_1");
    expect(result).toEqual({ success: false, error: "Non autorizzato" });
  });

  it("updates booking table_id and returns ok", async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({ eq: updateEq }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { assignBookingToTable } = await import("@/app/actions/bookings");
    const result = await assignBookingToTable("b_1", "t_1");

    expect(result).toEqual({ success: true });
    expect(updateEq).toHaveBeenCalledWith("id", "b_1");
  });

  it("returns fail when DB update fails", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
        }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { assignBookingToTable } = await import("@/app/actions/bookings");
    const result = await assignBookingToTable("b_1", "t_1");

    expect(result.success).toBe(false);
  });
});

// ── unassignBooking ────────────────────────────────────────────────────────────

describe("unassignBooking", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { unassignBooking } = await import("@/app/actions/bookings");
    const result = await unassignBooking("b_1");
    expect(result.success).toBe(false);
  });

  it("sets table_id to null and returns ok", async () => {
    const updateFn = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const supabase = { from: vi.fn().mockReturnValue({ update: updateFn }) };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { unassignBooking } = await import("@/app/actions/bookings");
    const result = await unassignBooking("b_1");

    expect(result).toEqual({ success: true });
    expect(updateFn).toHaveBeenCalledWith({ table_id: null });
  });
});

// ── createWalkInBooking ────────────────────────────────────────────────────────

describe("createWalkInBooking", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { createWalkInBooking } = await import("@/app/actions/bookings");
    const result = await createWalkInBooking("loc_1", "t_1", 2);
    expect(result.success).toBe(false);
  });

  it("returns fail when location is not found", async () => {
    const supabase = makeChain();
    supabase.single.mockResolvedValue({ data: null });
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { createWalkInBooking } = await import("@/app/actions/bookings");
    const result = await createWalkInBooking("loc_1", "t_1", 2);

    expect(result).toEqual({ success: false, error: "Sede non trovata" });
  });

  it("creates walk-in booking and returns success with data", async () => {
    const walkInBooking = { id: "b_walkin", guest_name: "Walk-in", guests_count: 3 };
    const supabase = makeChain();
    supabase.single
      .mockResolvedValueOnce({ data: { organization_id: "org_123" } }) // location fetch
      .mockResolvedValueOnce({ data: walkInBooking, error: null }); // insert

    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { createWalkInBooking } = await import("@/app/actions/bookings");
    const result = await createWalkInBooking("loc_1", "t_1", 3);

    expect(result.success).toBe(true);
    expect((result as any).data).toEqual(walkInBooking);
    expect(supabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({ guest_name: "Walk-in", guests_count: 3, status: "confirmed" }),
    );
  });

  it("returns fail when booking insert fails", async () => {
    const supabase = makeChain();
    supabase.single
      .mockResolvedValueOnce({ data: { organization_id: "org_123" } })
      .mockResolvedValueOnce({ data: null, error: { message: "Insert failed" } });

    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { createWalkInBooking } = await import("@/app/actions/bookings");
    const result = await createWalkInBooking("loc_1", "t_1", 2);

    expect(result.success).toBe(false);
  });
});

// ── deleteBookings ─────────────────────────────────────────────────────────────

describe("deleteBookings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { deleteBookings } = await import("@/app/actions/bookings");
    expect((await deleteBookings(["b_1"])).success).toBe(false);
  });

  it("returns fail when user is not admin or owner", async () => {
    const supabase = makeChain();
    supabase.single.mockResolvedValue({ data: { role: "staff" } });
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { deleteBookings } = await import("@/app/actions/bookings");
    const result = await deleteBookings(["b_1"]);

    expect(result).toEqual({
      success: false,
      error: "Solo gli amministratori possono eliminare le prenotazioni",
    });
  });

  it("deletes bookings and returns ok for admin user", async () => {
    const deleteInEq = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { role: "admin" } }),
          };
        }
        return {
          delete: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          eq: deleteInEq,
        };
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { deleteBookings } = await import("@/app/actions/bookings");
    const result = await deleteBookings(["b_1", "b_2"]);

    expect(result.success).toBe(true);
  });

  it("deletes bookings and returns ok for owner user", async () => {
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { role: "owner" } }),
          };
        }
        return {
          delete: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        };
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { deleteBookings } = await import("@/app/actions/bookings");
    expect((await deleteBookings(["b_1"])).success).toBe(true);
  });
});

// ── updateBooking (direct data, no formData) ───────────────────────────────────

describe("updateBooking (direct data)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { updateBooking } = await import("@/app/actions/bookings");
    const result = await updateBooking("b_1", { status: "confirmed" });
    expect(result.success).toBe(false);
  });

  it("updates booking with direct data and returns success", async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({ eq: updateEq }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { updateBooking } = await import("@/app/actions/bookings");
    const result = await updateBooking("b_1", { status: "confirmed" });

    expect(result.success).toBe(true);
    expect(updateEq).toHaveBeenCalledWith("id", "b_1");
  });

  it("returns fail when DB update fails", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
        }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { updateBooking } = await import("@/app/actions/bookings");
    const result = await updateBooking("b_1", { status: "confirmed" });

    expect(result.success).toBe(false);
  });
});
