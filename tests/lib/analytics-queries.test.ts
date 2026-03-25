import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

let mockSupabase: any;

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => mockSupabase),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Creates a mock Supabase query chain that resolves with the given data.
 * Supports optional `.gte()` and `.lte()` filter chaining.
 */
function makeQueryChain(data: unknown[]) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: data[0] ?? null }),
  };
  // The chain resolves to { data } when awaited (final step)
  chain.lte.mockReturnValue({
    ...chain,
    // When awaited directly (not chained further)
    then: (resolve: (v: any) => void) => resolve({ data }),
  });
  chain.limit.mockReturnValue({
    ...chain,
    then: (resolve: (v: any) => void) => resolve({ data }),
    gte: vi.fn().mockReturnValue({
      ...chain,
      lte: vi.fn().mockResolvedValue({ data }),
      then: (resolve: (v: any) => void) => resolve({ data }),
    }),
    lte: vi.fn().mockResolvedValue({ data }),
  });
  return chain;
}

/**
 * A simpler approach: create a mock that always resolves correctly
 * whether or not date filters are applied.
 */
function makeFlexibleChain(data: unknown[]) {
  const self: any = {};
  const resolved = Promise.resolve({ data });

  const handler = {
    get(_: any, prop: string) {
      if (prop === "then") return resolved.then.bind(resolved);
      if (prop === "catch") return resolved.catch.bind(resolved);
      if (prop === "finally") return resolved.finally.bind(resolved);
      return () => new Proxy({}, handler);
    },
  };

  return new Proxy({}, handler);
}

// ── Tests: queryBookings ───────────────────────────────────────────────────────

describe("queryBookings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns bookings for the given organization", async () => {
    const bookings = [
      { id: "b1", booking_time: "2025-01-01T20:00:00Z", status: "confirmed", guests_count: 2, source: "whatsapp" },
      { id: "b2", booking_time: "2025-01-02T20:00:00Z", status: "pending", guests_count: 4, source: "manual" },
    ];

    mockSupabase = {
      from: vi.fn().mockReturnValue(makeFlexibleChain(bookings)),
    };

    const { queryBookings } = await import("@/lib/analytics/queries");
    const result = await queryBookings("org_123");

    expect(result).toEqual(bookings);
    expect(mockSupabase.from).toHaveBeenCalledWith("bookings");
  });

  it("returns empty array when no bookings exist", async () => {
    mockSupabase = {
      from: vi.fn().mockReturnValue(makeFlexibleChain([])),
    };

    const { queryBookings } = await import("@/lib/analytics/queries");
    const result = await queryBookings("org_123");

    expect(result).toEqual([]);
  });

  it("returns empty array when data is null", async () => {
    const nullChain = new Proxy({}, {
      get(_: any, prop: string) {
        const p = Promise.resolve({ data: null });
        if (prop === "then") return p.then.bind(p);
        if (prop === "catch") return p.catch.bind(p);
        if (prop === "finally") return p.finally.bind(p);
        return () => nullChain;
      },
    });

    mockSupabase = { from: vi.fn().mockReturnValue(nullChain) };

    const { queryBookings } = await import("@/lib/analytics/queries");
    const result = await queryBookings("org_123");

    expect(result).toEqual([]);
  });

  it("applies date filters when from/to are provided", async () => {
    const bookings = [{ id: "b1", booking_time: "2025-01-15T20:00:00Z" }];
    const gteChain = makeFlexibleChain(bookings);
    const limitChain = {
      gte: vi.fn().mockReturnValue(gteChain),
      lte: vi.fn().mockResolvedValue({ data: bookings }),
      then: (resolve: any) => Promise.resolve({ data: bookings }).then(resolve),
    };

    mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnValue(limitChain),
      }),
    };

    const { queryBookings } = await import("@/lib/analytics/queries");
    const from = new Date("2025-01-01");
    const to = new Date("2025-01-31");

    // Should not throw when date filters are applied
    await expect(queryBookings("org_123", from, to)).resolves.toBeDefined();
  });
});

// ── Tests: queryOrders ────────────────────────────────────────────────────────

describe("queryOrders", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns orders for the given organization", async () => {
    const orders = [
      { id: "o1", created_at: "2025-01-01T12:00:00Z", total_amount: 45.50, status: "completed" },
    ];

    mockSupabase = {
      from: vi.fn().mockReturnValue(makeFlexibleChain(orders)),
    };

    const { queryOrders } = await import("@/lib/analytics/queries");
    const result = await queryOrders("org_123");

    expect(result).toEqual(orders);
    expect(mockSupabase.from).toHaveBeenCalledWith("orders");
  });

  it("returns empty array when no orders exist", async () => {
    mockSupabase = {
      from: vi.fn().mockReturnValue(makeFlexibleChain([])),
    };

    const { queryOrders } = await import("@/lib/analytics/queries");
    const result = await queryOrders("org_123");

    expect(result).toEqual([]);
  });
});

// ── Tests: queryCustomers ─────────────────────────────────────────────────────

describe("queryCustomers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns customers for the given organization", async () => {
    const customers = [
      { id: "c1", name: "Mario Rossi", phone_number: "+393401234567", total_visits: 5, tags: [] },
      { id: "c2", name: "Luigi Bianchi", phone_number: "+393409876543", total_visits: 2, tags: ["vip"] },
    ];

    mockSupabase = {
      from: vi.fn().mockReturnValue(makeFlexibleChain(customers)),
    };

    const { queryCustomers } = await import("@/lib/analytics/queries");
    const result = await queryCustomers("org_123");

    expect(result).toEqual(customers);
    expect(mockSupabase.from).toHaveBeenCalledWith("customers");
  });

  it("returns empty array for org with no customers", async () => {
    mockSupabase = {
      from: vi.fn().mockReturnValue(makeFlexibleChain([])),
    };

    const { queryCustomers } = await import("@/lib/analytics/queries");
    const result = await queryCustomers("org_123");

    expect(result).toEqual([]);
  });
});

// ── Tests: queryWhatsAppMessages ──────────────────────────────────────────────

describe("queryWhatsAppMessages", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns messages for the given organization", async () => {
    const messages = [
      { id: "m1", direction: "inbound", status: "delivered", cost_implication: false, created_at: "2025-01-01T10:00:00Z" },
      { id: "m2", direction: "outbound", status: "sent", cost_implication: true, created_at: "2025-01-01T10:01:00Z" },
    ];

    mockSupabase = {
      from: vi.fn().mockReturnValue(makeFlexibleChain(messages)),
    };

    const { queryWhatsAppMessages } = await import("@/lib/analytics/queries");
    const result = await queryWhatsAppMessages("org_123");

    expect(result).toEqual(messages);
    expect(mockSupabase.from).toHaveBeenCalledWith("whatsapp_messages");
  });
});

// ── Tests: queryOrganizationUsage ─────────────────────────────────────────────

describe("queryOrganizationUsage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns usage data for the given organization", async () => {
    const usage = {
      whatsapp_usage_count: 45,
      usage_cap_whatsapp: 400,
      current_billing_cycle_start: "2025-01-01T00:00:00Z",
      stripe_price_id: "price_growth_monthly",
      addons_config: null,
    };

    mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: usage }),
      }),
    };

    const { queryOrganizationUsage } = await import("@/lib/analytics/queries");
    const result = await queryOrganizationUsage("org_123");

    expect(result).toEqual(usage);
    expect(mockSupabase.from).toHaveBeenCalledWith("organizations");
  });

  it("returns null when organization not found", async () => {
    mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
      }),
    };

    const { queryOrganizationUsage } = await import("@/lib/analytics/queries");
    const result = await queryOrganizationUsage("org_missing");

    expect(result).toBeNull();
  });
});
