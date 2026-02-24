import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { Resend } from "resend";
import { purchasePhoneNumber, answerCall, startRecording } from "@/lib/telnyx";
import { transcribeAudio, extractVerificationCode } from "@/lib/openai";
import { registerNumberWithMeta } from "@/lib/meta-registration";
import NumberActiveEmail from "@/emails/number-active";
import { render } from "@react-email/components";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const event = body.data; // Telnyx wraps event data in 'data'
    const eventType = event.event_type;
    const payload = event.payload;

    const supabase = createAdminClient();

    // 1. Identify Location and Organization for logging
    let locationId = null;
    let organizationId = null;

    try {
      if (eventType.startsWith("requirement_group.") && payload.id) {
        const { data: reqData } = await supabase
          .from("telnyx_regulatory_requirements")
          .select("location_id, organization_id")
          .eq("telnyx_requirement_group_id", payload.id)
          .maybeSingle();

        if (reqData) {
          locationId = reqData.location_id;
          organizationId = reqData.organization_id;
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

      // 2. Log Webhook Event
      await supabase.from("telnyx_webhook_logs").insert({
        event_type: eventType,
        payload: body,
        location_id: locationId,
        organization_id: organizationId,
      });
    } catch (logError) {
      console.error("[Telnyx Webhook] Error logging event:", logError);
    }

    if (eventType === "requirement_group.status_updated") {
      // requirement_group.status_updated
      // payload: { id: "...", status: "approved" | "rejected" | ... }
      const status = payload.status;
      const id = payload.id;
      const rejectionReason =
        payload.suborder_comments || payload.rejection_reason || null;

      // 1. Update Requirement Status
      const { data: reqGroup, error: updateError } = await supabase
        .from("telnyx_regulatory_requirements")
        .update({
          status: status,
          rejection_reason: rejectionReason,
        })
        .eq("telnyx_requirement_group_id", id)
        .select("location_id, organization_id")
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 },
        );
      }

      // 2. If Approved, Activate Location & Register with Meta
      if (status === "approved" && reqGroup?.location_id) {
        await activateLocation(reqGroup.location_id, supabase);
      }
    } else if (
      eventType === "number_order.complete" ||
      (eventType === "number_order.status_updated" &&
        payload.status === "complete")
    ) {
      // HANDLE NUMBER ORDER COMPLETION
      // This is the preferred way to detect activation as Req Group status can be unreliable.
      const phoneNumbers = payload.phone_numbers; // Array of objects or strings? Usually objects in order payload

      if (phoneNumbers && Array.isArray(phoneNumbers)) {
        for (const numObj of phoneNumbers) {
          const phoneNumber = numObj.phone_number; // e.g. +39...

          if (phoneNumber) {
            console.log(
              `Order Complete for ${phoneNumber}. Checking for location...`,
            );
            // 1. Find location by phone number
            const { data: location } = await supabase
              .from("locations")
              .select("id, telnyx_regulatory_requirements(id)")
              .eq("telnyx_phone_number", phoneNumber)
              .single();

            if (location) {
              console.log(`Found location ${location.id}. Activating...`);

              // 2. Force Requirement Status to Approved (since order is complete, checks passed)
              // @ts-ignore
              const reqId = location.telnyx_regulatory_requirements?.id;
              if (reqId) {
                await supabase
                  .from("telnyx_regulatory_requirements")
                  .update({ status: "approved" })
                  .eq("id", reqId);
              }

              // 3. Activate
              await activateLocation(location.id, supabase);
            } else {
              console.log(`No location found for ${phoneNumber}`);
            }
          }
        }
      }
    } else if (eventType === "call.initiated") {
      // INCOMING CALL from Meta
      const callControlId = payload.call_control_id;
      const to = payload.to;
      console.log(
        `[Telnyx Webhook] 📞 Incoming call to ${to} (CallID: ${callControlId})`,
      );

      try {
        // 1. Check if there's a forwarding number
        console.log(
          `[Telnyx Webhook] 🔍 Checking DB for forwarding number for ${to}...`,
        );
        const { data: location, error: dbError } = await supabase
          .from("locations")
          .select("voice_forwarding_number")
          .eq("telnyx_phone_number", to)
          .single();

        if (dbError) {
          console.error(
            `[Telnyx Webhook] ❌ DB Error fetching forwarding number:`,
            dbError,
          );
        }

        if (location && location.voice_forwarding_number) {
          console.log(
            `[Telnyx Webhook] ✅ Found forwarding number! Forwarding call to ${location.voice_forwarding_number}...`,
          );

          try {
            // Transfer the call to the forwarding number
            const ansStart = Date.now();
            console.log(
              `[Telnyx Webhook] ⏳ Answering call before transfer...`,
            );
            await answerCall(callControlId);
            console.log(
              `[Telnyx Webhook] ☎️ Call answered in ${Date.now() - ansStart}ms`,
            );

            console.log(
              `[Telnyx Webhook] 🔄 Initiating transfer to ${location.voice_forwarding_number}...`,
            );
            const { transferCall } = await import("@/lib/telnyx");
            await transferCall(callControlId, location.voice_forwarding_number);
            console.log(
              `[Telnyx Webhook] 🚀 Transfer command sent successfully!`,
            );
          } catch (forwardError) {
            console.error(
              `[Telnyx Webhook] 💥 ERROR during answer/transfer process:`,
              forwardError,
            );
          }
        } else {
          console.log(
            `[Telnyx Webhook] ⚠️ No forwarding number found in DB, falling back to answering automatically...`,
          );

          // 1. Answer Call
          const ansStart = Date.now();
          await answerCall(callControlId);

          // 2. Start Recording immediately
          const recStart = Date.now();
          await startRecording(callControlId);
          console.log(
            `[Telnyx Webhook] 🎙️ Auto-Call answered (in ${recStart - ansStart}ms) and recording started (in ${Date.now() - recStart}ms).`,
          );
        }
      } catch (e) {
        console.error(
          `[Telnyx Webhook] 💥 FATAL ERROR in call.initiated handler:`,
          e,
        );
      }

      // RECORDING SAVED
      const recordingUrl = payload.recording_urls?.mp3;
      const toNumber = payload.to; // The Telnyx number
      // We need to find which location corresponds to this number to get the Meta Phone ID.
      console.log(
        `[Telnyx Webhook] Recording saved for call to ${toNumber}. URL: ${recordingUrl}`,
      );

      if (recordingUrl) {
        try {
          // 1. Transcribe
          const transStart = Date.now();
          console.log(`[Telnyx Webhook] Starting Transcription...`);
          const transcription = await transcribeAudio(recordingUrl);
          console.log(
            `[Telnyx Webhook] Transcription completed in ${Date.now() - transStart}ms: "${transcription}"`,
          );

          // 2. Extract Code
          const code = extractVerificationCode(transcription);
          console.log(`[Telnyx Webhook] Extracted Code: "${code}"`);

          if (code) {
            // 3. Find Location & Meta ID
            // Telnyx numbers in DB are usually +39...
            // Payload 'to' might be +39... or 39...
            const dbStart = Date.now();
            console.log(
              `[Telnyx Webhook] Looking up location for number: ${toNumber}`,
            );
            const { data: location } = await supabase
              .from("locations")
              .select("id, meta_phone_id, telnyx_phone_number")
              .eq("telnyx_phone_number", toNumber) // Ensure format matches
              .single();
            console.log(
              `[Telnyx Webhook] Location lookup took ${Date.now() - dbStart}ms. Found: ${location?.id || "None"}`,
            );

            if (location && location.meta_phone_id) {
              // 4. Register with Meta
              console.log(
                `[Telnyx Webhook] Registering code ${code} for location ${location.id}...`,
              );
              const regStart = Date.now();
              await registerNumberWithMeta(location.meta_phone_id, code);
              console.log(
                `[Telnyx Webhook] Number verified with Meta in ${Date.now() - regStart}ms!`,
              );

              // 5. Update Status
              await supabase
                .from("locations")
                .update({ activation_status: "verified" })
                .eq("id", location.id);
            } else {
              console.error(
                `[Telnyx Webhook] Could not find location/meta_id for number: ${toNumber}`,
              );
            }
          } else {
            console.warn(
              `[Telnyx Webhook] No code extracted from transcription.`,
            );
          }
        } catch (error) {
          console.error(
            `[Telnyx Webhook] Error processing recording/verification:`,
            error,
          );
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// Helper to activate location and register with Meta
async function activateLocation(locationId: string, supabase: any) {
  // Fetch Location to get the phone number AND Organization info
  const { data: location, error: locationFetchError } = await supabase
    .from("locations")
    .select(
      "telnyx_phone_number, name, organization:organizations(name, billing_email)",
    )
    .eq("id", locationId)
    .single();

  if (locationFetchError || !location?.telnyx_phone_number) {
    console.error(
      "Could not find location or phone number for activation:",
      locationFetchError,
    );
    return;
  }

  // Idempotency check: if already active/verified, maybe skip?
  // But maybe we want to retry Meta registration if it failed before.
  // So we proceed.

  try {
    console.log(`Activating number ${location.telnyx_phone_number}...`);

    // 2a. Add to Meta WABA
    const cleanNumber = location.telnyx_phone_number.replace("+", "");

    console.log(`Adding ${cleanNumber} to Meta WABA...`);
    // Import strictly dynamically if needed, or top-level. Added top-level below.
    const { addNumberToWaba, requestVerificationCode } =
      await import("@/lib/meta-registration");

    const metaPhoneId = await addNumberToWaba(cleanNumber, location.name);
    console.log(`Meta Phone ID obtained: ${metaPhoneId}`);

    // 2b. Update Location with Status & Meta ID
    // We do NOT set it to "active" here. The user still needs to verify it via phone call.
    // We set it to "pending_verification" to indicate the number is ready to receive the call.
    const { error: locError } = await supabase
      .from("locations")
      .update({
        activation_status: "pending_verification",
        meta_phone_id: metaPhoneId,
      })
      .eq("id", locationId);

    if (locError) throw locError;

    // 2c. Trigger Voice Verification
    console.log("Requesting Voice Verification Code from Meta...");
    await requestVerificationCode(metaPhoneId, "VOICE");
    console.log("Verification Code Requested!");

    // 3. Send Notification Email
    try {
      const org = location.organization as any;
      const billingEmail = org?.billing_email;
      const teamName = org?.name || "Il tuo Team";

      if (billingEmail) {
        const emailHtml = await render(
          NumberActiveEmail({
            teamName: teamName,
            phoneNumber: location.telnyx_phone_number,
          }),
        );

        await resend.emails.send({
          from: "Smartables <onboarding@smartables.it>",
          to: billingEmail,
          subject: "Il tuo numero è attivo su Smartables!",
          html: emailHtml,
        });
        console.log(`Activation email sent to ${billingEmail}`);
      } else {
        console.warn(
          "No billing email found for organization, skipping email.",
        );
      }
    } catch (emailErr) {
      console.error("Failed to send activation email:", emailErr);
      // Don't block the flow
    }
  } catch (error: any) {
    console.error("Failed in automation flow (Meta Registration):", error);
    // Log error but don't crash webhook
  }
}
