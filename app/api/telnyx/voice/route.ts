import {
  rejectCall,
  answerCall,
  startRecording,
  transferCall,
} from "@/lib/telnyx";
import { transcribeAudio, extractVerificationCode } from "@/lib/openai";
import {
  registerNumberWithMeta,
  requestVerificationCode,
} from "@/lib/whatsapp-registration";
import { createNotification } from "@/lib/notifications";
import { createAdminClient } from "@/utils/supabase/admin";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const eventType = body.data?.event_type;
    const callControlId = body.data?.payload?.call_control_id;

    if (eventType === "call.initiated") {
      if (callControlId) {
        // Transfer call if needed (e.g. for testing or if bot is disabled)
        const telnyxNumber = body.data.payload.to;
        const { data: location } = await createAdminClient()
          .from("locations")
          .select("phone_number")
          .eq("telnyx_phone_number", telnyxNumber)
          .single();

        if (location?.phone_number) {
          // For now, we always answer and record unless there's a specific reason to transfer.
          // If the user wants to "forward" calls, they should use the restaurant's main number.
          // However, the original code had a manual bypass. Let's keep a placeholder or just remove it if it's always standard flow.
          // The user said: "ogni location connetterà il telnyx_phone_number al proprio phone_number"
          // So the "telnyx_phone_number" is the entry point, and it should probably ALWAYS answer to handle the bot,
          // OR it should transfer to the main phone_number if the bot is off.
        }

        // Standard Flow: Answer & Record
        await answerCall(callControlId);
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
        // We could double check DB or just assume if we are here and we didn't transfer, we record.
        // But to be safe, let's just proceed. If we transferred, the call flow might differ.
        // For simplicity: We only record if we ANSWERED it ourselves in step 1.
        // Telnyx usually sends 'call.answered' when the destination answers.

        await startRecording(callControlId);
      }
    } else if (eventType === "call.recording.saved") {
      const recordingUrl = body.data.payload.recording_urls?.mp3;
      const telnyxNumber = body.data.payload.to;

      if (recordingUrl) {
        const supabase = createAdminClient();

        // 1. Transcribe
        const text = await transcribeAudio(recordingUrl);

        // 2. Extract Code
        const code = extractVerificationCode(text);

        if (code) {
          // 3. Find location by Telnyx number
          const { data: location, error } = await supabase
            .from("locations")
            .select("meta_phone_id, id, organization_id")
            .eq("telnyx_phone_number", telnyxNumber)
            .single();

          if (error) {
            console.error(`[Telnyx Voice] Error looking up location:`, error);
          }

          if (location?.meta_phone_id) {
            await registerNumberWithMeta(location.meta_phone_id, code);

            // 4. Mark verified and reset retry counter
            await supabase
              .from("locations")
              .update({
                activation_status: "verified",
                voice_otp_retry_count: 0,
              })
              .eq("id", location.id);
          } else {
            console.error(
              `[Telnyx Voice] Could not find location/meta_phone_id for number: ${telnyxNumber}`,
            );
          }
        } else {
          // ── Transcription succeeded but no code found — retry logic ──
          console.warn(`[Telnyx Voice] No code extracted from transcription.`);

          const { data: location } = await supabase
            .from("locations")
            .select("id, organization_id, meta_phone_id, voice_otp_retry_count, activation_status")
            .eq("telnyx_phone_number", telnyxNumber)
            .maybeSingle();

          // Only retry for locations that are still awaiting verification
          if (location && location.activation_status !== "verified" && location.meta_phone_id) {
            const retryCount = location.voice_otp_retry_count ?? 0;

            if (retryCount < 1) {
              // ── First failure: automatic retry ──
              console.log(`[Telnyx Voice] Scheduling OTP retry for location ${location.id} (attempt ${retryCount + 1})`);

              await supabase
                .from("locations")
                .update({ voice_otp_retry_count: retryCount + 1 })
                .eq("id", location.id);

              try {
                await requestVerificationCode(location.meta_phone_id, "VOICE");
                console.log(`[Telnyx Voice] OTP retry triggered successfully for location ${location.id}`);
              } catch (retryErr) {
                console.error(`[Telnyx Voice] Failed to re-request OTP for location ${location.id}:`, retryErr);
              }
            } else {
              // ── Second failure: notify restaurant owner + reset counter ──
              console.error(`[Telnyx Voice] OTP transcription failed after ${retryCount + 1} attempts for location ${location.id}. Manual intervention required.`);

              await supabase
                .from("locations")
                .update({ voice_otp_retry_count: 0 })
                .eq("id", location.id);

              if (location.organization_id) {
                await createNotification(supabase, {
                  organizationId: location.organization_id,
                  locationId: location.id,
                  type: "voice_otp_failed",
                  title: "Verifica numero non riuscita",
                  body: "La verifica automatica del numero non è andata a buon fine dopo due tentativi. Inserisci il codice manualmente dall'app o contatta il supporto.",
                  link: "/onboarding/voice",
                  metadata: { locationId: location.id, attempts: retryCount + 1 },
                });
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[Telnyx Voice] Error handling Telnyx webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
