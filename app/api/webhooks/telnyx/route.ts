import { NextResponse } from "next/server";
import { createAdminClient } from "@/supabase/admin";
import { Resend } from "resend";
import { purchasePhoneNumber } from "@/lib/telnyx";

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

      // 2. If Approved, Purchase Number & Activate Location & Register with Meta
      if (status === "approved" && reqGroup?.location_id) {
        // Fetch Location to get the phone number
        const { data: location, error: locationFetchError } = await supabase
          .from("locations")
          .select("telnyx_phone_number, name")
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
            `Purchasing number ${location.telnyx_phone_number} for req group ${id}...`,
          );
          // 2a. Purchase Number (Connection ID is handled in lib/telnyx now)
          await purchasePhoneNumber(location.telnyx_phone_number, id);
          console.log("Number purchased successfully.");

          // 2b. Add to Meta WABA
          /* 
             NOTE: To add a number to WABA via API, the number must be under our control.
             It might take a moment for Telnyx to provision it. 
             If immediate Meta registration fails, we might need a delay or a retry mechanism (e.g. queue).
             For MVP, we try immediately.
           */
          // Parse CC and clean number for Meta? Library does simple substring(0,2).
          // Assuming format is +39... -> 39...
          const cleanNumber = location.telnyx_phone_number.replace("+", "");

          console.log(`Adding ${cleanNumber} to Meta WABA...`);
          // Import strictly dynamically if needed, or top-level. Added top-level below.
          const { addNumberToWaba, requestVerificationCode } =
            await import("@/lib/meta-registration");

          const metaPhoneId = await addNumberToWaba(cleanNumber, location.name);
          console.log(`Meta Phone ID obtained: ${metaPhoneId}`);

          // 2c. Update Location with Status & Meta ID
          const { error: locError } = await supabase
            .from("locations")
            .update({
              activation_status: "active",
              meta_phone_id: metaPhoneId,
              // We don't have telnyx_connection_id explicitly returned from purchase, but it matches env.
              // If we wanted to store it: telnyx_connection_id: process.env.TELNYX_CONNECTION_ID
            })
            .eq("id", reqGroup.location_id);

          if (locError) throw locError;

          // 2d. Trigger Voice Verification
          console.log("Requesting Voice Verification Code from Meta...");
          await requestVerificationCode(metaPhoneId, "VOICE");
          console.log("Verification Code Requested!");
        } catch (error: any) {
          console.error("Failed in automation flow (Purchase/Meta):", error);
          // Don't error the webhook response to Telnyx, they don't care about our Meta issues.
          // But we should log or alert admin.
          return NextResponse.json(
            { error: "Partial Failure: " + error.message },
            { status: 500 },
          );
        }
      }
    } else if (eventType === "number_order.status_updated") {
      // number_order.status_updated
      // payload: { id: "...", status: "success" | "pending" | "failed", requirements_status: ... }
      // This is for the purchase order itself.
      const status = payload.status;
      // We might not be storing the order ID, but we might associate via other means?
      // Usually we care about the phone number status.
      // But let's log it for now.
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
