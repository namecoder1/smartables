import { describe, it, expect, vi } from "vitest";
import { checkResourceAvailability } from "@/lib/limiter";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeOrg(overrides: Record<string, unknown> = {}) {
  return {
    stripe_price_id: "price_test",
    billing_tier: "starter",
    addons_config: null,
    total_storage_used: 0,
    usage_cap_whatsapp: 400,
    whatsapp_usage_count: 0,
    current_billing_cycle_start: null,
    ...overrides,
  };
}

function makePlanLimits(overrides: Record<string, number> = {}) {
  return {
    max_staff: 5,
    max_locations: 1,
    max_menus: 5,
    max_zones: 3,
    max_bookings: 300,
    storage_mb: 300,
    ...overrides,
  };
}

/**
 * Chainable Supabase query mock.
 * When awaited (or .single() called), resolves with `resolved`.
 */
function makeChain(resolved: unknown) {
  const c: any = {};
  ["select", "eq", "neq", "in", "gte", "lte", "not", "limit", "order"].forEach((m) => {
    c[m] = vi.fn(() => c);
  });
  c.single = vi.fn().mockResolvedValue(resolved);
  c.maybeSingle = vi.fn().mockResolvedValue(resolved);
  c.then = (onfulfilled: any, onrejected: any) =>
    Promise.resolve(resolved).then(onfulfilled, onrejected);
  return c;
}

/**
 * Minimal Supabase stub for limiter tests.
 * `tableData` keys map table names to the resolved value for that table.
 */
function makeSupabase(
  org: ReturnType<typeof makeOrg>,
  planLimits: ReturnType<typeof makePlanLimits>,
  tableData: Record<string, unknown> = {},
) {
  return {
    from: vi.fn((table: string) => {
      if (table === "organizations") {
        return makeChain({ data: org, error: null });
      }
      if (table === "subscription_plans") {
        return makeChain({ data: { limits: planLimits }, error: null });
      }
      if (table in tableData) {
        return makeChain(tableData[table]);
      }
      return makeChain({ data: null, count: 0, error: null });
    }),
  };
}

const ORG_ID = "org-test-1";

// ── org not found ─────────────────────────────────────────────────────────────

describe("checkResourceAvailability — org not found", () => {
  it("returns allowed:false when the organization doesn't exist", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "organizations") return makeChain({ data: null, error: null });
        return makeChain({ data: null, error: null });
      }),
    };
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "staff");
    expect(result.allowed).toBe(false);
    expect(result.current).toBe(0);
    expect(result.limit).toBe(0);
  });
});

// ── staff ─────────────────────────────────────────────────────────────────────

describe("checkResourceAvailability — staff", () => {
  it("allows when current count is under the plan limit", async () => {
    const supabase = makeSupabase(makeOrg(), makePlanLimits({ max_staff: 5 }), {
      profiles: { count: 3, data: null, error: null },
    });
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "staff");
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(3);
    expect(result.limit).toBe(5);
    expect(result.remaining).toBe(2);
  });

  it("blocks when at the exact limit", async () => {
    const supabase = makeSupabase(makeOrg(), makePlanLimits({ max_staff: 5 }), {
      profiles: { count: 5, data: null, error: null },
    });
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "staff");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("addon extra_staff extends the limit", async () => {
    const supabase = makeSupabase(
      makeOrg({ addons_config: { extra_staff: 10 } }), // +10 from addon
      makePlanLimits({ max_staff: 5 }),
      { profiles: { count: 5, data: null, error: null } },
    );
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "staff");
    expect(result.allowed).toBe(true);  // 5 < 15
    expect(result.limit).toBe(15);
    expect(result.remaining).toBe(10);
  });
});

// ── locations ────────────────────────────────────────────────────────────────

describe("checkResourceAvailability — locations", () => {
  it("allows when under the plan location limit", async () => {
    const supabase = makeSupabase(makeOrg(), makePlanLimits({ max_locations: 3 }), {
      locations: { count: 1, data: null, error: null },
    });
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "locations");
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(1);
    expect(result.limit).toBe(3);
  });

  it("blocks when at the limit (starter: 1 location)", async () => {
    const supabase = makeSupabase(makeOrg(), makePlanLimits({ max_locations: 1 }), {
      locations: { count: 1, data: null, error: null },
    });
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "locations");
    expect(result.allowed).toBe(false);
  });

  it("addon extra_locations extends the limit", async () => {
    const supabase = makeSupabase(
      makeOrg({ addons_config: { extra_locations: 2 } }),
      makePlanLimits({ max_locations: 1 }),
      { locations: { count: 1, data: null, error: null } },
    );
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "locations");
    expect(result.allowed).toBe(true); // 1 < 3
    expect(result.limit).toBe(3);
  });
});

// ── menus ────────────────────────────────────────────────────────────────────

describe("checkResourceAvailability — menus", () => {
  it("allows when under the menu limit", async () => {
    const supabase = makeSupabase(makeOrg(), makePlanLimits({ max_menus: 5 }), {
      menus: { count: 2, data: null, error: null },
    });
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "menus");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(3);
  });

  it("blocks when all menu slots are used", async () => {
    const supabase = makeSupabase(makeOrg(), makePlanLimits({ max_menus: 5 }), {
      menus: { count: 5, data: null, error: null },
    });
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "menus");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
});

// ── zones ────────────────────────────────────────────────────────────────────

describe("checkResourceAvailability — zones", () => {
  it("allows when org has zones under the limit", async () => {
    const supabase = makeSupabase(makeOrg(), makePlanLimits({ max_zones: 3 }), {
      locations: { data: [{ id: "loc-1" }, { id: "loc-2" }], error: null },
      restaurant_zones: { count: 2, data: null, error: null },
    });
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "zones");
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(2);
    expect(result.limit).toBe(3);
    expect(result.remaining).toBe(1);
  });

  it("blocks when zone count equals the limit", async () => {
    const supabase = makeSupabase(makeOrg(), makePlanLimits({ max_zones: 3 }), {
      locations: { data: [{ id: "loc-1" }], error: null },
      restaurant_zones: { count: 3, data: null, error: null },
    });
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "zones");
    expect(result.allowed).toBe(false);
  });

  it("allows when the org has no locations yet (0 zones)", async () => {
    const supabase = makeSupabase(makeOrg(), makePlanLimits({ max_zones: 3 }), {
      locations: { data: [], error: null },
    });
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "zones");
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(0);
  });
});

// ── contacts_wa ───────────────────────────────────────────────────────────────

describe("checkResourceAvailability — contacts_wa", () => {
  it("allows when usage is under the cap", async () => {
    const supabase = makeSupabase(
      makeOrg({ usage_cap_whatsapp: 400, whatsapp_usage_count: 100 }),
      makePlanLimits(),
    );
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "contacts_wa");
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(100);
    expect(result.limit).toBe(400);
    expect(result.remaining).toBe(300);
  });

  it("blocks when usage hits the cap", async () => {
    const supabase = makeSupabase(
      makeOrg({ usage_cap_whatsapp: 400, whatsapp_usage_count: 400 }),
      makePlanLimits(),
    );
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "contacts_wa");
    expect(result.allowed).toBe(false);
  });
});

// ── storage ───────────────────────────────────────────────────────────────────

describe("checkResourceAvailability — storage", () => {
  const MB = 1024 * 1024;
  const limitBytes = 300 * MB; // starter: 300 MB
  const hardCapBytes = Math.floor(limitBytes * 1.1); // 330 MB

  it("allows and has no warning when well under the limit", async () => {
    const supabase = makeSupabase(
      makeOrg({ total_storage_used: 100 * MB }),
      makePlanLimits({ storage_mb: 300 }),
    );
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "storage");
    expect(result.allowed).toBe(true);
    expect(result.softCapWarning).toBe(false);
    expect(result.current).toBe(100 * MB);
  });

  it("raises softCapWarning at exactly 100% of the plan limit", async () => {
    const supabase = makeSupabase(
      makeOrg({ total_storage_used: limitBytes }),
      makePlanLimits({ storage_mb: 300 }),
    );
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "storage");
    expect(result.allowed).toBe(true); // still allowed (hard cap is 110%)
    expect(result.softCapWarning).toBe(true);
  });

  it("blocks at the hard cap (110% of plan limit)", async () => {
    const supabase = makeSupabase(
      makeOrg({ total_storage_used: hardCapBytes }),
      makePlanLimits({ storage_mb: 300 }),
    );
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "storage");
    expect(result.allowed).toBe(false);
    expect(result.softCapWarning).toBe(true);
  });

  it("addon extra_storage_mb extends the limit", async () => {
    // Org is at 350 MB used, plan is 300 MB, but addon adds 500 MB → total 800 MB
    const supabase = makeSupabase(
      makeOrg({ total_storage_used: 350 * MB, addons_config: { extra_storage_mb: 500 } }),
      makePlanLimits({ storage_mb: 300 }),
    );
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "storage");
    expect(result.allowed).toBe(true);
    expect(result.softCapWarning).toBe(false);
    expect(result.limit).toBe(800 * MB);
  });
});

// ── kb_chars ─────────────────────────────────────────────────────────────────

describe("checkResourceAvailability — kb_chars", () => {
  it("uses billing_tier base chars for starter (5000)", async () => {
    const supabase = makeSupabase(
      makeOrg({ billing_tier: "starter" }),
      makePlanLimits(),
      {
        knowledge_base: {
          data: [{ title: "Hello", content: "World" }], // 5 + 5 = 10 chars
          error: null,
        },
      },
    );
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "kb_chars");
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(10);
    expect(result.limit).toBe(5_000);
    expect(result.remaining).toBe(4_990);
  });

  it("uses higher base for growth tier (20000)", async () => {
    const supabase = makeSupabase(
      makeOrg({ billing_tier: "growth" }),
      makePlanLimits(),
      { knowledge_base: { data: [], error: null } },
    );
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "kb_chars");
    expect(result.limit).toBe(20_000);
  });

  it("blocks when chars used exceeds limit", async () => {
    // starter limit is 5000; 5001 chars used → blocked
    const longContent = "x".repeat(5001);
    const supabase = makeSupabase(
      makeOrg({ billing_tier: "starter" }),
      makePlanLimits(),
      {
        knowledge_base: {
          data: [{ title: "", content: longContent }],
          error: null,
        },
      },
    );
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "kb_chars");
    expect(result.allowed).toBe(false);
    expect(result.current).toBe(5_001);
  });

  it("addon extra_kb_chars extends the limit", async () => {
    const supabase = makeSupabase(
      makeOrg({ billing_tier: "starter", addons_config: { extra_kb_chars: 5_000 } }),
      makePlanLimits(),
      { knowledge_base: { data: [{ title: "", content: "x".repeat(4_800) }], error: null } },
    );
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "kb_chars");
    expect(result.allowed).toBe(true); // 4800 < 10000
    expect(result.limit).toBe(10_000);
  });

  it("handles empty knowledge base (0 chars used)", async () => {
    const supabase = makeSupabase(makeOrg(), makePlanLimits(), {
      knowledge_base: { data: [], error: null },
    });
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "kb_chars");
    expect(result.current).toBe(0);
    expect(result.allowed).toBe(true);
  });
});

// ── analytics ─────────────────────────────────────────────────────────────────

describe("checkResourceAvailability — analytics", () => {
  it("blocks for starter tier without analytics addon", async () => {
    const supabase = makeSupabase(makeOrg({ billing_tier: "starter" }), makePlanLimits());
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "analytics");
    expect(result.allowed).toBe(false);
  });

  it("allows for growth tier (analytics included in plan)", async () => {
    const supabase = makeSupabase(makeOrg({ billing_tier: "growth" }), makePlanLimits());
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "analytics");
    expect(result.allowed).toBe(true);
  });

  it("allows for business tier", async () => {
    const supabase = makeSupabase(makeOrg({ billing_tier: "business" }), makePlanLimits());
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "analytics");
    expect(result.allowed).toBe(true);
  });

  it("allows for starter tier when analytics addon is purchased", async () => {
    const supabase = makeSupabase(
      makeOrg({ billing_tier: "starter", addons_config: { extra_analytics: 1 } }),
      makePlanLimits(),
    );
    const result = await checkResourceAvailability(supabase as any, ORG_ID, "analytics");
    expect(result.allowed).toBe(true);
  });
});
