import { describe, it, expect } from "vitest";
import { isRouteGroup, type RouteEntry } from "@/lib/routes";

describe("lib/routes", () => {
  describe("isRouteGroup", () => {
    it("returns true for a route group (has items array)", () => {
      const group: RouteEntry = {
        label: "Prenotazioni",
        items: [{ title: "Mappa", url: "/area-management", icon: () => null }],
      };
      expect(isRouteGroup(group)).toBe(true);
    });

    it("returns false for a single route (has url, no items)", () => {
      const single: RouteEntry = {
        label: "Dashboard",
        url: "/dashboard",
        icon: () => null,
      };
      expect(isRouteGroup(single)).toBe(false);
    });

    it("returns true even if items array is empty", () => {
      const emptyGroup: RouteEntry = {
        label: "Empty Group",
        items: [],
      };
      expect(isRouteGroup(emptyGroup)).toBe(true);
    });
  });
});
