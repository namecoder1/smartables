import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("location_id");
  const sort = searchParams.get("sort") || "desc";

  if (!locationId) {
    return NextResponse.json(
      { error: "Location ID is required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // First, get the organization_id for this location to ensure we're fetching the right customers
  const { data: locationData, error: locationError } = await supabase
    .from("locations")
    .select("organization_id")
    .eq("id", locationId)
    .single();

  if (locationError || !locationData?.organization_id) {
    return NextResponse.json(
      { error: "Organization not found for this location" },
      { status: 404 },
    );
  }

  // Fetch customers for this organization
  // We filter by organization_id as some legacy customers might not have location_id set
  let query = supabase
    .from("customers")
    .select("*")
    .eq("organization_id", locationData.organization_id)
    .order("created_at", { ascending: sort === "asc" });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
