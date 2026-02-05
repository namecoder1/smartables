import { rejectCall, answerCall, startRecording } from "@/lib/telnyx";
import { transcribeAudio, extractVerificationCode } from "@/lib/openai";
import { registerNumberWithMeta } from "@/lib/meta-registration";
import { createAdminClient } from "@/supabase/admin";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventType = body.data?.event_type;
    const callControlId = body.data?.payload?.call_control_id;

    if (eventType === "call.initiated") {
      if (callControlId) {
        console.log(`Call Initiated: ${callControlId}. Answering...`);
        await answerCall(callControlId);
      }
    } else if (eventType === "call.answered") {
      if (callControlId) {
        console.log(`Call Answered: ${callControlId}. Starting Recording...`);
        await startRecording(callControlId);
      }
    } else if (eventType === "call.recording.saved") {
      const recordingUrl = body.data.payload.recording_urls?.mp3;
      console.log(`Recording Saved: ${recordingUrl}`);

      if (recordingUrl) {
        // 1. Transcribe
        const text = await transcribeAudio(recordingUrl);
        console.log("Transcribed Text:", text);

        // 2. Extract Code
        const code = extractVerificationCode(text);
        console.log("Extracted Code:", code);

        if (code) {
          // 3. Find Phone Number ID and Register
          // We need to map the "to" number (Telnyx number) to the Meta Phone ID.
          // For now, we assume we can query locations by telnyx_phone_number

          const telnyxNumber = body.data.payload.to;
          const { data: location } = await createAdminClient()
            .from("locations")
            .select("meta_phone_id, id")
            .eq("telnyx_phone_number", telnyxNumber)
            .single();

          if (location?.meta_phone_id) {
            console.log(
              `Registering number for location ${location.id} with ID ${location.meta_phone_id}`,
            );
            await registerNumberWithMeta(location.meta_phone_id, code);
            console.log("Successfully registered with Meta!");

            // Update location status
            await createAdminClient()
              .from("locations")
              .update({ activation_status: "verified" }) // or whatever status means "Ready for Biz"
              .eq("id", location.id);
          } else {
            console.error(
              "Could not find location/meta_phone_id for number:",
              telnyxNumber,
            );
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Error handling Telnyx webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
