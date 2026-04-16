/**
 * WABA Template helpers — Meta API calls + LLM policy validation.
 *
 * Template management flow:
 *   1. User creates a DRAFT template (stored locally in locations.waba_templates)
 *   2. User clicks "Verifica con AI" → validateTemplateWithLLM()
 *   3. User clicks "Invia a Meta" → createMetaTemplate() → status becomes PENDING
 *   4. Meta reviews → status becomes APPROVED / REJECTED
 *   5. Sync status via syncMetaTemplateStatus() (webhook or manual poll)
 */

import type { WabaTemplate, WabaTemplateButton, WabaTemplateComponent, WabaTemplateType, WabaTemplateCategory, ButtonSemanticRole } from "@/types/general";
import { captureError, captureWarning } from "@/lib/monitoring";
import OpenAI from "openai";

// ── Template type metadata ────────────────────────────────────────────────────

/** Maps template_type → Meta category. */
export const TYPE_TO_CATEGORY: Record<WabaTemplateType, WabaTemplateCategory> = {
  recovery_open:    "UTILITY",
  recovery_closed:  "UTILITY",
  booking_reminder: "UTILITY",
  service_update:   "UTILITY",
  promotion:        "MARKETING",
  news:             "MARKETING",
  custom:           "UTILITY",
};

/**
 * Semantic roles that MUST be present (in order) for structured template types.
 * FLOW buttons must always be last.
 */
export const REQUIRED_ROLES: Partial<Record<WabaTemplateType, ButtonSemanticRole[]>> = {
  recovery_open:    ["supplier_flag", "callback_request", "booking_flow"],
  recovery_closed:  ["menu_link", "booking_flow"],
  booking_reminder: ["booking_confirm", "booking_cancel"],
};

/**
 * Payload injected into QUICK_REPLY buttons at send time based on semantic role.
 * Keeps handleButtonClick logic stable regardless of button display text.
 */
export const ROLE_TO_PAYLOAD: Partial<Record<ButtonSemanticRole, string>> = {
  supplier_flag:    "fornitore",
  callback_request: "richiama",
  menu_link:        "menu",
  booking_confirm:  "confermo",
  booking_cancel:   "annulla prenotazione",
};

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

function getWabaId(): string {
  const id = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  if (!id) throw new Error("Missing WHATSAPP_BUSINESS_ACCOUNT_ID");
  return id;
}

function getToken(): string {
  const token = process.env.META_SYSTEM_USER_TOKEN;
  if (!token) throw new Error("Missing META_SYSTEM_USER_TOKEN");
  return token;
}

function getBookingFlowId(): string {
  const id = process.env.WHATSAPP_BOOKING_FLOW_ID;
  if (!id) throw new Error("Missing WHATSAPP_BOOKING_FLOW_ID — required to create recovery templates");
  return id;
}

/**
 * Convert an internal WabaTemplateButton to the Meta API shape.
 * Strips the local-only `semantic_role` field and injects `flow_id` for FLOW buttons.
 */
function buildMetaButton(btn: WabaTemplateButton): Record<string, unknown> {
  if (btn.type === "FLOW") {
    return {
      type: "FLOW",
      text: btn.text,
      flow_id: getBookingFlowId(),
      navigate_screen: "FIRST_SCREEN",
    };
  }
  // Strip semantic_role — Meta doesn't know about it
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { semantic_role, ...rest } = btn as Record<string, unknown>;
  return rest;
}

// ── Meta API ────────────────────────────────────────────────────────────────

/**
 * Submit a template to Meta for review. Returns the assigned Meta template ID
 * and initial status (usually "PENDING").
 */
export async function createMetaTemplate(
  template: Pick<WabaTemplate, "name" | "language" | "category" | "components">,
): Promise<{ meta_template_id: string; meta_status: WabaTemplate["meta_status"] }> {
  const response = await fetch(`${GRAPH_BASE}/${getWabaId()}/message_templates`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: template.name,
      language: template.language,
      category: template.category,
      // Process components: convert FLOW buttons to Meta shape, strip semantic_role
      components: template.components.map((c) => {
        if (c.type === "BUTTONS") {
          return { type: "BUTTONS", buttons: c.buttons.map(buildMetaButton) };
        }
        return c;
      }),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const err = new Error(data.error?.message ?? "Meta template creation failed");
    captureError(err, {
      service: "whatsapp",
      flow: "create_waba_template",
      metaErrorCode: data.error?.code,
      templateName: template.name,
    });
    throw err;
  }

  return {
    meta_template_id: String(data.id),
    meta_status: (data.status as WabaTemplate["meta_status"]) ?? "PENDING",
  };
}

/**
 * Update an existing Meta template's content (re-submits it for review).
 * Used when editing a template that was already submitted (APPROVED, REJECTED, PAUSED, etc.).
 * The template goes back to PENDING after the call.
 */
export async function updateMetaTemplate(
  metaTemplateId: string,
  template: Pick<WabaTemplate, "components" | "category">,
): Promise<void> {
  const response = await fetch(`${GRAPH_BASE}/${metaTemplateId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      category: template.category,
      components: template.components.map((c) => {
        if (c.type === "BUTTONS") {
          return { type: "BUTTONS", buttons: c.buttons.map(buildMetaButton) };
        }
        return c;
      }),
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const err = new Error(data.error?.message ?? "Meta template update failed");
    captureError(err, {
      service: "whatsapp",
      flow: "update_waba_template",
      metaTemplateId,
      metaErrorCode: data.error?.code,
    });
    throw err;
  }
}

/**
 * Delete a template from Meta by name.
 * Throws if the Meta API returns an error so the caller can surface it to the user.
 */
export async function deleteMetaTemplate(templateName: string): Promise<void> {
  const response = await fetch(
    `${GRAPH_BASE}/${getWabaId()}/message_templates?name=${encodeURIComponent(templateName)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = data.error?.message ?? "Errore sconosciuto";
    const err = new Error(`Meta template deletion failed: ${message}`);
    captureError(err, {
      service: "whatsapp",
      flow: "delete_waba_template",
      templateName,
      metaErrorCode: data.error?.code,
    });
    throw err;
  }
}

/**
 * Poll Meta for the current status of a template by name.
 * Returns null if the template is not found on Meta's side (e.g. still DRAFT).
 */
export async function syncMetaTemplateStatus(templateName: string): Promise<{
  meta_template_id: string;
  meta_status: WabaTemplate["meta_status"];
  rejection_reason: string | null;
} | null> {
  const url = `${GRAPH_BASE}/${getWabaId()}/message_templates?name=${encodeURIComponent(templateName)}&fields=id,name,status,rejected_reason`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  const data = await response.json();

  if (!response.ok || !data.data?.length) return null;

  const tmpl = data.data[0];
  return {
    meta_template_id: String(tmpl.id),
    meta_status: (tmpl.status as WabaTemplate["meta_status"]) ?? "PENDING",
    rejection_reason: tmpl.rejected_reason ?? null,
  };
}

// ── LLM Policy Validation ───────────────────────────────────────────────────

export type LlmValidationResult = {
  verdict: "approve" | "suggest_changes";
  category: "UTILITY" | "MARKETING";
  confidence: "high" | "medium" | "low";
  issues: string[];
  /** Suggested rewrite of the BODY text only. Null if verdict is "approve". */
  revised_text: string | null;
  reasoning: string | null;
};

const SYSTEM_PROMPT = `You are a WhatsApp Business API template compliance expert. Your primary goal is to APPROVE templates as UTILITY whenever possible. Only flag issues if the template clearly contains promotional or marketing content that cannot be rewritten away.

## Your Core Mission
Try HARD to classify as UTILITY. Suggest minimal, targeted edits rather than rejecting. A template should only be denied UTILITY if it is fundamentally promotional and cannot be salvaged with minor text changes.

---

## UTILITY — What Qualifies

A template is UTILITY if it meets BOTH conditions:
1. It is NON-PROMOTIONAL: no discounts, offers, incentives, urgency-to-buy language
2. It is CONTEXTUALLY TIED to a prior user action OR is operationally critical:

### ✅ Always UTILITY (safe zone)
- Booking/appointment confirmations and reminders (even with cancel/reschedule CTA)
- Order confirmations, receipts, shipping & delivery updates
- Payment confirmations, failed payment alerts, invoices
- Account changes: password reset, profile update, subscription renewal/expiry
- OTP / verification codes / 2FA
- Fraud alerts, security notices
- Service interruption or outage notifications
- Post-service surveys tied to a specific completed transaction (e.g. "Come è andato il tuo appuntamento di ieri?")
- CTAs like "Rispondi ANNULLA per cancellare", "Rispondi CONFERMA", "Chiama per info" in a transactional context ✅

### 🟡 UTILITY with caution (allowed if no promo language added)
- Reminders of upcoming subscription expiry → UTILITY only if it says "il tuo abbonamento scade il [data]", NOT "rinnova ora e risparmia"
- Back-in-stock for an item a user SPECIFICALLY waitlisted → UTILITY
- Follow-up message after a confirmed booking or purchase → UTILITY if purely informational
- "Completa il tuo profilo" or onboarding steps linked to a registration action → UTILITY

---

## MARKETING — Clear Disqualifiers

Flag as MARKETING only if one or more of these are present AND cannot be removed with a minor rewrite:

### 🔴 Hard disqualifiers
- Discount/offer language: sconto, offerta, promo, coupon, codice sconto, cashback, risparmia, gratis, omaggio, in regalo
- Purchase-push language: acquista, ordina ora, approfitta, non perdere, ultimi posti (when used to sell, not for genuine scarcity of a booked slot)
- Generic broadcast promotions not tied to any user action
- Price lists or product catalogs sent unprompted
- Re-engagement messages with incentives: "Torna a trovarci, hai uno sconto del 10%"
- Urgency-to-buy framing: "solo per oggi", "offerta valida fino a...", "disponibilità limitata" (for sales, not genuine operational limits)

### 🟡 Borderline — prefer UTILITY if context supports it
- "Clicca qui per vedere il menù" in a booking reminder → ✅ UTILITY (informational, tied to a booking)
- "Hai ancora domande?" with a contact link → ✅ UTILITY
- Mentioning a product name or price WITHOUT promotional framing → ✅ UTILITY
- A "refer a friend" message → 🔴 MARKETING (incentive-based)

---

## Decision Logic

Follow this step-by-step reasoning before responding:

1. **Identify the trigger**: Is there a prior user action (booking, order, registration, payment) that this message responds to?
2. **Check for promo language**: Does the message contain any hard disqualifiers listed above?
3. **Apply the "feel" test**: Would the average user receiving this message feel they are being sold something, or simply informed/updated?
4. **If borderline**: Can a minor text edit remove the promotional element while preserving the message's purpose? If YES → suggest_changes with revised_text. If NO → verdict is still "approve" under MARKETING only if the core message is promotional at its heart.

---

## Output Format

Respond ONLY with this JSON:
{
  "verdict": "approve" | "suggest_changes",
  "category": "UTILITY" | "MARKETING",
  "confidence": "high" | "medium" | "low",
  "issues": string[],
  "revised_text": string | null,
  "reasoning": string
}

Field rules:
- "verdict": "approve" = passes as UTILITY as-is; "suggest_changes" = minor edits needed to qualify as UTILITY
- "category": the category this template qualifies for AFTER any suggested changes
- "confidence": how certain you are of the classification
- "issues": specific problems found (empty array [] if verdict is "approve")
- "revised_text": rewrite of the BODY text ONLY that would pass as UTILITY (null if no changes needed)
- "reasoning": 1–2 sentence explanation of your decision, citing the key signal that determined the outcome

---

## Examples

### ✅ UTILITY — approve
Template: "Ciao {{1}}, ti ricordiamo che il tuo appuntamento è confermato per domani alle {{2}}. Rispondi ANNULLA per cancellare."
→ { "verdict": "approve", "category": "UTILITY", "confidence": "high", "issues": [], "revised_text": null, "reasoning": "Reminder tied to a confirmed booking with a neutral operational CTA." }

### 🟡 suggest_changes → UTILITY
Template: "Ciao {{1}}, il tuo ordine {{2}} è in arrivo! Approfitta del 10% di sconto sul prossimo acquisto con il codice PROMO10."
→ { "verdict": "suggest_changes", "category": "UTILITY", "confidence": "high", "issues": ["Promotional discount code makes this MARKETING", "Upsell language 'approfitta' is a hard disqualifier"], "revised_text": "Ciao {{1}}, il tuo ordine {{2}} è in arrivo! Per qualsiasi domanda, siamo disponibili a risponderti qui.", "reasoning": "The delivery notification is UTILITY; the discount code is the sole disqualifier and can be removed." }

### 🔴 MARKETING — cannot be salvaged
Template: "Offerta esclusiva per te! Solo questo weekend, acquista con il 20% di sconto. Usa il codice WEEKEND20 al checkout."
→ { "verdict": "suggest_changes", "category": "MARKETING", "confidence": "high", "issues": ["Pure promotional broadcast with no prior user action", "Discount code present", "Time-limited sales urgency"], "revised_text": null, "reasoning": "This is fundamentally a promotional offer with no transactional anchor; cannot be rewritten as UTILITY without changing its core purpose." }
`;

/**
 * Run an LLM check on template components to verify UTILITY classification.
 * Uses GPT-4o-mini — cost is ~€0.0001 per call.
 * Fails open: if the API call or parsing fails, returns "approve".
 */
export async function validateTemplateWithLLM(
  components: WabaTemplateComponent[],
): Promise<LlmValidationResult> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const lines: string[] = [];
  for (const c of components) {
    if (c.type === "HEADER" && "text" in c) lines.push(`HEADER: ${c.text}`);
    if (c.type === "BODY") lines.push(`BODY: ${c.text}`);
    if (c.type === "FOOTER") lines.push(`FOOTER: ${c.text}`);
    if (c.type === "BUTTONS") {
      lines.push(`BUTTONS: ${c.buttons.map((b) => b.type === "COPY_CODE" ? "COPY_CODE" : b.type === "FLOW" ? `FLOW(${b.text})` : b.text).join(" | ")}`);
    }
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: lines.join("\n") },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 512,
    });

    const raw = JSON.parse(response.choices[0].message.content ?? "{}");
    return {
      verdict: raw.verdict === "approve" ? "approve" : "suggest_changes",
      category: raw.category === "MARKETING" ? "MARKETING" : "UTILITY",
      confidence: (["high", "medium", "low"] as const).includes(raw.confidence) ? raw.confidence : "medium",
      issues: Array.isArray(raw.issues) ? raw.issues : [],
      revised_text: raw.revised_text ?? null,
      reasoning: raw.reasoning ?? null,
    };
  } catch (err) {
    captureWarning("LLM template validation failed — failing open", {
      service: "openai",
      flow: "validate_waba_template",
    });
    return { verdict: "approve", category: "UTILITY", confidence: "low", issues: [], revised_text: null, reasoning: null };
  }
}

// ── Name helpers ────────────────────────────────────────────────────────────

/** Convert a display name to a valid Meta template name (snake_case, a-z0-9_). */
export function toTemplateName(displayName: string): string {
  return displayName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // strip accents
    .replace(/[^a-z0-9\s_]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 512);
}

/** Validate that a template name matches Meta's requirements. */
export function isValidTemplateName(name: string): boolean {
  return /^[a-z0-9_]{1,512}$/.test(name);
}
