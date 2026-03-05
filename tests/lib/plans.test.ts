import { describe, it, expect, vi, afterEach } from "vitest";

// We need to mock isDev since plans.ts imports it at module level
vi.mock("@/lib/utils", () => ({
  isDev: vi.fn(() => true), // default to dev mode for test price IDs
}));

import { PLANS, findPlanByPriceId } from "@/lib/plans";

describe("lib/plans", () => {
  describe("PLANS constant", () => {
    it("contains 3 plans", () => {
      expect(PLANS).toHaveLength(3);
    });

    it("has correct plan IDs", () => {
      const ids = PLANS.map((p) => p.id);
      expect(ids).toEqual(["starter", "pro", "business"]);
    });

    it("each plan has required fields", () => {
      for (const plan of PLANS) {
        expect(plan).toHaveProperty("id");
        expect(plan).toHaveProperty("name");
        expect(plan).toHaveProperty("priceMonth");
        expect(plan).toHaveProperty("priceYear");
        expect(plan).toHaveProperty("features");
        expect(Array.isArray(plan.features)).toBe(true);
        expect(plan.features.length).toBeGreaterThan(0);
      }
    });

    it("only one plan is marked as popular", () => {
      const popularPlans = PLANS.filter((p) => p.popular);
      expect(popularPlans).toHaveLength(1);
      expect(popularPlans[0].id).toBe("pro");
    });
  });

  describe("findPlanByPriceId", () => {
    it("finds a plan by monthly price ID", () => {
      const plan = findPlanByPriceId(PLANS[0].priceIdMonth!);
      expect(plan).toBeDefined();
      expect(plan?.id).toBe("starter");
    });

    it("finds a plan by yearly price ID", () => {
      const plan = findPlanByPriceId(PLANS[1].priceIdYear!);
      expect(plan).toBeDefined();
      expect(plan?.id).toBe("pro");
    });

    it("returns undefined for an unknown price ID", () => {
      const plan = findPlanByPriceId("price_nonexistent_123");
      expect(plan).toBeUndefined();
    });

    it("returns undefined for empty string", () => {
      const plan = findPlanByPriceId("");
      expect(plan).toBeUndefined();
    });
  });
});
