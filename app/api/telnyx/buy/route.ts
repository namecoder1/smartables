import { purchasePhoneNumber } from "@/lib/telnyx";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, locationId } = body;

    if (!phoneNumber || !locationId) {
      return NextResponse.json(
        { error: "Missing phoneNumber or locationId" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // 1. Verify user has access to this location
    const { data: location, error: locationError } = await supabase
      .from("locations")
      .select("id")
      .eq("id", locationId)
      .single();

    if (locationError || !location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 },
      );
    }

    // 2. Buy from Telnyx
    // Fetch location with regulatory data
    const { data: regulatory } = await supabase
      .from("locations")
      .select(`telnyx_requirement_group_id, regulatory_status`)
      .eq("id", locationId)
      .single();

    const requirementGroupId = regulatory?.telnyx_requirement_group_id;

    if (!requirementGroupId) {
      return NextResponse.json(
        {
          error:
            "Compliance: No Regulatory Requirement Group found. Please submit documents first.",
        },
        { status: 400 },
      );
    }

    // PROVISIONING FLOW: Verification happens AFTER purchase for Italian numbers (async)
    // We link the (likely unapproved) requirement group to the order.
    const purchaseResult = await purchasePhoneNumber(
      phoneNumber,
      requirementGroupId,
    );

    // 3. Update database
    const { error: updateError } = await supabase
      .from("locations")
      .update({
        telnyx_phone_number: phoneNumber,
        activation_status: "provisioning", // Locked until webhook confirms 'active' or 'verified'
      })
      .eq("id", locationId);

    if (updateError) {
      console.error("Error updating location with new number:", updateError);
      return NextResponse.json(
        { error: "Number purchased but failed to update database" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: purchaseResult });
  } catch (error) {
    console.error("Error purchasing Telnyx number:", error);
    return NextResponse.json(
      { error: "Failed to purchase number" },
      { status: 500 },
    );
  }
}
