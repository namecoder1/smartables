/**
 * Canonical WhatsApp webhook payload factories.
 *
 * Use these in tests instead of inlining raw payload objects to keep
 * test payloads in sync with what Meta actually sends.
 */

export const PHONE_NUMBER_ID = "phone_123";
export const SENDER_PHONE = "393401234567";
export const MESSAGE_ID = "wamid_test_123";

// ─── Message payload builders ────────────────────────────────────────────────

export function makeTextMessage(body: string, overrides: Record<string, unknown> = {}) {
  return {
    type: "text",
    from: SENDER_PHONE,
    id: MESSAGE_ID,
    timestamp: "1700000000",
    text: { body },
    ...overrides,
  };
}

export function makeButtonMessage(payload: string, text: string, overrides: Record<string, unknown> = {}) {
  return {
    type: "button",
    from: SENDER_PHONE,
    id: MESSAGE_ID,
    timestamp: "1700000000",
    button: { payload, text },
    ...overrides,
  };
}

export function makeInteractiveNfmReply(responseJson: Record<string, unknown> = {}, overrides: Record<string, unknown> = {}) {
  return {
    type: "interactive",
    from: SENDER_PHONE,
    id: MESSAGE_ID,
    timestamp: "1700000000",
    interactive: {
      type: "nfm_reply",
      nfm_reply: { response_json: JSON.stringify(responseJson) },
    },
    ...overrides,
  };
}

export function makeInteractiveButtonReply(buttonId: string, buttonTitle: string) {
  return {
    type: "interactive",
    from: SENDER_PHONE,
    id: MESSAGE_ID,
    timestamp: "1700000000",
    interactive: {
      type: "button_reply",
      button_reply: { id: buttonId, title: buttonTitle },
    },
  };
}

// ─── Envelope builders ───────────────────────────────────────────────────────

/** Wraps a single message in the full Meta webhook envelope. */
export function makeWebhookPayload(
  message: Record<string, unknown>,
  phoneNumberId = PHONE_NUMBER_ID,
) {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "entry_123",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: { display_phone_number: "0000000000", phone_number_id: phoneNumberId },
              contacts: [{ profile: { name: "Test User" }, wa_id: SENDER_PHONE }],
              messages: [message],
            },
          },
        ],
      },
    ],
  };
}

/** Builds a webhook payload containing only status updates (no messages). */
export function makeStatusPayload(
  statuses: { id: string; status: string; errors?: unknown[] }[],
  phoneNumberId = PHONE_NUMBER_ID,
) {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "entry_123",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: { display_phone_number: "0000000000", phone_number_id: phoneNumberId },
              statuses,
            },
          },
        ],
      },
    ],
  };
}
