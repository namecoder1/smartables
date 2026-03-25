import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  computeAddonConfig,
  ADDON_UNIT_VALUE,
  BASE_KB_CHARS_BY_TIER,
  BASE_STAFF_BY_TIER,
  DEFAULT_ADDON_CONFIG,
  DEFAULT_BASE_KB_CHARS,
} from "@/lib/addons";

// ── Constants ────────────────────────────────────────────────────────────────

describe("BASE_KB_CHARS_BY_TIER", () => {
  it("starter has 5000 base chars", () => {
    expect(BASE_KB_CHARS_BY_TIER["starter"]).toBe(5_000);
  });

  it("growth has 20000 base chars", () => {
    expect(BASE_KB_CHARS_BY_TIER["growth"]).toBe(20_000);
  });

  it("business has 50000 base chars", () => {
    expect(BASE_KB_CHARS_BY_TIER["business"]).toBe(50_000);
  });

  it("growth has 4× the starter allowance", () => {
    expect(BASE_KB_CHARS_BY_TIER["growth"]).toBe(BASE_KB_CHARS_BY_TIER["starter"] * 4);
  });
});

describe("BASE_STAFF_BY_TIER", () => {
  it("starter has 5 staff", () => {
    expect(BASE_STAFF_BY_TIER["starter"]).toBe(5);
  });

  it("growth has 15 staff", () => {
    expect(BASE_STAFF_BY_TIER["growth"]).toBe(15);
  });

  it("business staff count is effectively unlimited (10000)", () => {
    expect(BASE_STAFF_BY_TIER["business"]).toBeGreaterThanOrEqual(10_000);
  });
});

describe("ADDON_UNIT_VALUE", () => {
  it("staff pack adds 5 per unit", () => {
    expect(ADDON_UNIT_VALUE["extra_staff"]).toBe(5);
  });

  it("contacts_wa pack adds 200 per unit", () => {
    expect(ADDON_UNIT_VALUE["extra_contacts_wa"]).toBe(200);
  });

  it("storage pack adds 500 MB per unit", () => {
    expect(ADDON_UNIT_VALUE["extra_storage_mb"]).toBe(500);
  });

  it("location pack adds 1 per unit", () => {
    expect(ADDON_UNIT_VALUE["extra_locations"]).toBe(1);
  });

  it("kb pack adds 5000 chars per unit", () => {
    expect(ADDON_UNIT_VALUE["extra_kb_chars"]).toBe(5_000);
  });

  it("analytics is a binary toggle (1 per unit)", () => {
    expect(ADDON_UNIT_VALUE["extra_analytics"]).toBe(1);
  });
});

describe("DEFAULT_ADDON_CONFIG", () => {
  it("starts all addons at zero", () => {
    for (const value of Object.values(DEFAULT_ADDON_CONFIG)) {
      expect(value).toBe(0);
    }
  });

  it("has all expected keys", () => {
    expect(DEFAULT_ADDON_CONFIG).toMatchObject({
      extra_staff: 0,
      extra_contacts_wa: 0,
      extra_storage_mb: 0,
      extra_locations: 0,
      extra_kb_chars: 0,
      extra_analytics: 0,
    });
  });
});

describe("DEFAULT_BASE_KB_CHARS", () => {
  it("equals the starter tier base chars", () => {
    expect(DEFAULT_BASE_KB_CHARS).toBe(BASE_KB_CHARS_BY_TIER["starter"]);
  });
});

// ── computeAddonConfig ───────────────────────────────────────────────────────

describe("computeAddonConfig", () => {
  const STAFF_PRICE = "price_staff_test";
  const WA_PRICE = "price_wa_test";
  const KB_PRICE = "price_kb_test";
  const ANALYTICS_PRICE = "price_analytics_test";

  beforeEach(() => {
    vi.stubEnv("STRIPE_PRICE_ADDON_STAFF", STAFF_PRICE);
    vi.stubEnv("STRIPE_PRICE_ADDON_CONTACTS_WA", WA_PRICE);
    vi.stubEnv("STRIPE_PRICE_ADDON_KB", KB_PRICE);
    vi.stubEnv("STRIPE_PRICE_ADDON_ANALYTICS", ANALYTICS_PRICE);
    // Leave LOCATION and STORAGE unset to verify graceful handling
    vi.stubEnv("STRIPE_PRICE_ADDON_LOCATION", "");
    vi.stubEnv("STRIPE_PRICE_ADDON_STORAGE", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns all-zero config for an empty items list", () => {
    expect(computeAddonConfig([])).toEqual(DEFAULT_ADDON_CONFIG);
  });

  it("ignores items whose price ID is not in the addon map", () => {
    const result = computeAddonConfig([{ price: { id: "price_unknown" }, quantity: 5 }]);
    expect(result).toEqual(DEFAULT_ADDON_CONFIG);
  });

  it("adds correct capacity for a single staff pack (qty 1 → +5 staff)", () => {
    const result = computeAddonConfig([{ price: { id: STAFF_PRICE }, quantity: 1 }]);
    expect(result.extra_staff).toBe(5);
    expect(result.extra_contacts_wa).toBe(0);
  });

  it("multiplies by quantity (qty 3 staff packs → +15 staff)", () => {
    const result = computeAddonConfig([{ price: { id: STAFF_PRICE }, quantity: 3 }]);
    expect(result.extra_staff).toBe(15);
  });

  it("accumulates multiple different addons", () => {
    const result = computeAddonConfig([
      { price: { id: STAFF_PRICE }, quantity: 2 },   // +10 staff
      { price: { id: WA_PRICE }, quantity: 1 },       // +200 wa contacts
      { price: { id: ANALYTICS_PRICE }, quantity: 1 }, // +1 analytics
    ]);
    expect(result.extra_staff).toBe(10);
    expect(result.extra_contacts_wa).toBe(200);
    expect(result.extra_analytics).toBe(1);
    expect(result.extra_kb_chars).toBe(0);
  });

  it("defaults missing quantity to 1", () => {
    const result = computeAddonConfig([{ price: { id: KB_PRICE }, quantity: null }]);
    expect(result.extra_kb_chars).toBe(5_000);
  });

  it("analytics addon > 0 after purchase (boolean-style check)", () => {
    const result = computeAddonConfig([{ price: { id: ANALYTICS_PRICE }, quantity: 1 }]);
    expect(result.extra_analytics).toBeGreaterThan(0);
  });
});
