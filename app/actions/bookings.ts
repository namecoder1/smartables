"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/auth";
import type { CreateBookingState } from "@/types/general";

export async function createBooking(
  prevState: CreateBookingState,
  formData: FormData,
): Promise<CreateBookingState> {
  let supabase, organizationId;
  try {
    const ctx = await getAuthContext();
    supabase = ctx.supabase;
    organizationId = ctx.organizationId;
  } catch {
    return { error: "Unauthorized", success: false };
  }

  // 2. Extract Data
  const isKnownCustomer = formData.get("isKnownCustomer") === "true";
  const selectedCustomerId = formData.get("selectedCustomer") as string | null;
  const locationId = formData.get("location_id") as string | null;

  const guestName = formData.get("name") as string;
  const guestPhone = formData.get("phone") as string;
  const guestsCount = parseInt(formData.get("guests") as string);
  const childrenCount = formData.get("children_count") as string | null;
  const allergies = formData.get("allergies") as string | null;

  const bookingTime = formData.get("date") as string; // ISO string
  const notes = formData.get("notes") as string;

  // Validation
  if (!guestsCount || !bookingTime || !locationId) {
    return {
      error: "Missing required fields (guests, date, or location)",
      success: false,
    };
  }

  if (isKnownCustomer) {
    if (!selectedCustomerId) {
      return { error: "Please select a customer", success: false };
    }
  } else {
    if (!guestName || !guestPhone) {
      return {
        error: "Name and Phone are required for new customers",
        success: false,
      };
    }
  }

  let finalCustomerId = selectedCustomerId;

  try {
    // 3. Customer Handling
    if (!isKnownCustomer) {
      const upsertedId = await upsertCustomerForBooking(
        supabase,
        organizationId,
        locationId,
        guestName,
        guestPhone,
        bookingTime,
      );
      if (!upsertedId) {
        return {
          error: "Failed to create or find customer record",
          success: false,
        };
      }
      finalCustomerId = upsertedId;
    }

    const { error: bookingError } = await createBookingRecord(
      supabase,
      organizationId,
      locationId,
      finalCustomerId,
      guestName,
      guestPhone,
      guestsCount,
      bookingTime,
      childrenCount,
      allergies,
      "manual",
      notes,
    );

    if (bookingError) {
      console.error("Booking Creation Error:", bookingError);
      return { error: "Failed to create booking", success: false };
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    return { error: "An unexpected error occurred", success: false };
  }

  revalidatePath("/(private)/(platform)/reservations", "layout");
  return { success: true, message: "Booking created successfully" };
}

export async function updateBooking(
  id: string,
  data: any, // Supports the new direct payload
  prevState?: CreateBookingState, // Optional for form usage
  formData?: FormData, // Optional for form usage
): Promise<
  CreateBookingState | { error?: string; success: boolean; message?: string }
> {
  let supabase;
  try {
    const ctx = await getAuthContext();
    supabase = ctx.supabase;
  } catch {
    return { error: "Unauthorized", success: false };
  }

  // If called directly with data (like from assignBookingToTable or floor plan)
  if (!formData) {
    const { error } = await supabase.from("bookings").update(data).eq("id", id);

    if (error) {
      console.error("Booking Update Error:", error);
      return { error: "Failed to update booking", success: false };
    }

    revalidatePath("/(private)/(platform)/reservations", "layout");
    revalidatePath("/(private)/(org)/reservations");
    return { success: true, message: "Booking updated successfully" };
  }

  // Otherwise, it was called from a form
  const guestName = formData.get("name") as string;
  const guestPhone = formData.get("phone") as string;
  const guestsCount = parseInt(formData.get("guests") as string);
  const childrenCount = formData.get("children_count") as string | null;
  const allergies = formData.get("allergies") as string | null;

  const bookingTime = formData.get("date") as string;
  const notes = formData.get("notes") as string;
  const isKnownCustomer = formData.get("isKnownCustomer") === "true";
  const selectedCustomerId = formData.get("selectedCustomer") as string | null;

  // Validation for form submission
  if (!guestsCount || !bookingTime) {
    return {
      error: "Missing required fields (guests or date)",
      success: false,
    };
  }

  const updatePayload: any = {
    booking_time: bookingTime,
    guests_count: guestsCount,
    children_count: childrenCount,
    allergies: allergies,
    notes: notes,
  };

  if (isKnownCustomer && selectedCustomerId) {
    updatePayload.customer_id = selectedCustomerId;
    const customerInfo = await getCustomerInfo(supabase, selectedCustomerId);
    updatePayload.guest_name = customerInfo.name;
    updatePayload.guest_phone = customerInfo.phone;
  } else {
    if (!guestName || !guestPhone) {
      return { error: "Name and Phone are required", success: false };
    }
    updatePayload.guest_name = guestName;
    updatePayload.guest_phone = guestPhone;

    if (!isKnownCustomer) {
      updatePayload.customer_id = null;
    }
  }

  const { error } = await supabase
    .from("bookings")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    console.error("Booking Update Error:", error);
    return { error: "Failed to update booking", success: false };
  }

  revalidatePath("/(private)/(platform)/reservations", "layout");
  revalidatePath("/(private)/(org)/reservations");
  return { success: true, message: "Booking updated successfully" };
}

// Helpers
async function getCustomerInfo(supabase: any, id: string) {
  const { data } = await supabase
    .from("customers")
    .select("name, phone_number")
    .eq("id", id)
    .single();
  return {
    name: data?.name || "Unknown",
    phone: data?.phone_number || "",
  };
}

/**
 * Shared helper to find or create a customer based on phone number.
 */
export async function upsertCustomerForBooking(
  supabase: any,
  organizationId: string,
  locationId: string,
  guestName: string,
  guestPhone: string,
  bookingTime: string,
) {
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("phone_number", guestPhone)
    .single();

  if (existingCustomer) {
    return existingCustomer.id;
  }

  const { data: newCustomer, error: createError } = await supabase
    .from("customers")
    .insert({
      organization_id: organizationId,
      location_id: locationId,
      name: guestName,
      phone_number: guestPhone,
      total_visits: 1,
      last_visit: bookingTime,
    })
    .select()
    .single();

  if (createError) {
    console.error("Error creating customer:", createError);
    return null;
  }
  return newCustomer.id;
}

export async function assignBookingToTable(bookingId: string, tableId: string) {
  let supabase;
  try {
    const ctx = await getAuthContext();
    supabase = ctx.supabase;
  } catch {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("bookings")
    .update({ table_id: tableId })
    .eq("id", bookingId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/(private)/(org)/reservations");
}

export async function unassignBooking(bookingId: string) {
  let supabase;
  try {
    const ctx = await getAuthContext();
    supabase = ctx.supabase;
  } catch {
    throw new Error("Unauthorized");
  }

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
  let supabase;
  try {
    const ctx = await getAuthContext();
    supabase = ctx.supabase;
  } catch {
    throw new Error("Unauthorized");
  }

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

/**
 * Shared helper to create a booking record in the DB, resolving the display name/phone
 * if a customer ID is provided.
 */
export async function createBookingRecord(
  supabase: any,
  organizationId: string,
  locationId: string,
  customerId: string | null,
  providedGuestName: string,
  providedGuestPhone: string,
  guestsCount: number,
  bookingTime: string,
  childrenCount?: string | null,
  allergies?: string | null,
  source: string = "manual",
  notes?: string | null,
) {
  const customerInfo = customerId
    ? await getCustomerInfo(supabase, customerId)
    : null;
  const guest_name = providedGuestName || customerInfo?.name || "Unknown";
  const guest_phone = providedGuestPhone || customerInfo?.phone || "";

  return await supabase
    .from("bookings")
    .insert({
      organization_id: organizationId,
      location_id: locationId,
      customer_id: customerId,
      guest_name,
      guest_phone,
      guests_count: guestsCount,
      booking_time: bookingTime,
      children_count: childrenCount,
      allergies: allergies,
      status: "pending",
      source: source,
      notes: notes,
    })
    .select()
    .single();
}
