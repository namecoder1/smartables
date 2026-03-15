/**
 * Gerarchia di errori custom per Smartables.
 *
 * Usare queste classi quando si vuole propagare un errore strutturato con un
 * codice e uno status HTTP, utile nei webhook handler e nei Trigger.dev task.
 *
 * Per i Server Actions usare invece `fail()` da `@/lib/action-response`.
 *
 * @example
 * throw new NotFoundError("Location");
 * throw new UsageLimitError("contatti WhatsApp");
 * throw new ExternalServiceError("Telnyx", "Numero non disponibile");
 */

export class SmartablesError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = "SmartablesError";
    // Mantiene lo stack trace corretto in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/** Risorsa non trovata — HTTP 404 */
export class NotFoundError extends SmartablesError {
  constructor(resource: string) {
    super(`${resource} non trovato`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

/** Utente non autenticato o non autorizzato — HTTP 401 */
export class UnauthorizedError extends SmartablesError {
  constructor(detail?: string) {
    super(detail ?? "Non autorizzato", "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

/** Limite del piano raggiunto — HTTP 429 */
export class UsageLimitError extends SmartablesError {
  constructor(planFeature: string) {
    super(
      `Limite ${planFeature} raggiunto per il piano attuale`,
      "USAGE_LIMIT",
      429,
    );
    this.name = "UsageLimitError";
  }
}

/** Errore da un servizio esterno (Telnyx, WhatsApp, OpenAI, Stripe) — HTTP 502 */
export class ExternalServiceError extends SmartablesError {
  constructor(service: string, detail?: string) {
    super(
      `Errore ${service}${detail ? `: ${detail}` : ""}`,
      "EXTERNAL_SERVICE_ERROR",
      502,
    );
    this.name = "ExternalServiceError";
  }
}

/** Dati in input non validi — HTTP 400 */
export class ValidationError extends SmartablesError {
  constructor(detail: string) {
    super(`Dati non validi: ${detail}`, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

/**
 * Type guard — verifica se un errore è un'istanza di SmartablesError.
 *
 * @example
 * catch (err) {
 *   if (isSmartablesError(err)) {
 *     return NextResponse.json({ error: err.message }, { status: err.statusCode });
 *   }
 *   throw err; // re-throw errori sconosciuti
 * }
 */
export function isSmartablesError(err: unknown): err is SmartablesError {
  return err instanceof SmartablesError;
}
