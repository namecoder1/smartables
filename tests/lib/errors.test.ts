import { describe, it, expect } from "vitest";
import {
  SmartablesError,
  NotFoundError,
  UnauthorizedError,
  UsageLimitError,
  ExternalServiceError,
  ValidationError,
  isSmartablesError,
} from "@/lib/errors";

describe("lib/errors", () => {
  describe("SmartablesError (base class)", () => {
    it("sets message, code and default statusCode", () => {
      const err = new SmartablesError("qualcosa è andato storto", "SOME_CODE");
      expect(err.message).toBe("qualcosa è andato storto");
      expect(err.code).toBe("SOME_CODE");
      expect(err.statusCode).toBe(500);
      expect(err.name).toBe("SmartablesError");
    });

    it("allows overriding statusCode", () => {
      const err = new SmartablesError("msg", "CODE", 418);
      expect(err.statusCode).toBe(418);
    });

    it("is an instance of Error", () => {
      const err = new SmartablesError("msg", "CODE");
      expect(err).toBeInstanceOf(Error);
    });

    it("has a stack trace", () => {
      const err = new SmartablesError("msg", "CODE");
      expect(err.stack).toBeDefined();
    });
  });

  describe("NotFoundError", () => {
    it("formats message with resource name", () => {
      const err = new NotFoundError("Location");
      expect(err.message).toBe("Location non trovato");
    });

    it("sets statusCode 404", () => {
      expect(new NotFoundError("Booking").statusCode).toBe(404);
    });

    it("sets code NOT_FOUND", () => {
      expect(new NotFoundError("X").code).toBe("NOT_FOUND");
    });

    it("sets name NotFoundError", () => {
      expect(new NotFoundError("X").name).toBe("NotFoundError");
    });

    it("is instanceof SmartablesError", () => {
      expect(new NotFoundError("X")).toBeInstanceOf(SmartablesError);
    });
  });

  describe("UnauthorizedError", () => {
    it("uses default message when no detail provided", () => {
      const err = new UnauthorizedError();
      expect(err.message).toBe("Non autorizzato");
    });

    it("uses custom detail when provided", () => {
      const err = new UnauthorizedError("Token scaduto");
      expect(err.message).toBe("Token scaduto");
    });

    it("sets statusCode 401", () => {
      expect(new UnauthorizedError().statusCode).toBe(401);
    });

    it("sets code UNAUTHORIZED", () => {
      expect(new UnauthorizedError().code).toBe("UNAUTHORIZED");
    });

    it("sets name UnauthorizedError", () => {
      expect(new UnauthorizedError().name).toBe("UnauthorizedError");
    });
  });

  describe("UsageLimitError", () => {
    it("formats message with plan feature", () => {
      const err = new UsageLimitError("contatti WhatsApp");
      expect(err.message).toBe("Limite contatti WhatsApp raggiunto per il piano attuale");
    });

    it("sets statusCode 429", () => {
      expect(new UsageLimitError("staff").statusCode).toBe(429);
    });

    it("sets code USAGE_LIMIT", () => {
      expect(new UsageLimitError("menus").code).toBe("USAGE_LIMIT");
    });

    it("sets name UsageLimitError", () => {
      expect(new UsageLimitError("X").name).toBe("UsageLimitError");
    });
  });

  describe("ExternalServiceError", () => {
    it("formats message with service name only", () => {
      const err = new ExternalServiceError("Telnyx");
      expect(err.message).toBe("Errore Telnyx");
    });

    it("includes detail when provided", () => {
      const err = new ExternalServiceError("OpenAI", "timeout");
      expect(err.message).toBe("Errore OpenAI: timeout");
    });

    it("sets statusCode 502", () => {
      expect(new ExternalServiceError("Stripe").statusCode).toBe(502);
    });

    it("sets code EXTERNAL_SERVICE_ERROR", () => {
      expect(new ExternalServiceError("X").code).toBe("EXTERNAL_SERVICE_ERROR");
    });

    it("sets name ExternalServiceError", () => {
      expect(new ExternalServiceError("X").name).toBe("ExternalServiceError");
    });
  });

  describe("ValidationError", () => {
    it("formats message with detail", () => {
      const err = new ValidationError("telefono non valido");
      expect(err.message).toBe("Dati non validi: telefono non valido");
    });

    it("sets statusCode 400", () => {
      expect(new ValidationError("x").statusCode).toBe(400);
    });

    it("sets code VALIDATION_ERROR", () => {
      expect(new ValidationError("x").code).toBe("VALIDATION_ERROR");
    });

    it("sets name ValidationError", () => {
      expect(new ValidationError("x").name).toBe("ValidationError");
    });
  });

  describe("isSmartablesError()", () => {
    it("returns true for SmartablesError instance", () => {
      expect(isSmartablesError(new SmartablesError("msg", "CODE"))).toBe(true);
    });

    it("returns true for any subclass instance", () => {
      expect(isSmartablesError(new NotFoundError("X"))).toBe(true);
      expect(isSmartablesError(new UnauthorizedError())).toBe(true);
      expect(isSmartablesError(new UsageLimitError("X"))).toBe(true);
      expect(isSmartablesError(new ExternalServiceError("X"))).toBe(true);
      expect(isSmartablesError(new ValidationError("X"))).toBe(true);
    });

    it("returns false for plain Error", () => {
      expect(isSmartablesError(new Error("plain error"))).toBe(false);
    });

    it("returns false for null", () => {
      expect(isSmartablesError(null)).toBe(false);
    });

    it("returns false for a string", () => {
      expect(isSmartablesError("not an error")).toBe(false);
    });

    it("returns false for a plain object", () => {
      expect(isSmartablesError({ message: "fake", code: "X", statusCode: 500 })).toBe(false);
    });
  });
});
