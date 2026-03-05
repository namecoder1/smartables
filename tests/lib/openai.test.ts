import { describe, it, expect } from "vitest";
import { extractVerificationCode } from "@/lib/openai";

describe("lib/openai", () => {
  describe("extractVerificationCode", () => {
    it("extracts a 6-digit code from clean text", () => {
      expect(extractVerificationCode("Your code is 123456")).toBe("123456");
    });

    it("extracts a 6-digit code with spaces between digits", () => {
      expect(extractVerificationCode("Your code is 1 2 3 4 5 6")).toBe(
        "123456",
      );
    });

    it("extracts a 6-digit code with commas and spaces", () => {
      expect(extractVerificationCode("Code: 1, 2, 3, 4, 5, 6")).toBe("123456");
    });

    it("extracts the first 6-digit sequence when multiple exist", () => {
      expect(extractVerificationCode("Code 123456 and 789012")).toBe("123456");
    });

    it("returns null when no 6-digit code is present", () => {
      expect(extractVerificationCode("Your code is 12345")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(extractVerificationCode("")).toBeNull();
    });

    it("returns null for text with no digits", () => {
      expect(extractVerificationCode("Hello world")).toBeNull();
    });

    it("extracts code from a realistic Whisper transcription", () => {
      expect(
        extractVerificationCode(
          "The verification code is 1 2 3 4 5 6. Thank you.",
        ),
      ).toBe("123456");
    });
  });
});
