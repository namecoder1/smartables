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
        { status: 400 }
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
        { status: 404 }
      );
    }

    // 2. Buy from Telnyx
    // Note: You might want to pass a connectionId here if you have a specific Call Control App
    // For now we leave it undefined or you can add it to environment variables
    const purchaseResult = await purchasePhoneNumber(phoneNumber);

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
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: purchaseResult });
  } catch (error) {
    console.error("Error purchasing Telnyx number:", error);
    return NextResponse.json(
      { error: "Failed to purchase number" },
      { status: 500 }
    );
  }
}
