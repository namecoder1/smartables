"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CreateBookingState = {
  error: string | null;
  success: boolean;
  bookingId?: string;
};

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

  // Combine date and time into ISO string (assuming local time for now, or UTC)
  // In a real app we need to handle timezones carefully (Location timezone).
  // For MVP we assume the server/browser consistency or store as is.
  // Ideally: '2023-10-25T20:00:00.000Z'
  // Combine date and time into ISO string
  const bookingTime = new Date(`${date}T${time}:00`).toISOString();

  // 1. Check if customer exists or create new (Upsert based on phone + org)
  // We need query to find customer first or upsert.
  // Since we don't have a direct "upsert on conflict" that returns ID easily without RLS knowing user...
  // Actually RLS for "public" might be restricted.
  // IMPORTANT: We need `service_role` client for this action because 'anon' user shouldn't just write to anyone's DB.
  // HOWEVER: `createClient` uses user session. We might need a admin client for public actions?
  // OR we enable RLS for Anon to INSERT but not SELECT.

  // Let's try regular client first. If it fails, we need `supabase-admin` pattern.
  // But wait, `supabase/server` uses cookies. Public user has no cookie. So it is Anon.
  // If RLS allows Anon Insert, it works.

  // Insert Booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      organization_id: organizationId,
      location_id: locationId,
      guest_name: guestName,
      guest_phone: guestPhone,
      guests_count: guestsCount,
      booking_time: bookingTime,
      status: "pending",
      source: source,
    })
    .select()
    .single();

  if (bookingError) {
    console.error("Booking Error:", bookingError);
    return {
      error: "Errore durante la prenotazione. Riprova.",
      success: false,
    };
  }

  // Create/Update Customer Logic (Optional for MVP, can be done by trigger or background job,
  // but better to have `customer_id` on booking if possible.
  // For simplicity MVP, we just store guest_name/phone on booking as designed in schema.)

  revalidatePath(`/p/${formData.get("locationSlug")}`);
  return { success: true, bookingId: booking.id, error: null };
}
