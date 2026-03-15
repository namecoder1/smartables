import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { updatePhoneNumber } from "@/lib/telnyx";

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    // 1. Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phoneNumberId, phoneNumber, connectionId, locationId } =
      await request.json();

    if (!phoneNumber || !locationId || !phoneNumberId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 2. Verify user owns the location
    const { data: location, error: locationError } = await supabase
      .from("locations")
      .select("organization_id")
      .eq("id", locationId)
      .single();

    if (locationError || !location) {
      return NextResponse.json(
        { error: "Location not found or access denied" },
        { status: 404 },
      );
    }

    // Verify user belongs to the same organization via profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile || profile.organization_id !== location.organization_id) {
      return NextResponse.json(
        { error: "Unauthorized access to location" },
        { status: 403 },
      );
    }

    // 3. Update Telnyx number configuration (assign Call Control App if provided)
    if (connectionId) {
      await updatePhoneNumber(phoneNumberId, connectionId);
    }

    // 4. Update Database
    const { error: updateError } = await supabase
      .from("locations")
      .update({
        telnyx_phone_number: phoneNumber,
        telnyx_connection_id: connectionId,
      })
      .eq("id", locationId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error assigning number:", error);
    const message =
      error instanceof Error ? error.message : "Failed to assign number";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
