import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getCalendarAccessToken } from "@/lib/google-calendar";

export async function GET(req: NextRequest) {
  const locationId = req.nextUrl.searchParams.get("locationId");
  if (!locationId) {
    return NextResponse.json({ error: "Missing locationId" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await getCalendarAccessToken(locationId);
  if (!result) {
    return NextResponse.json({ error: "Not connected" }, { status: 400 });
  }

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    { headers: { Authorization: `Bearer ${result.accessToken}` } },
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch calendars" }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json({ calendars: data.items ?? [] });
}
