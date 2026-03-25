import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRequireAuth = vi.fn();
vi.mock("@/lib/supabase-helpers", () => ({ requireAuth: mockRequireAuth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockCheckResourceAvailability = vi.fn();
vi.mock("@/lib/limiter", () => ({ checkResourceAvailability: mockCheckResourceAvailability }));

let mockSupabaseClient: any;
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => mockSupabaseClient),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAuth(supabase: any) {
  return {
    success: true as const,
    supabase,
    user: { id: "user_123" },
    organizationId: "org_123",
    organization: { id: "org_123" },
    locations: [],
  };
}

function makeFlexChain(data: any = null, error: any = null) {
  const c: any = {};
  for (const m of ["from","select","insert","update","delete","eq","in","upsert","contains","order"]) {
    c[m] = vi.fn().mockReturnValue(c);
  }
  c.single = vi.fn().mockResolvedValue({ data, error });
  // Also make the chain itself awaitable (for non-.single() calls)
  c.then = (resolve: any) => resolve({ data: Array.isArray(data) ? data : [], error });
  return c;
}

// ── getFloorPlan ───────────────────────────────────────────────────────────────

describe("getFloorPlan", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns zones and tables for a location", async () => {
    const zones = [{ id: "zone_1" }, { id: "zone_2" }];
    const tables = [{ id: "t_1", zone_id: "zone_1" }];

    mockSupabaseClient = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "restaurant_zones") {
          const c: any = { select: vi.fn().mockReturnThis(), eq: vi.fn() };
          c.eq.mockResolvedValue({ data: zones, error: null });
          return c;
        }
        if (table === "restaurant_tables") {
          const c: any = {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: tables, error: null }),
          };
          return c;
        }
        return makeFlexChain();
      }),
    };

    const { getFloorPlan } = await import("@/app/actions/floor-plan");
    const result = await getFloorPlan("loc_1");

    expect(result.zones).toEqual(zones);
    expect(result.tables).toEqual(tables);
  });

  it("returns empty arrays when zone fetch fails", async () => {
    mockSupabaseClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: "err" } }),
      }),
    };

    const { getFloorPlan } = await import("@/app/actions/floor-plan");
    const result = await getFloorPlan("loc_1");

    expect(result).toEqual({ zones: [], tables: [] });
  });

  it("returns zones with empty tables when no zones exist", async () => {
    mockSupabaseClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    };

    const { getFloorPlan } = await import("@/app/actions/floor-plan");
    const result = await getFloorPlan("loc_1");

    expect(result.zones).toEqual([]);
    expect(result.tables).toEqual([]);
  });
});

// ── saveFloorPlan ──────────────────────────────────────────────────────────────

describe("saveFloorPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckResourceAvailability.mockResolvedValue({ allowed: true, remaining: 10 });
  });

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { saveFloorPlan } = await import("@/app/actions/floor-plan");
    expect((await saveFloorPlan("loc_1", [], [])).success).toBe(false);
  });

  it("returns fail when zone limit is exceeded for new zones", async () => {
    mockCheckResourceAvailability.mockResolvedValue({ allowed: false, remaining: 0 });

    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }), // no existing zones
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { saveFloorPlan } = await import("@/app/actions/floor-plan");
    const result = await saveFloorPlan("loc_1", [{ id: "new_zone", name: "Main", width: 800, height: 600 }], []);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Limite mappe sala");
  });

  it("skips limit check for updates to existing zones only", async () => {
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "restaurant_zones") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [{ id: "zone_1" }], error: null }),
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({ data: [{ id: "zone_1" }], error: null }),
            }),
            in: vi.fn().mockReturnThis(),
          };
        }
        if (table === "restaurant_tables") {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
            update: vi.fn().mockReturnValue({ in: vi.fn().mockResolvedValue({ error: null }) }),
          };
        }
        return makeFlexChain();
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { saveFloorPlan } = await import("@/app/actions/floor-plan");
    // zone_1 already exists → net new = 0 → no limit check
    const result = await saveFloorPlan("loc_1", [{ id: "zone_1", name: "Main", width: 800, height: 600 }], []);

    expect(mockCheckResourceAvailability).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it("returns fail when zone upsert fails", async () => {
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "restaurant_zones") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({ data: null, error: { message: "upsert error" } }),
            }),
          };
        }
        return makeFlexChain();
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { saveFloorPlan } = await import("@/app/actions/floor-plan");
    const result = await saveFloorPlan("loc_1", [{ id: "z_new", name: "Sala", width: 800, height: 600 }], []);

    expect(result.success).toBe(false);
    expect(result.error).toContain("upsert error");
  });
});

// ── deleteFloorPlan ────────────────────────────────────────────────────────────

describe("deleteFloorPlan", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { deleteFloorPlan } = await import("@/app/actions/floor-plan");
    expect((await deleteFloorPlan("zone_1")).success).toBe(false);
  });

  it("deletes zone and returns success", async () => {
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const supabase = { from: vi.fn().mockReturnValue({ delete: vi.fn().mockReturnValue({ eq: deleteEq }) }) };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { deleteFloorPlan } = await import("@/app/actions/floor-plan");
    const result = await deleteFloorPlan("zone_1");

    expect(result).toEqual({ success: true });
    expect(deleteEq).toHaveBeenCalledWith("id", "zone_1");
  });

  it("returns fail when delete fails", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: { message: "err" } }) }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { deleteFloorPlan } = await import("@/app/actions/floor-plan");
    const result = await deleteFloorPlan("zone_1");

    expect(result.success).toBe(false);
  });
});

// ── updateZoneBlock ────────────────────────────────────────────────────────────

describe("updateZoneBlock", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { updateZoneBlock } = await import("@/app/actions/floor-plan");
    expect((await updateZoneBlock("z", null, null, null)).success).toBe(false);
  });

  it("updates zone block dates and reason", async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const updateFn = vi.fn().mockReturnValue({ eq: updateEq });
    const supabase = { from: vi.fn().mockReturnValue({ update: updateFn }) };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { updateZoneBlock } = await import("@/app/actions/floor-plan");
    const result = await updateZoneBlock("zone_1", "2025-12-24", "2025-12-26", "Natale");

    expect(result).toEqual({ success: true });
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        blocked_from: "2025-12-24",
        blocked_until: "2025-12-26",
        blocked_reason: "Natale",
      }),
    );
  });

  it("can clear block by passing null values", async () => {
    const updateFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    const supabase = { from: vi.fn().mockReturnValue({ update: updateFn }) };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { updateZoneBlock } = await import("@/app/actions/floor-plan");
    const result = await updateZoneBlock("zone_1", null, null, null);

    expect(result).toEqual({ success: true });
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({ blocked_from: null, blocked_until: null, blocked_reason: null }),
    );
  });
});

// ── getOrganizationZonesCount ──────────────────────────────────────────────────

describe("getOrganizationZonesCount", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns total zone count across all org locations", async () => {
    mockSupabaseClient = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [{ id: "loc_1" }, { id: "loc_2" }], error: null }),
          };
        }
        if (table === "restaurant_zones") {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ count: 5, error: null }),
          };
        }
        return makeFlexChain();
      }),
    };

    const { getOrganizationZonesCount } = await import("@/app/actions/floor-plan");
    const result = await getOrganizationZonesCount("org_123");

    expect(result).toBe(5);
  });

  it("returns 0 when org has no locations", async () => {
    mockSupabaseClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    };

    const { getOrganizationZonesCount } = await import("@/app/actions/floor-plan");
    expect(await getOrganizationZonesCount("org_123")).toBe(0);
  });

  it("returns 0 when location fetch fails", async () => {
    mockSupabaseClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: "err" } }),
      }),
    };

    const { getOrganizationZonesCount } = await import("@/app/actions/floor-plan");
    expect(await getOrganizationZonesCount("org_123")).toBe(0);
  });
});
