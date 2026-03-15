import { z } from "zod";

// ── Telnyx Webhook ──

export const TelnyxWebhookSchema = z.object({
  data: z.object({
    event_type: z.string(),
    payload: z.record(z.string(), z.unknown()),
    id: z.string().optional(),
    occurred_at: z.string().optional(),
  }),
});

export type TelnyxWebhookEvent = z.infer<typeof TelnyxWebhookSchema>;

// ── WhatsApp Webhook ──

const WhatsAppStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["sent", "delivered", "read", "failed"]),
  timestamp: z.string(),
  recipient_id: z.string(),
  errors: z.array(z.unknown()).optional(),
});

const WhatsAppMessageSchema = z.object({
  from: z.string(),
  id: z.string(),
  timestamp: z.string(),
  type: z.string(),
  text: z.object({ body: z.string() }).optional(),
  button: z
    .object({
      payload: z.string(),
      text: z.string(),
    })
    .optional(),
  interactive: z.record(z.string(), z.unknown()).optional(),
});

const WhatsAppValueSchema = z.object({
  messaging_product: z.string(),
  metadata: z.object({
    display_phone_number: z.string(),
    phone_number_id: z.string(),
  }),
  contacts: z
    .array(
      z.object({
        profile: z.object({ name: z.string() }),
        wa_id: z.string(),
      }),
    )
    .optional(),
  messages: z.array(WhatsAppMessageSchema).optional(),
  statuses: z.array(WhatsAppStatusSchema).optional(),
});

export const WhatsAppWebhookSchema = z.object({
  object: z.string(),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(
        z.object({
          value: WhatsAppValueSchema,
          field: z.string(),
        }),
      ),
    }),
  ),
});

export type WhatsAppWebhookEvent = z.infer<typeof WhatsAppWebhookSchema>;
