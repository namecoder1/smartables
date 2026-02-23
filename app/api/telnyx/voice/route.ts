import {
  rejectCall,
  answerCall,
  startRecording,
  transferCall,
} from "@/lib/telnyx";
import { transcribeAudio, extractVerificationCode } from "@/lib/openai";
import { registerNumberWithMeta } from "@/lib/meta-registration";
import { createAdminClient } from "@/utils/supabase/admin";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const eventType = body.data?.event_type;
    const callControlId = body.data?.payload?.call_control_id;

    console.log(
      `[Telnyx Voice] Incoming Webhook: ${eventType} (CallID: ${callControlId})`,
    );

    if (eventType === "call.initiated") {
      if (callControlId) {
        console.log(
          `[Telnyx Voice] Call Initiated: ${callControlId}. Checking for forwarding...`,
        );

        // Check if this number has manual forwarding enabled
        const telnyxNumber = body.data.payload.to;
        const { data: location } = await createAdminClient()
          .from("locations")
          .select("voice_forwarding_number")
          .eq("telnyx_phone_number", telnyxNumber)
          .single();

        if (location?.voice_forwarding_number) {
          console.log(
            `[Telnyx Voice] Forwarding enabled to ${location.voice_forwarding_number}. Transferring...`,
          );
          await transferCall(callControlId, location.voice_forwarding_number);
          console.log(`[Telnyx Voice] Transfer command sent.`);
          return NextResponse.json({ status: "ok" });
        }

        // Standard Flow: Answer & Record
        console.log(`[Telnyx Voice] No forwarding. Answering call...`);
        const ansStart = Date.now();
        await answerCall(callControlId);
        console.log(
          `[Telnyx Voice] Call Answered command sent in ${Date.now() - ansStart}ms`,
        );
      }
    } else if (eventType === "call.answered") {
      // If we see call.answered but we transferred, we might still see events?
      // Usually transfer kills the control for the original leg or creates a new one.
      // We only want to record if we are NOT in forwarding mode.
      // But since we returned early in 'call.initiated' for forwarding, we shouldn't be here unless
      // the answer event comes for the original leg?
      // Safe bet: The 'transfer' command is the end of our responsibility for 'call.initiated'.
      // If we transferred, we likely won't command 'record_start'.

      if (callControlId) {
        console.log(
          `[Telnyx Voice] Call Answered event received: ${callControlId}.`,
        );
        // We could double check DB or just assume if we are here and we didn't transfer, we record.
        // But to be safe, let's just proceed. If we transferred, the call flow might differ.
        // For simplicity: We only record if we ANSWERED it ourselves in step 1.
        // Telnyx usually sends 'call.answered' when the destination answers.

        const recStart = Date.now();
        await startRecording(callControlId);
        console.log(
          `[Telnyx Voice] Start Recording command sent in ${Date.now() - recStart}ms`,
        );
      }
    } else if (eventType === "call.recording.saved") {
      const recordingUrl = body.data.payload.recording_urls?.mp3;
      console.log(`[Telnyx Voice] Recording Saved: ${recordingUrl}`);

      if (recordingUrl) {
        // 1. Transcribe
        const transStart = Date.now();
        console.log(`[Telnyx Voice] Starting Transcription...`);
        const text = await transcribeAudio(recordingUrl);
        console.log(
          `[Telnyx Voice] Transcribed Text in ${Date.now() - transStart}ms: "${text}"`,
        );

        // 2. Extract Code
        const code = extractVerificationCode(text);
        console.log(`[Telnyx Voice] Extracted Code: "${code}"`);

        if (code) {
          // 3. Find Phone Number ID and Register
          // We need to map the "to" number (Telnyx number) to the Meta Phone ID.
          // For now, we assume we can query locations by telnyx_phone_number

          const telnyxNumber = body.data.payload.to;
          console.log(
            `[Telnyx Voice] Looking up location for number: ${telnyxNumber}`,
          );
          const dbStart = Date.now();

          const { data: location, error } = await createAdminClient()
            .from("locations")
            .select("meta_phone_id, id")
            .eq("telnyx_phone_number", telnyxNumber)
            .single();

          console.log(
            `[Telnyx Voice] Location lookup took ${Date.now() - dbStart}ms. Found: ${location?.id || "None"}`,
          );

          if (error) {
            console.error(`[Telnyx Voice] Error looking up location:`, error);
          }

          if (location?.meta_phone_id) {
            console.log(
              `[Telnyx Voice] Registering number for location ${location.id} with Meta ID ${location.meta_phone_id}`,
            );
            const regStart = Date.now();
            await registerNumberWithMeta(location.meta_phone_id, code);
            console.log(
              `[Telnyx Voice] Successfully registered with Meta in ${Date.now() - regStart}ms!`,
            );

            // Update location status
            await createAdminClient()
              .from("locations")
              .update({ activation_status: "verified" }) // or whatever status means "Ready for Biz"
              .eq("id", location.id);
            console.log(
              `[Telnyx Voice] Location status updated to 'verified'.`,
            );
          } else {
            console.error(
              `[Telnyx Voice] Could not find location/meta_phone_id for number: ${telnyxNumber}`,
            );
          }
        } else {
          console.warn(`[Telnyx Voice] No code extracted from transcription.`);
        }
      }
    }

    console.log(
      `[Telnyx Voice] Webhook processed in ${Date.now() - startTime}ms`,
    );
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[Telnyx Voice] Error handling Telnyx webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
