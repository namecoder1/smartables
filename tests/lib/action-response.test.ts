import { describe, it, expect } from "vitest";
import { ok, okWith, fail } from "@/lib/action-response";

describe("lib/action-response", () => {
  describe("ok()", () => {
    it("returns success:true with no extra fields when called without args", () => {
      const result = ok();
      expect(result).toEqual({ success: true });
    });

    it("includes message when provided", () => {
      const result = ok("Salvato con successo");
      expect(result).toEqual({ success: true, message: "Salvato con successo" });
    });

    it("omits the message key entirely when not provided", () => {
      const result = ok();
      expect("message" in result).toBe(false);
    });
  });

  describe("okWith()", () => {
    it("returns success:true with the data payload", () => {
      const data = { id: "abc", name: "Test" };
      expect(okWith(data)).toEqual({ success: true, data });
    });

    it("includes optional message alongside data", () => {
      expect(okWith(42, "Done")).toEqual({ success: true, data: 42, message: "Done" });
    });

    it("omits message key when not provided", () => {
      const result = okWith({ id: 1 });
      expect("message" in result).toBe(false);
    });

    it("works with array payloads", () => {
      const result = okWith([1, 2, 3]);
      expect(result.success).toBe(true);
      expect(result.data).toEqual([1, 2, 3]);
    });

    it("works with null data", () => {
      expect(okWith(null)).toEqual({ success: true, data: null });
    });

    it("works with string payloads", () => {
      expect(okWith("ciao")).toEqual({ success: true, data: "ciao" });
    });
  });

  describe("fail()", () => {
    it("returns success:false with the error string", () => {
      expect(fail("Qualcosa è andato storto")).toEqual({
        success: false,
        error: "Qualcosa è andato storto",
      });
    });

    it("preserves the exact error message without modification", () => {
      const msg = "Limite account staff raggiunto. Aggiorna il piano.";
      expect(fail(msg).error).toBe(msg);
    });

    it("works with an empty string error", () => {
      expect(fail("")).toEqual({ success: false, error: "" });
    });
  });

  describe("type narrowing", () => {
    it("success result has no error key", () => {
      expect("error" in ok()).toBe(false);
    });

    it("fail result has no data key", () => {
      expect("data" in fail("err")).toBe(false);
    });

    it("okWith result has no error key", () => {
      expect("error" in okWith(1)).toBe(false);
    });
  });
});
