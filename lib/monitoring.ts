/**
 * Centralized error monitoring helper for GlitchTip (Sentry-compatible).
 *
 * Usage:
 *   captureError(err, { service: "stripe", flow: "subscription_update", organizationId })
 *   captureCritical(err, { service: "whatsapp", flow: "booking_creation", locationId, bookingId })
 *   captureWarning("Org not found for invoice", { service: "stripe", flow: "payment_succeeded", stripeInvoiceId })
 *
 * Tags (searchable in GlitchTip):
 *   - service: which external integration failed
 *   - flow: which specific business flow was affected
 *
 * Levels:
 *   - fatal  → data loss / revenue impact (captureCritical)
 *   - error  → something broke, needs fixing (captureError)
 *   - warning → suspicious state, no immediate data loss (captureWarning)
 */

import * as Sentry from "@sentry/nextjs";
import { getClient } from "@sentry/nextjs";

type Service =
  | "stripe"
  | "whatsapp"
  | "telnyx"
  | "openai"
  | "google_calendar"
  | "supabase"
  | "resend"
  | "trigger";

export type MonitoringContext = {
  service?: Service;
  /** Which business flow this error belongs to (e.g. "booking_creation", "subscription_update") */
  flow?: string;
  organizationId?: string;
  locationId?: string;
  bookingId?: string;
  customerId?: string;
  [key: string]: unknown;
};

/**
 * Ensures Sentry is initialized.
 * In Next.js, sentry.server.config.ts handles this.
 * In Trigger.dev workers (no Next.js instrumentation), we init lazily.
 */
function ensureInit() {
  if (getClient()) return;
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "production",
    tracesSampleRate: 0,
  });
}

function applyScope(
  scope: Sentry.Scope,
  level: Sentry.SeverityLevel,
  context: MonitoringContext,
) {
  scope.setLevel(level);
  if (context.service) scope.setTag("service", context.service);
  if (context.flow) scope.setTag("flow", context.flow);
  if (context.organizationId) scope.setUser({ id: context.organizationId });
  const { service: _s, flow: _f, organizationId: _o, ...extras } = context;
  scope.setExtras(extras as Record<string, unknown>);
}

/** Captures a non-fatal error (something broke but the system keeps running). */
export function captureError(error: unknown, context: MonitoringContext = {}) {
  ensureInit();
  Sentry.withScope((scope) => {
    applyScope(scope, "error", context);
    Sentry.captureException(
      error instanceof Error ? error : new Error(String(error)),
    );
  });
}

/**
 * Captures a critical error: data loss, revenue impact, system integrity at risk.
 * Shows as "fatal" in GlitchTip — highest priority.
 */
export function captureCritical(
  error: unknown,
  context: MonitoringContext = {},
) {
  ensureInit();
  Sentry.withScope((scope) => {
    applyScope(scope, "fatal", context);
    Sentry.captureException(
      error instanceof Error ? error : new Error(String(error)),
    );
  });
}

/**
 * Captures a warning: suspicious state that may require attention,
 * but no immediate data loss or breakage.
 */
export function captureWarning(
  message: string,
  context: MonitoringContext = {},
) {
  ensureInit();
  Sentry.withScope((scope) => {
    applyScope(scope, "warning", context);
    Sentry.captureMessage(message);
  });
}
