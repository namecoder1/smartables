"use server";

import { revalidatePath } from "next/cache";
import { PATHS } from "@/lib/revalidation-paths";
import { requireAuth } from "@/lib/supabase-helpers";
import { ok, fail, okWith } from "@/lib/action-response";
import {
  decryptConnectors,
  encryptConnectors,
} from "@/lib/business-connectors";
import { getCalendarAccessToken } from "@/lib/google-calendar";

export async function saveGoogleCalendar(
  locationId: string,
  calendarId: string,
  calendarName: string,
) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const { data: loc } = await supabase
    .from("locations")
    .select("business_connectors")
    .eq("id", locationId)
    .single();

  let existing = {};
  if (loc?.business_connectors) {
    try {
      existing = decryptConnectors(loc.business_connectors as string);
    } catch {
      // keep going with what we have
    }
  }

  const encrypted = encryptConnectors({
    ...existing,
    google_calendar_id: calendarId,
    google_calendar_name: calendarName,
  });

  const { error } = await supabase
    .from("locations")
    .update({ business_connectors: encrypted })
    .eq("id", locationId);

  if (error) return fail("Impossibile salvare il calendario");
  return ok();
}

export async function disconnectGoogleCalendar(locationId: string) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const { data: loc } = await supabase
    .from("locations")
    .select("business_connectors")
    .eq("id", locationId)
    .single();

  let existing = {};
  if (loc?.business_connectors) {
    try {
      existing = decryptConnectors(loc.business_connectors as string);
    } catch {
      // nothing to decrypt
    }
  }

  const encrypted = encryptConnectors({
    ...existing,
    google_calendar_access_token: undefined,
    google_calendar_refresh_token: undefined,
    google_calendar_token_expiry: undefined,
    google_calendar_id: undefined,
    google_calendar_name: undefined,
  });

  await supabase
    .from("locations")
    .update({ business_connectors: encrypted })
    .eq("id", locationId);

  return ok();
}

export async function moveBooking(bookingId: string, newTime: Date, endTime?: Date) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const update: Record<string, string | null> = { booking_time: newTime.toISOString() };
  if (endTime !== undefined) {
    update.booking_end_time = endTime.toISOString();
  }

  const { error } = await supabase
    .from("bookings")
    .update(update)
    .eq("id", bookingId);

  if (error) return fail("Impossibile spostare la prenotazione");
  revalidatePath(PATHS.RESERVATIONS);
  return ok();
}

export async function linkGoogleEvent(bookingId: string, googleEventId: string) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const { error } = await supabase
    .from("bookings")
    .update({ google_event_id: googleEventId })
    .eq("id", bookingId);

  if (error) return fail("Impossibile collegare l'evento");
  return ok();
}

export async function unlinkGoogleEvent(bookingId: string) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const { error } = await supabase
    .from("bookings")
    .update({ google_event_id: null })
    .eq("id", bookingId);

  if (error) return fail("Impossibile scollegare l'evento");
  return ok();
}

export async function fetchGcalEventForBooking(locationId: string, googleEventId: string) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);

  // Verify the location belongs to the authenticated org
  const { supabase } = auth;
  const { data: loc } = await supabase
    .from("locations")
    .select("business_connectors")
    .eq("id", locationId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (!loc) return fail("Location non trovata");

  const tokenResult = await getCalendarAccessToken(locationId);
  if (!tokenResult) return fail("Google Calendar non collegato");

  const calendarId = tokenResult.connectors.google_calendar_id ?? "primary";
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
    { headers: { Authorization: `Bearer ${tokenResult.accessToken}` } },
  );

  if (!res.ok) return fail("Evento non trovato");

  const ev = await res.json();
  return okWith(ev);
}
