import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { verifyTelnyxWebhook } from "@/lib/telnyx-verify";
import { assertEnv } from "@/lib/env-check";
import { captureError, captureWarning } from "@/lib/monitoring";

assertEnv();
import {
  handleRequirementGroupStatusUpdated,
  handleNumberOrderCompleted,
} from "./_handlers/compliance";
import {
  handleCallInitiated,
  handleCallRecordingSaved,
} from "./_handlers/call";

export async function POST(req: Request) {
  const rawBody = await req.text();

  const signature = req.headers.get("telnyx-signature-ed25519");
  const timestamp = req.headers.get("telnyx-timestamp");

  if (!signature || !timestamp) {
    return NextResponse.json(
      { error: "Missing signature headers" },
      { status: 400 },
    );
  }

  const isValid = await verifyTelnyxWebhook(rawBody, signature, timestamp);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const body = JSON.parse(rawBody);
    const event = body.data;
    const eventType = event.event_type;
    const payload = event.payload;

    const supabase = createAdminClient();

    // Identify Location and Organization for logging
    let locationId = null;
    let organizationId = null;

    try {
      if (eventType.startsWith("requirement_group.") && payload.id) {
        const { data: locData } = await supabase
          .from("locations")
          .select("id, organization_id")
          .eq("telnyx_requirement_group_id", payload.id)
          .maybeSingle();

        if (locData) {
          locationId = locData.id;
          organizationId = locData.organization_id;
        }
      } else if (
        payload.phone_number ||
        (payload.phone_numbers && payload.phone_numbers[0]?.phone_number)
      ) {
        const phoneNumber =
          payload.phone_number || payload.phone_numbers[0]?.phone_number;
        const { data: locData } = await supabase
          .from("locations")
          .select("id, organization_id")
          .eq("telnyx_phone_number", phoneNumber)
          .maybeSingle();

        if (locData) {
          locationId = locData.id;
          organizationId = locData.organization_id;
        }
      } else if (payload.to) {
        const { data: locData } = await supabase
          .from("locations")
          .select("id, organization_id")
          .eq("telnyx_phone_number", payload.to)
          .maybeSingle();

        if (locData) {
          locationId = locData.id;
          organizationId = locData.organization_id;
        }
      }

      await supabase.from("telnyx_webhook_logs").insert({
        event_type: eventType,
        payload: body,
        location_id: locationId,
        organization_id: organizationId,
      });
    } catch (logError) {
      captureWarning("[Telnyx Webhook] Failed to log webhook event to DB", { service: "supabase", flow: "telnyx_webhook_logging" });
    }

    // Route to handlers
    if (eventType === "requirement_group.status_updated") {
      const result = await handleRequirementGroupStatusUpdated(
        supabase,
        payload,
      );
      if (result) return result;
    } else if (
      eventType === "number_order.completed" ||
      (eventType === "number_order.status_updated" &&
        payload.status === "success")
    ) {
      await handleNumberOrderCompleted(supabase, payload);
    } else if (eventType === "call.initiated") {
      const result = await handleCallInitiated(supabase, payload);
      if (result) return result;
    } else if (eventType === "call.recording.saved") {
      const result = await handleCallRecordingSaved(supabase, payload);
      if (result) return result;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    captureError(error, { service: "telnyx", flow: "webhook_handler" });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
