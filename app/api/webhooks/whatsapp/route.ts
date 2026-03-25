import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { WhatsAppWebhookPayload } from "@/lib/whatsapp";
import { createAdminClient } from "@/utils/supabase/admin";
import { handleStatusUpdates } from "./_handlers/status";
import {
  handleButtonClick,
  handleFlowCompletion,
  handleTextMessage,
} from "./_handlers/messages";

export async function GET(req: NextRequest) {
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
  try {
    const body: WhatsAppWebhookPayload = await req.json();

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
    Sentry.captureException(error);
    console.error("Error processing webhook:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
