"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function assignBookingToTable(bookingId: string, tableId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("bookings")
    .update({ table_id: tableId })
    .eq("id", bookingId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/(private)/(org)/reservations");
}

export async function updateBooking(bookingId: string, data: any) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("bookings")
    .update(data)
    .eq("id", bookingId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/(private)/(org)/reservations");
}

export async function unassignBooking(bookingId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("bookings")
    .update({ table_id: null })
    .eq("id", bookingId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/(private)/(org)/reservations");
}

export async function createWalkInBooking(
  locationId: string,
  tableId: string,
  guestsCount: number,
) {
  const supabase = await createClient();

  const { data: loc } = await supabase
    .from("locations")
    .select("organization_id")
    .eq("id", locationId)
    .single();

  if (!loc) throw new Error("Location non trovata");

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      organization_id: loc.organization_id,
      location_id: locationId,
      table_id: tableId,
      guest_name: "Walk-in",
      guests_count: guestsCount,
      booking_time: new Date().toISOString(),
      status: "confirmed",
      notes: "",
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/(private)/(org)/reservations");
  return data;
}
