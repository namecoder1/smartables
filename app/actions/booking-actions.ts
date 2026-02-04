"use server";

import { createClient } from "@/supabase/server";
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
