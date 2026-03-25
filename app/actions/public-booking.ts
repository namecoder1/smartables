"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { CreateBookingState } from "@/types/general";
import { upsertCustomerForBooking, createBookingRecord } from "./bookings";
import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/ratelimit";
import { subHours } from "date-fns";
import { getStr, getNullableStr, getInt } from "@/lib/form-parsers";
import { dynamicPath } from "@/lib/revalidation-paths";
import { validatePublicBookingFields } from "@/lib/validators/booking";
import { sendBookingPush } from "@/lib/booking-notifications";

export async function createPublicBooking(
  prevState: CreateBookingState,
  formData: FormData,
  source: string,
): Promise<CreateBookingState> {
  const supabase = await createClient();

  const locationId = getStr(formData, "locationId");
  const organizationId = getStr(formData, "organizationId");
  const guestName = getStr(formData, "guestName");
  const guestPhone = getStr(formData, "guestPhone");
  const guestsCount = getInt(formData, "guestsCount");
  const date = getStr(formData, "date"); // YYYY-MM-DD
  const time = getStr(formData, "time"); // HH:mm
  const childrenCount = getInt(formData, "childrenCount", 0);
  const allergies = getNullableStr(formData, "allergies");

  const validationError = validatePublicBookingFields({ locationId, organizationId, guestName, guestPhone, date, time });
  if (validationError) return { error: validationError, success: false };

  // 1. Honeypot check
  const honeypot = getStr(formData, "honeypot");
  if (honeypot) {
    console.warn("Spam detected via honeypot field");
    return { error: "Spam rilevato. Riprova.", success: false };
  }

  // 2. Rate limiting check
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "127.0.0.1";
  const { success: limitSuccess } = await checkRateLimit(ip);

  if (!limitSuccess) {
    return {
      error: "Troppe richieste. Riprova tra qualche minuto.",
      success: false,
    };
  }

  // 3. Duplicate check (prevent multiple pending/confirmed bookings for same phone at same location in last 24h)
  const twentyFourHoursAgo = subHours(new Date(), 24).toISOString();
  const { data: existingBookings, error: duplicateError } = await supabase
    .from("bookings")
    .select("id, booking_time")
    .eq("location_id", locationId)
    .eq("guest_phone", guestPhone)
    .gt("created_at", twentyFourHoursAgo)
    .in("status", ["pending", "confirmed"])
    .limit(3);

  if (duplicateError) {
    console.error("Duplicate check error:", duplicateError);
  }

  if (existingBookings && existingBookings.length > 0) {
    // Check if any existing booking is for the same date
    const sameDayBooking = existingBookings.find((b: any) => {
      return b.booking_time?.split("T")[0] === date;
    });

    if (sameDayBooking) {
      return {
        error:
          "Hai già una prenotazione per questa data. Contatta il locale per modifiche.",
        success: false,
      };
    }

    // If they already have 2 bookings in 24 hours (for different dates), block only if length >= 2
    if (existingBookings.length >= 2) {
      return {
        error:
          "Hai raggiunto il limite massimo di prenotazioni per oggi. Contatta il locale se hai bisogno di assistenza.",
        success: false,
      };
    }
  }

  // Capacity check — prevent double-booking from public page
  const { data: slotAvailable, error: capacityErr } = await supabase.rpc(
    "check_booking_capacity",
    { p_location_id: locationId, p_booking_time: `${date}T${time}:00`, p_guests_count: guestsCount },
  );
  if (!capacityErr && slotAvailable === false) {
    return { error: "Ci dispiace, la disponibilità per l'orario selezionato è esaurita. Scegli un altro orario.", success: false };
  }

  // Combine date and time to represent the local time at the restaurant in Italy
  // fromZonedTime ensures the output UTC string correctly reflects Italian daylight saving adjustments
  const { fromZonedTime } = await import("date-fns-tz");
  const bookingTimeDate = fromZonedTime(`${date}T${time}:00`, "Europe/Rome");
  const bookingTime = bookingTimeDate.toISOString();

  // Create or update customer record consistently
  const customerId = await upsertCustomerForBooking(
    supabase,
    organizationId,
    locationId,
    guestName,
    guestPhone,
    bookingTime,
  );

  if (!customerId) {
    return {
      error: "Errore durante la registrazione del cliente. Riprova.",
      success: false,
    };
  }

  // Create booking record using shared helper
  const { data: booking, error: bookingError } = await createBookingRecord(
    supabase,
    organizationId,
    locationId,
    customerId,
    guestName,
    guestPhone,
    guestsCount,
    bookingTime,
    childrenCount,
    allergies,
    source,
  );

  if (bookingError) {
    console.error("Booking Error:", bookingError);
    return {
      error: "Errore durante la prenotazione. Riprova.",
      success: false,
    };
  }

  // Push notification to staff — non-blocking, respects preferences
  sendBookingPush(organizationId, {
    id: booking.id,
    guestName: guestName,
    guestsCount: guestsCount,
    bookingTime: bookingTime,
    locationId: locationId,
  }, "public");

  revalidatePath(dynamicPath.publicLocation(getStr(formData, "locationSlug")));
  return { success: true, bookingId: booking.id, error: null };
}
