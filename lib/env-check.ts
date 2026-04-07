/**
 * Startup environment validation.
 *
 * Call assertEnv() once at module load in critical entry points
 * (webhooks, background jobs) to fail fast with a clear error
 * instead of crashing deep inside a handler with a cryptic message.
 *
 * Usage:
 *   import { assertEnv } from "@/lib/env-check";
 *   assertEnv(); // throws if any required var is missing
 *
 * In Next.js, import at the top of:
 *   - app/api/webhooks/<provider>/route.ts
 *   - trigger/<job>.ts
 */

type EnvVar = {
  name: string;
  /** If true, missing var throws. If false, logs a warning only. */
  required: boolean;
  /** Human-readable hint on where to get the value. */
  hint: string;
};

const ENV_VARS: EnvVar[] = [
  // Supabase
  { name: "NEXT_PUBLIC_SUPABASE_URL",      required: true,  hint: "Supabase Dashboard → Settings → API → Project URL" },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true,  hint: "Supabase Dashboard → Settings → API → anon key" },
  { name: "SUPABASE_SERVICE_ROLE_KEY",     required: true,  hint: "Supabase Dashboard → Settings → API → service_role key" },

  // Stripe
  { name: "STRIPE_SECRET_KEY",             required: true,  hint: "Stripe Dashboard → Developers → API keys → Secret key (live)" },
  { name: "STRIPE_WEBHOOK_KEY",            required: true,  hint: "Stripe Dashboard → Developers → Webhooks → Signing secret" },

  // Meta / WhatsApp
  { name: "META_SYSTEM_USER_TOKEN",        required: true,  hint: "Meta Business → System Users → token con permessi WhatsApp" },
  { name: "META_APP_SECRET",               required: true,  hint: "Meta Developers → App → Settings → Basic → App Secret" },
  { name: "WHATSAPP_BUSINESS_ACCOUNT_ID",  required: true,  hint: "Meta Business Manager → WhatsApp → Business Account ID" },
  { name: "WHATSAPP_WEBHOOK_VERIFY_TOKEN", required: true,  hint: "Token arbitrario inserito anche nel Meta Dashboard → Webhooks" },
  { name: "WHATSAPP_PRIVATE_KEY",          required: true,  hint: "Chiave RSA privata per WhatsApp Flows (genera con openssl)" },
  { name: "WHATSAPP_BOOKING_FLOW_ID",      required: true,  hint: "Meta Dashboard → Flows → ID del flow di prenotazione pubblicato" },

  // Telnyx
  { name: "TELNYX_API_KEY",               required: true,  hint: "Telnyx Portal → Auth → API Keys" },
  { name: "TELNYX_CONNECTION_ID",         required: true,  hint: "Telnyx Portal → Call Control → Application ID" },
  { name: "TELNYX_WEBHOOK_PUBLIC_KEY",    required: true,  hint: "Telnyx Portal → Webhooks → Ed25519 public key" },

  // OpenAI
  { name: "OPENAI_API_KEY",               required: true,  hint: "https://platform.openai.com/api-keys" },

  // Resend
  { name: "RESEND_API_KEY",               required: true,  hint: "https://resend.com/api-keys" },

  // Upstash Redis
  { name: "UPSTASH_REDIS_REST_URL",       required: true,  hint: "Upstash Console → Database → REST API → URL" },
  { name: "UPSTASH_REDIS_REST_TOKEN",     required: true,  hint: "Upstash Console → Database → REST API → Token" },

  // Google
  { name: "GOOGLE_CLIENT_ID",             required: true,  hint: "Google Cloud Console → Credentials → OAuth 2.0 Client ID" },
  { name: "GOOGLE_CLIENT_SECRET",         required: true,  hint: "Google Cloud Console → Credentials → OAuth 2.0 Client Secret" },

  // Trigger.dev
  { name: "TRIGGER_SECRET_KEY",           required: true,  hint: "cloud.trigger.dev → Project → API Keys" },

  // Encryption
  { name: "BUSINESS_CONNECTORS_ENCRYPTION_KEY", required: true, hint: "Genera con: openssl rand -base64 32" },

  // Optional
  { name: "NEXT_PUBLIC_SENTRY_DSN",       required: false, hint: "GlitchTip/Sentry → Project → Settings → DSN" },
];

let checked = false;

/**
 * Validates all required environment variables.
 * Throws a single aggregated error listing every missing variable.
 * Safe to call multiple times — only runs the check once.
 */
export function assertEnv(): void {
  if (checked) return;
  checked = true;

  const missing: EnvVar[] = [];
  const warned: EnvVar[] = [];

  for (const v of ENV_VARS) {
    const value = process.env[v.name];
    if (!value || value.trim() === "") {
      if (v.required) {
        missing.push(v);
      } else {
        warned.push(v);
      }
    }
  }

  if (warned.length > 0) {
    console.warn(
      "[env-check] Optional env vars not set:\n" +
        warned.map((v) => `  • ${v.name} — ${v.hint}`).join("\n"),
    );
  }

  if (missing.length > 0) {
    throw new Error(
      "[env-check] Missing required environment variables:\n" +
        missing.map((v) => `  • ${v.name}\n    → ${v.hint}`).join("\n") +
        "\n\nCopy .env.example to .env.local and fill in the values.",
    );
  }
}
