import { rejectCall } from "@/lib/telnyx";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventType = body.data?.event_type;
    const callControlId = body.data?.payload?.call_control_id;


    if (eventType === "call.initiated") {
      if (callControlId) {
        // We reject the call immediately to simulate "Busy"
        // This stops the phone from ringing and allows us to trigger the "Missed Call" flow
        await rejectCall(callControlId);

        // TODO: Here we will trigger the WhatsApp message
        // const callerNumber = body.data.payload.from;
        // await sendMissedCallMessage(callerNumber);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Error handling Telnyx webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
