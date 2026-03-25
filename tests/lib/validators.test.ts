import { describe, it, expect } from "vitest";
import {
  validateBookingFields,
  validateGuestFields,
  validatePublicBookingFields,
} from "@/lib/validators/booking";

// ── validateBookingFields ────────────────────────────────────────────────────

describe("validateBookingFields", () => {
  const valid = {
    guestsCount: 2,
    bookingTime: "2026-06-15T20:00:00Z",
    locationId: "loc-123",
  };

  it("returns null for fully valid fields", () => {
    expect(validateBookingFields(valid)).toBeNull();
  });

  it("returns an error string (not boolean) when invalid", () => {
    const result = validateBookingFields({ ...valid, guestsCount: 0 });
    expect(typeof result).toBe("string");
    expect(result).not.toBeNull();
  });

  it("fails when guestsCount is 0 (falsy)", () => {
    expect(validateBookingFields({ ...valid, guestsCount: 0 })).toBeTruthy();
  });

  it("fails when bookingTime is empty", () => {
    expect(validateBookingFields({ ...valid, bookingTime: "" })).toBeTruthy();
  });

  it("fails when locationId is null", () => {
    expect(validateBookingFields({ ...valid, locationId: null })).toBeTruthy();
  });

  it("fails when all fields are missing", () => {
    expect(
      validateBookingFields({ guestsCount: 0, bookingTime: "", locationId: null }),
    ).toBeTruthy();
  });

  it("allows guestsCount of 1", () => {
    expect(validateBookingFields({ ...valid, guestsCount: 1 })).toBeNull();
  });
});

// ── validateGuestFields ──────────────────────────────────────────────────────

describe("validateGuestFields", () => {
  const valid = { guestName: "Mario Rossi", guestPhone: "+39 02 1234567" };

  it("returns null for valid fields", () => {
    expect(validateGuestFields(valid)).toBeNull();
  });

  it("fails when guestName is empty", () => {
    expect(validateGuestFields({ ...valid, guestName: "" })).toBeTruthy();
  });

  it("fails when guestPhone is empty", () => {
    expect(validateGuestFields({ ...valid, guestPhone: "" })).toBeTruthy();
  });

  it("fails when both fields are empty", () => {
    expect(validateGuestFields({ guestName: "", guestPhone: "" })).toBeTruthy();
  });

  it("returns an error string (not boolean)", () => {
    const result = validateGuestFields({ guestName: "", guestPhone: "" });
    expect(typeof result).toBe("string");
  });
});

// ── validatePublicBookingFields ──────────────────────────────────────────────

describe("validatePublicBookingFields", () => {
  const valid = {
    locationId: "loc-1",
    organizationId: "org-1",
    guestName: "Mario Rossi",
    guestPhone: "+39021234567",
    date: "2026-06-15",
    time: "20:00",
  };

  it("returns null when all fields are present", () => {
    expect(validatePublicBookingFields(valid)).toBeNull();
  });

  it("returns Italian error text on failure", () => {
    const result = validatePublicBookingFields({ ...valid, guestName: "" });
    expect(result).toMatch(/Compila/);
  });

  // Each required field, when empty, triggers a failure
  it.each([
    "locationId",
    "organizationId",
    "guestName",
    "guestPhone",
    "date",
    "time",
  ] as const)("fails when %s is empty", (field) => {
    expect(
      validatePublicBookingFields({ ...valid, [field]: "" }),
    ).toBeTruthy();
  });

  it("returns an error string (not boolean)", () => {
    const result = validatePublicBookingFields({ ...valid, date: "" });
    expect(typeof result).toBe("string");
  });
});
