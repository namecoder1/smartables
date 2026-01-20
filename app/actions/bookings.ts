"use server";

import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";

export type CreateBookingState = {
  message?: string;
  error?: string;
  success?: boolean;
};

export async function createBooking(
  prevState: CreateBookingState,
  formData: FormData
): Promise<CreateBookingState> {
  const supabase = await createClient();

  // 1. Auth & Organization Check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized", success: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.organization_id) {
    return { error: "No organization found", success: false };
  }

  // 2. Extract Data
  const isKnownCustomer = formData.get("isKnownCustomer") === "true";
  const selectedCustomerId = formData.get("selectedCustomer") as string | null;

  const guestName = formData.get("name") as string;
  const guestPhone = formData.get("phone") as string;
  const guestsCount = parseInt(formData.get("guests") as string);
  const bookingTime = formData.get("date") as string; // ISO string
  const notes = formData.get("notes") as string;

  // Validation
  if (!guestsCount || !bookingTime) {
    return {
      error: "Missing required fields (guests or date)",
      success: false,
    };
  }

  if (isKnownCustomer) {
    if (!selectedCustomerId) {
      return { error: "Please select a customer", success: false };
    }
    // Verify customer exists? Not strictly necessary if ID comes from valid search
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
      // Check if customer exists by phone to avoid duplicates
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("organization_id", profile.organization_id)
        .eq("phone_number", guestPhone)
        .single();

      if (existingCustomer) {
        finalCustomerId = existingCustomer.id;
      } else {
        // Create new customer
        const { data: newCustomer, error: createError } = await supabase
          .from("customers")
          .insert({
            organization_id: profile.organization_id,
            name: guestName,
            phone_number: guestPhone,
            total_visits: 1, // First visit
            last_visit: bookingTime,
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating customer:", createError);
          return {
            error: "Failed to create new customer record",
            success: false,
          };
        }
        finalCustomerId = newCustomer.id;
      }
    } else {
      // Update visit count for existing customer? Optional logic
    }

    // We need a location_id.
    // For now, let's pick the first location of the organization or assume it's passed.
    // Since the UI doesn't allow selecting location yet, we fetch a default one.
    const { data: location } = await supabase
      .from("locations")
      .select("id")
      .eq("organization_id", profile.organization_id)
      .limit(1)
      .single();

    if (!location) {
      return {
        error: "No location found for this organization",
        success: false,
      };
    }

    // 4. Create Booking
    const { error: bookingError } = await supabase.from("bookings").insert({
      organization_id: profile.organization_id,
      location_id: location.id,
      customer_id: finalCustomerId,
      guest_name:
        guestName || (await getCustomerName(supabase, finalCustomerId!)), // Fallback if known customer
      guest_phone:
        guestPhone || (await getCustomerPhone(supabase, finalCustomerId!)), // Fallback
      booking_time: bookingTime,
      guests_count: guestsCount,
      status: "pending",
      source: "manual",
      notes: notes,
    });

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

// Helpers
async function getCustomerName(supabase: any, id: string) {
  const { data } = await supabase
    .from("customers")
    .select("name")
    .eq("id", id)
    .single();
  return data?.name || "Unknown";
}

async function getCustomerPhone(supabase: any, id: string) {
  const { data } = await supabase
    .from("customers")
    .select("phone_number")
    .eq("id", id)
    .single();
  return data?.phone_number || "";
}
