import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  cn,
  getStatusBadgeVariant,
  mapStatusLabel,
  formatPhoneNumber,
  isDev,
} from "@/lib/utils";

describe("lib/utils", () => {
  describe("cn", () => {
    it("merges tailwind classes correctly", () => {
      expect(cn("bg-red-500", "p-4")).toBe("bg-red-500 p-4");
      expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500"); // tailwind-merge logic
    });
  });

  describe("getStatusBadgeVariant", () => {
    it("returns correct variants for statuses", () => {
      expect(getStatusBadgeVariant("confirmed")).toBe("default");
      expect(getStatusBadgeVariant("cancelled")).toBe("destructive");
      expect(getStatusBadgeVariant("pending")).toBe("secondary");
      expect(getStatusBadgeVariant("arrived")).toBe("outline");
      expect(getStatusBadgeVariant("unknown")).toBe("secondary");
    });
  });

  describe("mapStatusLabel", () => {
    it("returns correct Italian labels", () => {
      expect(mapStatusLabel("confirmed")).toBe("Confermato");
      expect(mapStatusLabel("cancelled")).toBe("Cancellato");
      expect(mapStatusLabel("pending")).toBe("In Attesa");
      expect(mapStatusLabel("arrived")).toBe("Arrivato");
      expect(mapStatusLabel("noshow")).toBe("Non Arrivato");
      expect(mapStatusLabel("custom")).toBe("custom");
    });
  });

  describe("formatPhoneNumber", () => {
    it("formats an Italian mobile number (10 digits starting with 3)", () => {
      expect(formatPhoneNumber("3331234567")).toBe("333 123 4567");
    });

    it("formats an Italian mobile number with extra digit (11 digits starting with 3)", () => {
      expect(formatPhoneNumber("33312345678")).toBe("+39 331 234 5678");
    });

    it("formats a number with non-digit characters stripped", () => {
      // "+39 333 123 4567" -> cleaned: "393331234567" (12 digits, starts with 3, > 11)
      // -> international format: +39 331 234 5670... wait let's trace
      // cleaned = "393331234567" length 12, starts with "3"
      // hits 3rd branch: startsWith('3') && length > 11
      // countryCode = "39", numberPart = "3331234567"
      // -> "+39 333 123 4567"
      expect(formatPhoneNumber("+39 333 123 4567")).toBe("+39 333 123 4567");
    });

    it("formats a number longer than 11 digits starting with 3", () => {
      expect(formatPhoneNumber("391234567890")).toBe("+39 123 456 7890");
    });

    it("formats a number longer than 10 digits not starting with 3", () => {
      expect(formatPhoneNumber("441234567890")).toBe("+44 1234567890");
    });

    it("returns original for unknown short format", () => {
      expect(formatPhoneNumber("12345")).toBe("12345");
    });

    it("handles empty string", () => {
      expect(formatPhoneNumber("")).toBe("");
    });
  });

  describe("isDev", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("returns true in development", () => {
      vi.stubEnv("NODE_ENV", "development");
      expect(isDev()).toBe(true);
    });

    it("returns false in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      expect(isDev()).toBe(false);
    });

    it("returns false for test", () => {
      vi.stubEnv("NODE_ENV", "test");
      expect(isDev()).toBe(false);
    });
  });
});
