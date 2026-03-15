import { describe, it, expect } from "vitest";
import {
  isMenuActive,
  isMenuAvailableAtTime,
  filterActiveMenus,
  isZoneBlocked,
} from "@/lib/menu-helpers";

// Fixed reference point: 2025-06-15 12:00 UTC
const NOW = new Date("2025-06-15T12:00:00Z");
const PAST = "2025-01-01T00:00:00Z";
const FUTURE = "2026-01-01T00:00:00Z";

describe("lib/menu-helpers", () => {
  describe("isMenuActive", () => {
    it("returns false for null", () => {
      expect(isMenuActive(null, NOW)).toBe(false);
    });

    it("returns false when is_active is false", () => {
      expect(isMenuActive({ is_active: false }, NOW)).toBe(false);
    });

    it("returns true with no date range", () => {
      expect(isMenuActive({}, NOW)).toBe(true);
    });

    it("returns true when now is within starts_at/ends_at", () => {
      expect(isMenuActive({ starts_at: PAST, ends_at: FUTURE }, NOW)).toBe(true);
    });

    it("returns false when now is before starts_at", () => {
      expect(isMenuActive({ starts_at: FUTURE }, NOW)).toBe(false);
    });

    it("returns false when now is after ends_at", () => {
      expect(isMenuActive({ ends_at: PAST }, NOW)).toBe(false);
    });

    it("returns true when only starts_at is set and now is past it", () => {
      expect(isMenuActive({ starts_at: PAST }, NOW)).toBe(true);
    });
  });

  describe("isMenuAvailableAtTime", () => {
    // Use local-time dates to avoid getHours() timezone drift in assertions
    const NOON = new Date("2025-06-15T12:00:00");
    const EARLY = new Date("2025-06-15T09:00:00");
    const LATE = new Date("2025-06-15T18:00:00");

    it("returns false for inactive menu", () => {
      expect(isMenuAvailableAtTime({ is_active: false }, null, NOON)).toBe(false);
    });

    it("returns true with no daily window", () => {
      expect(isMenuAvailableAtTime({}, null, NOON)).toBe(true);
    });

    it("returns true when time is within daily window", () => {
      expect(
        isMenuAvailableAtTime({}, { daily_from: "11:00", daily_until: "15:00" }, NOON),
      ).toBe(true);
    });

    it("returns false when time is before daily_from", () => {
      expect(
        isMenuAvailableAtTime({}, { daily_from: "11:00", daily_until: "15:00" }, EARLY),
      ).toBe(false);
    });

    it("returns false when time is after daily_until", () => {
      expect(
        isMenuAvailableAtTime({}, { daily_from: "11:00", daily_until: "15:00" }, LATE),
      ).toBe(false);
    });
  });

  describe("filterActiveMenus", () => {
    it("keeps only active menus and drops null/inactive entries", () => {
      const menus = [
        { is_active: true },
        { is_active: false },
        null,
        { starts_at: PAST, ends_at: FUTURE, is_active: true },
      ];
      expect(filterActiveMenus(menus, NOW)).toHaveLength(2);
    });

    it("returns empty array when all menus are inactive", () => {
      expect(filterActiveMenus([{ is_active: false }, null], NOW)).toHaveLength(0);
    });
  });

  describe("isZoneBlocked", () => {
    it("returns false for null zone", () => {
      expect(isZoneBlocked(null, NOW)).toBe(false);
    });

    it("returns false when no blocking dates are set", () => {
      expect(isZoneBlocked({}, NOW)).toBe(false);
    });

    it("returns true when now is within the blocked range", () => {
      expect(
        isZoneBlocked({ blocked_from: PAST, blocked_until: FUTURE }, NOW),
      ).toBe(true);
    });

    it("returns false when now is before the blocked range", () => {
      expect(
        isZoneBlocked({ blocked_from: FUTURE, blocked_until: FUTURE }, NOW),
      ).toBe(false);
    });

    it("returns false when now is after the blocked range", () => {
      expect(
        isZoneBlocked({ blocked_from: PAST, blocked_until: PAST }, NOW),
      ).toBe(false);
    });
  });
});
