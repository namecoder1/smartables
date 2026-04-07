import { createHmac, timingSafeEqual } from "crypto";
import { assertEnv } from "@/lib/env-check";
import { NextRequest, NextResponse } from "next/server";
import { WhatsAppWebhookPayload } from "@/lib/whatsapp";
import { createAdminClient } from "@/utils/supabase/admin";
import { handleStatusUpdates } from "./_handlers/status";
import { captureError, captureWarning } from "@/lib/monitoring";
import {
  handleButtonClick,
  handleFlowCompletion,
  handleTextMessage,
} from "./_handlers/messages";

/**
 * Verifies the X-Hub-Signature-256 header sent by Meta on every webhook event.
 * Meta signs the raw body with HMAC-SHA256 using the Facebook App Secret.
 * Uses timingSafeEqual to prevent timing-attack leakage.
 *
 * Returns true if verification passes or if META_APP_SECRET is not configured
 * (allows gradual rollout; logs a warning so we notice it in GlitchTip).
 */
function verifyMetaSignature(rawBody: string, signature: string | null): boolean {
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret) {
    // Non-blocking in dev/staging, but always visible in monitoring
    captureWarning("META_APP_SECRET not configured — Meta webhook signature verification skipped", {
      service: "whatsapp",
      flow: "webhook_signature_validation",
    });
    return true;
  }

  if (!signature) return false;

  const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    // Buffers of different length — timingSafeEqual throws, means mismatch
    return false;
  }
}

export async function GET(req: NextRequest) {
  assertEnv();
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === "subscribe" && token === verifyToken) {
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return new NextResponse("Bad Request", { status: 400 });
}

export async function POST(req: NextRequest) {
  assertEnv();
  try {
    // Verify Meta signature before parsing body
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    if (!verifyMetaSignature(rawBody, signature)) {
      captureWarning("Meta webhook signature verification failed — request rejected", {
        service: "whatsapp",
        flow: "webhook_signature_validation",
      });
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body: WhatsAppWebhookPayload = JSON.parse(rawBody);

    if (
      body.entry &&
      body.entry[0]?.changes &&
      body.entry[0].changes[0]?.value
    ) {
      const value = body.entry[0].changes[0].value;
      const phoneNumberId = value.metadata?.phone_number_id;
      const messages = value.messages;
      const statuses = value.statuses;

      if (statuses && statuses.length > 0) {
        const supabase = createAdminClient();
        return handleStatusUpdates(supabase, statuses);
      }

      if (messages && messages[0]) {
        const message = messages[0];
        const supabase = createAdminClient();

        if (message.type === "button") {
          const result = await handleButtonClick(
            supabase,
            message as unknown as Record<string, unknown>,
            value as unknown as Record<string, unknown>,
            phoneNumberId,
          );
          if (result) return result;
        } else if (message.type === "interactive") {
          const interactiveData = (message as unknown as Record<string, unknown>).interactive as Record<string, unknown>;
          if (interactiveData?.type === "nfm_reply") {
            const result = await handleFlowCompletion(
              supabase,
              message as unknown as Record<string, unknown>,
              value as unknown as Record<string, unknown>,
              phoneNumberId,
            );
            if (result) return result;
          }
        } else if (message.type === "text") {
          const result = await handleTextMessage(
            supabase,
            message as unknown as Record<string, unknown>,
            value as unknown as Record<string, unknown>,
            phoneNumberId,
          );
          if (result) return result;
        }
      }
    }

    return new NextResponse("EVENT_RECEIVED", { status: 200 });
  } catch (error) {
    captureError(error, { service: "whatsapp", flow: "webhook_handler" });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
