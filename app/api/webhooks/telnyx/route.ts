import { NextResponse } from "next/server";
import { createAdminClient } from "@/supabase/admin";
import { Resend } from "resend";

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

      // 2. If Approved, Activate Location
      if (status === "approved" && reqGroup?.location_id) {

        const { error: locError } = await supabase
          .from("locations")
          .update({ activation_status: "active" })
          .eq("id", reqGroup.location_id);

        if (locError) {
          return NextResponse.json(
            { error: locError.message },
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
