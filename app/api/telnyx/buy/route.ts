import { purchasePhoneNumber } from "@/lib/telnyx";
import { createClient } from "@/supabase/server";
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
    // Fetch regulatory requirement for this location/area code if needed
    // Assuming location has an associated regulatory requirement or we fail
    const { data: regulatory } = await supabase
      .from("locations")
      .select(
        `
        regulatory_requirement_id,
        regulatory_requirements:telnyx_regulatory_requirements (
          telnyx_requirement_group_id,
          status
        )
      `,
      )
      .eq("id", locationId)
      .single();

    // Supabase join might return an array or object depending on relationship definition
    // Safely cast or access
    const regulatoryData = regulatory?.regulatory_requirements as any;
    const requirementGroupId = Array.isArray(regulatoryData)
      ? regulatoryData[0]?.telnyx_requirement_group_id
      : regulatoryData?.telnyx_requirement_group_id;

    if (!requirementGroupId) {
      return NextResponse.json(
        {
          error:
            "Compliance: No approved Regulatory Requirement found for this location.",
        },
        { status: 400 },
      );
    }

    const purchaseResult = await purchasePhoneNumber(
      phoneNumber,
      requirementGroupId,
    );

    // 3. Update database
    const { error: updateError } = await supabase
      .from("locations")
      .update({
        telnyx_phone_number: phoneNumber,
        // If we get an ID from purchaseResult, we can save it too.
        // purchaseResult usually contains id or similar references.
        // For now trusting the phone number is the key reference.
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
