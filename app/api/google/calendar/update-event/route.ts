import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getCalendarAccessToken } from "@/lib/google-calendar";

export async function PATCH(req: NextRequest) {
  const { locationId, calendarId, eventId, start, end } = await req.json();

  if (!locationId || !calendarId || !eventId || !start || !end) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tokenResult = await getCalendarAccessToken(locationId);
  if (!tokenResult) {
    return NextResponse.json({ error: "Not connected" }, { status: 400 });
  }

  // Fetch current event to check if it's all-day and preserve timezone
  const getRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { headers: { Authorization: `Bearer ${tokenResult.accessToken}` } },
  );
  if (!getRes.ok) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  const currentEvent = await getRes.json();
  const isAllDay = !!currentEvent.start?.date;

  const updatedStart = isAllDay
    ? { date: new Date(start).toISOString().split("T")[0] }
    : {
        dateTime: new Date(start).toISOString(),
        timeZone: currentEvent.start?.timeZone ?? "Europe/Rome",
      };

  const updatedEnd = isAllDay
    ? { date: new Date(end).toISOString().split("T")[0] }
    : {
        dateTime: new Date(end).toISOString(),
        timeZone: currentEvent.end?.timeZone ?? "Europe/Rome",
      };

  const patchRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${tokenResult.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ start: updatedStart, end: updatedEnd }),
    },
  );

  if (!patchRes.ok) {
    const err = await patchRes.json();
    return NextResponse.json({ error: "Failed to update event", details: err }, { status: 502 });
  }

  const updated = await patchRes.json();
  return NextResponse.json({ success: true, event: updated });
}
