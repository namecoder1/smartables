import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getCalendarAccessToken } from "@/lib/google-calendar";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const locationId = searchParams.get("locationId");
  const calendarId = searchParams.get("calendarId");
  const timeMin = searchParams.get("timeMin");
  const timeMax = searchParams.get("timeMax");

  if (!locationId || !calendarId) return NextResponse.json({ events: [] });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tokenResult = await getCalendarAccessToken(locationId);
  if (!tokenResult) return NextResponse.json({ events: [] });

  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "500",
  });
  if (timeMin) params.set("timeMin", timeMin);
  if (timeMax) params.set("timeMax", timeMax);

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${tokenResult.accessToken}` } },
  );

  if (!res.ok) return NextResponse.json({ events: [] });

  const data = await res.json();
  return NextResponse.json({ events: data.items ?? [] });
}
