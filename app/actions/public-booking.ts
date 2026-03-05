"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { CreateBookingState } from "@/types/general";
import { upsertCustomerForBooking, createBookingRecord } from "./bookings";

export async function createPublicBooking(
  prevState: CreateBookingState,
  formData: FormData,
  source: string,
): Promise<CreateBookingState> {
  const supabase = await createClient();

  const locationId = formData.get("locationId") as string;
  const organizationId = formData.get("organizationId") as string;
  const guestName = formData.get("guestName") as string;
  const guestPhone = formData.get("guestPhone") as string;
  const guestsCount = parseInt(formData.get("guestsCount") as string);
  const date = formData.get("date") as string; // YYYY-MM-DD
  const time = formData.get("time") as string; // HH:mm

  const childrenCount = formData.get("childrenCount") as string | null;
  const allergies = formData.get("allergies") as string | null;

  if (
    !locationId ||
    !organizationId ||
    !guestName ||
    !guestPhone ||
    !date ||
    !time
  ) {
    return { error: "Compila tutti i campi obbligatori.", success: false };
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

  revalidatePath(`/p/${formData.get("locationSlug")}`);
  return { success: true, bookingId: booking.id, error: null };
}
