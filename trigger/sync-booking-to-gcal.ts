import { task } from "@trigger.dev/sdk/v3";
import { createClient } from "@supabase/supabase-js";
import { getCalendarAccessTokenAdmin } from "@/lib/google-calendar";
import { captureError } from "@/lib/monitoring";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

type SyncPayload =
  | { action: "sync"; bookingId: string; locationId: string }
  | { action: "delete"; locationId: string; googleEventId: string; bookingId?: string };

function buildEventTitle(booking: { guest_name: string; guests_count: number }) {
  return `${booking.guest_name} — ${booking.guests_count} pers.`;
}

function buildEventDescription(booking: {
  guest_phone?: string;
  notes?: string | null;
  allergies?: string | null;
}) {
  const parts: string[] = [];
  if (booking.guest_phone) parts.push(`Tel: ${booking.guest_phone}`);
  if (booking.notes) parts.push(`Note: ${booking.notes}`);
  if (booking.allergies) parts.push(`Allergie: ${booking.allergies}`);
  return parts.join("\n") || undefined;
}

export const syncBookingToGcal = task({
  id: "sync-booking-to-gcal",
  retry: {
    maxAttempts: 2,
    factor: 2,
    minTimeoutInMs: 2_000,
    maxTimeoutInMs: 20_000,
    randomize: false,
  },
  run: async (payload: SyncPayload) => {
    const supabase = getSupabaseAdmin();

    const tokenResult = await getCalendarAccessTokenAdmin(payload.locationId, supabase);
    if (!tokenResult) {
      return { skipped: true, reason: "no_gcal_configured" };
    }

    const { accessToken, connectors } = tokenResult;
    const calendarId = connectors.google_calendar_id;
    if (!calendarId) {
      return { skipped: true, reason: "no_calendar_selected" };
    }

    // ── DELETE ─────────────────────────────────────────────────────────────────
    if (payload.action === "delete") {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(payload.googleEventId)}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } },
      );
      // 404 = already deleted on Google side, that's fine
      if (!res.ok && res.status !== 404 && res.status !== 410) {
        const err = new Error(`GCal DELETE failed: ${res.status}`);
        captureError(err, { service: "google_calendar", flow: "sync_booking_delete", locationId: payload.locationId, bookingId: payload.bookingId, googleEventId: payload.googleEventId });
        throw err;
      }
      // Clear google_event_id from booking if we know the bookingId
      if (payload.bookingId) {
        const { error: clearErr } = await supabase
          .from("bookings")
          .update({ google_event_id: null })
          .eq("id", payload.bookingId);
        if (clearErr) {
          captureError(clearErr, { service: "supabase", flow: "sync_booking_delete_clear_event_id", locationId: payload.locationId, bookingId: payload.bookingId });
        }
      }
      return { ok: true, action: "deleted" };
    }

    // ── SYNC (create or update) ─────────────────────────────────────────────────
    const { data: booking } = await supabase
      .from("bookings")
      .select("id, guest_name, guest_phone, guests_count, booking_time, booking_end_time, notes, allergies, google_event_id")
      .eq("id", payload.bookingId)
      .single();

    if (!booking) return { skipped: true, reason: "booking_not_found" };

    const startIso = new Date(booking.booking_time).toISOString();
    const endIso = booking.booking_end_time
      ? new Date(booking.booking_end_time).toISOString()
      : new Date(new Date(booking.booking_time).getTime() + 2 * 60 * 60 * 1000).toISOString();

    const eventBody = {
      summary: buildEventTitle(booking),
      description: buildEventDescription(booking),
      start: { dateTime: startIso, timeZone: "Europe/Rome" },
      end: { dateTime: endIso, timeZone: "Europe/Rome" },
    };

    // UPDATE — booking already linked to a GCal event
    if (booking.google_event_id) {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(booking.google_event_id)}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(eventBody),
        },
      );
      if (res.status === 404 || res.status === 410) {
        // Event was deleted on Google side — fall through to create a new one
      } else if (!res.ok) {
        const err = new Error(`GCal PATCH failed: ${res.status}`);
        captureError(err, { service: "google_calendar", flow: "sync_booking_update", locationId: payload.locationId, bookingId: payload.bookingId });
        throw err;
      } else {
        return { ok: true, action: "updated", googleEventId: booking.google_event_id };
      }
    }

    // CREATE — no existing GCal event
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(eventBody),
      },
    );
    if (!res.ok) {
      const err = new Error(`GCal POST failed: ${res.status}`);
      captureError(err, { service: "google_calendar", flow: "sync_booking_create", locationId: payload.locationId, bookingId: payload.bookingId });
      throw err;
    }
    const created = await res.json();

    // Save google_event_id back to booking
    const { error: saveErr } = await supabase
      .from("bookings")
      .update({ google_event_id: created.id })
      .eq("id", booking.id);
    if (saveErr) {
      captureError(saveErr, { service: "supabase", flow: "sync_booking_create_save_event_id", locationId: payload.locationId, bookingId: booking.id });
    }

    return { ok: true, action: "created", googleEventId: created.id };
  },
});
