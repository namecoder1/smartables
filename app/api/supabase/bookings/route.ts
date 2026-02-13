import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") || "desc";
  const status = searchParams.get("status");
  const locationId = searchParams.get("location_id");

  const supabase = await createClient();

  let query = supabase
    .from("bookings")
    .select("*, customer:customers(*)")
    .order("booking_time", { ascending: sort === "asc" });

  if (status) {
    query = query.eq("status", status);
  }

  if (locationId) {
    query = query.eq("location_id", locationId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
