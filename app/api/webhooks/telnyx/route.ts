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

    if (eventType === "requirement_group.status_updated") {
      // requirement_group.status_updated
      // payload: { id: "...", status: "approved" | "rejected" | ... }
      const status = payload.status;
      const id = payload.id;

      // 1. Update Requirement Status
      const { data: reqGroup, error: updateError } = await supabase
        .from("telnyx_regulatory_requirements")
        .update({ status: status })
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
        // Fetch Location to get the phone number AND Organization info
        const { data: location, error: locationFetchError } = await supabase
          .from("locations")
          .select(
            "telnyx_phone_number, name, organization:organizations(name, billing_email)",
          )
          .eq("id", reqGroup.location_id)
          .single();

        if (locationFetchError || !location?.telnyx_phone_number) {
          console.error(
            "Could not find location or phone number for approved requirement:",
            locationFetchError,
          );
          return NextResponse.json(
            { error: "Location not found" },
            { status: 500 },
          );
        }

        try {
          console.log(
            `Requirement ${id} Approved. Activating number ${location.telnyx_phone_number}...`,
          );

          // Number was already purchased in 'buy' flow. status should be 'provisioning'.
          // We now update it to 'active'.

          // 2a. Add to Meta WABA
          const cleanNumber = location.telnyx_phone_number.replace("+", "");

          console.log(`Adding ${cleanNumber} to Meta WABA...`);
          // Import strictly dynamically if needed, or top-level. Added top-level below.
          const { addNumberToWaba, requestVerificationCode } =
            await import("@/lib/meta-registration");

          const metaPhoneId = await addNumberToWaba(cleanNumber, location.name);
          console.log(`Meta Phone ID obtained: ${metaPhoneId}`);

          // 2b. Update Location with Status & Meta ID
          const { error: locError } = await supabase
            .from("locations")
            .update({
              activation_status: "active",
              meta_phone_id: metaPhoneId,
            })
            .eq("id", reqGroup.location_id);

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
          console.error(
            "Failed in automation flow (Meta Registration):",
            error,
          );
          // Don't error the webhook response to Telnyx, they don't care about our Meta issues.
          // But we should log or alert admin.
          return NextResponse.json(
            { error: "Partial Failure: " + error.message },
            { status: 500 },
          );
        }
      }
    } else if (eventType === "call.initiated") {
      // INCOMING CALL from Meta
      const callControlId = payload.call_control_id;
      const to = payload.to;
      console.log(`Incoming call to ${to}, answering...`);

      // 1. Answer Call
      await answerCall(callControlId);

      // 2. Start Recording immediately (Meta speaks code quickly)
      // Note: Telnyx answer webhook might need a slight delay or wait for 'call.answered' event
      // But typically we can command record right after answer command.
      await startRecording(callControlId);
      console.log("Call answered and recording started.");
    } else if (eventType === "call.recording.saved") {
      // RECORDING SAVED
      const recordingUrl = payload.recording_urls?.mp3;
      const to = payload.to; // The Telnyx number
      // We need to find which location corresponds to this number to get the Meta Phone ID.
      console.log(`Recording saved for call to ${to}. Transcribing...`);

      if (recordingUrl) {
        try {
          // 1. Transcribe
          const transcription = await transcribeAudio(recordingUrl);
          console.log("Transcription:", transcription);

          // 2. Extract Code
          const code = extractVerificationCode(transcription);
          console.log("Extracted Code:", code);

          if (code) {
            // 3. Find Location & Meta ID
            // Telnyx numbers in DB are usually +39...
            // Payload 'to' might be +39... or 39...
            const { data: location } = await supabase
              .from("locations")
              .select("id, meta_phone_id, telnyx_phone_number")
              .eq("telnyx_phone_number", to) // Ensure format matches
              .single();

            if (location && location.meta_phone_id) {
              // 4. Register with Meta
              console.log(
                `Registering code ${code} for location ${location.id}...`,
              );
              await registerNumberWithMeta(location.meta_phone_id, code);
              console.log("Number verified with Meta!");

              // 5. Update Status
              await supabase
                .from("locations")
                .update({ activation_status: "verified" })
                .eq("id", location.id);
            } else {
              console.error("Could not find location/meta_id for number:", to);
            }
          }
        } catch (error) {
          console.error("Error processing recording/verification:", error);
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
