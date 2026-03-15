import { describe, it, expect } from "vitest";
import {
  getStr,
  getNullableStr,
  getInt,
  getBool,
  getFile,
  getJson,
} from "@/lib/form-parsers";

function makeForm(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.append(k, v);
  return fd;
}

describe("lib/form-parsers", () => {
  describe("getStr", () => {
    it("returns the string value", () => {
      expect(getStr(makeForm({ name: "Alice" }), "name")).toBe("Alice");
    });

    it("returns empty string when key is absent", () => {
      expect(getStr(makeForm({}), "name")).toBe("");
    });
  });

  describe("getNullableStr", () => {
    it("returns trimmed string", () => {
      expect(getNullableStr(makeForm({ city: "  Rome  " }), "city")).toBe("Rome");
    });

    it("returns null when key is absent", () => {
      expect(getNullableStr(makeForm({}), "city")).toBeNull();
    });

    it("returns null for blank-only string", () => {
      expect(getNullableStr(makeForm({ city: "   " }), "city")).toBeNull();
    });
  });

  describe("getInt", () => {
    it("parses a valid integer", () => {
      expect(getInt(makeForm({ count: "42" }), "count")).toBe(42);
    });

    it("returns 0 by default when absent", () => {
      expect(getInt(makeForm({}), "count")).toBe(0);
    });

    it("returns custom fallback when absent", () => {
      expect(getInt(makeForm({}), "count", 5)).toBe(5);
    });

    it("returns fallback for non-numeric value", () => {
      expect(getInt(makeForm({ count: "abc" }), "count")).toBe(0);
    });
  });

  describe("getBool", () => {
    it("returns true for string 'true'", () => {
      expect(getBool(makeForm({ flag: "true" }), "flag")).toBe(true);
    });

    it("returns false for string 'false'", () => {
      expect(getBool(makeForm({ flag: "false" }), "flag")).toBe(false);
    });

    it("returns false when key is absent", () => {
      expect(getBool(makeForm({}), "flag")).toBe(false);
    });

    it("returns false for '1' (only 'true' maps to true)", () => {
      expect(getBool(makeForm({ flag: "1" }), "flag")).toBe(false);
    });
  });

  describe("getFile", () => {
    it("returns File when present", () => {
      const fd = new FormData();
      fd.append("upload", new File(["data"], "test.txt"));
      expect(getFile(fd, "upload")).toBeInstanceOf(File);
    });

    it("returns null when key is absent", () => {
      expect(getFile(makeForm({}), "upload")).toBeNull();
    });

    it("returns null for a plain string value", () => {
      expect(getFile(makeForm({ upload: "path/to/file" }), "upload")).toBeNull();
    });
  });

  describe("getJson", () => {
    it("parses a valid JSON object", () => {
      const fd = makeForm({ config: JSON.stringify({ foo: 1 }) });
      expect(getJson(fd, "config", {})).toEqual({ foo: 1 });
    });

    it("returns fallback when key is absent", () => {
      expect(getJson(makeForm({}), "config", { default: true })).toEqual({
        default: true,
      });
    });

    it("returns fallback for malformed JSON", () => {
      expect(getJson(makeForm({ config: "{invalid}" }), "config", [])).toEqual(
        [],
      );
    });
  });
});
