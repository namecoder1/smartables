"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/supabase-helpers";
import { ok, fail } from "@/lib/action-response";
import { PATHS } from "@/lib/revalidation-paths";
import { getStr, getNullableStr, getInt, getBool } from "@/lib/form-parsers";
import { createNotification } from "@/lib/notifications";
import { sendBookingPush } from "@/lib/booking-notifications";
import { validateBookingFields, validateGuestFields } from "@/lib/validators/booking";
import type { CreateBookingState } from "@/types/general";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function createBooking(
  prevState: CreateBookingState,
  formData: FormData,
): Promise<CreateBookingState> {
  const auth = await requireAuth();
  if (!auth.success) return { error: auth.error, success: false };
  const { supabase, organizationId } = auth;

  // 2. Extract Data
  const isKnownCustomer = getBool(formData, "isKnownCustomer");
  const selectedCustomerId = getNullableStr(formData, "selectedCustomer");
  const locationId = getNullableStr(formData, "location_id");

  const guestName = getStr(formData, "name");
  const guestPhone = getStr(formData, "phone");
  const guestsCount = getInt(formData, "guests");
  const childrenCount = getInt(formData, "children_count", 0);
  const allergies = getNullableStr(formData, "allergies");

  const bookingTime = getStr(formData, "date"); // ISO string
  const notes = getStr(formData, "notes");

  // Validation
  const fieldError = validateBookingFields({ guestsCount, bookingTime, locationId });
  if (fieldError) return { error: fieldError, success: false };

  // Capacity check — prevent double-booking
  const { data: slotAvailable, error: capacityErr } = await supabase.rpc(
    "check_booking_capacity",
    { p_location_id: locationId, p_booking_time: bookingTime, p_guests_count: guestsCount },
  );
  if (!capacityErr && slotAvailable === false) {
    return { error: "Lo slot selezionato non è più disponibile per il numero di persone richiesto. Scegli un altro orario.", success: false };
  }

  if (isKnownCustomer) {
    if (!selectedCustomerId) {
      return { error: "Please select a customer", success: false };
    }
  } else {
    const guestError = validateGuestFields({ guestName, guestPhone });
    if (guestError) return { error: guestError, success: false };
  }

  let finalCustomerId = selectedCustomerId;

  try {
    // 3. Customer Handling
    if (!isKnownCustomer) {
      const upsertedId = await upsertCustomerForBooking(
        supabase,
        organizationId,
        locationId!,
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

    const { data: newBooking, error: bookingError } = await createBookingRecord(
      supabase,
      organizationId,
      locationId!,
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

    // Notify staff about new booking
    if (newBooking) {
      const bookingDate = new Date(bookingTime);
      const formattedDate = bookingDate.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
      const formattedTime = bookingDate.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
      const notifBody = `${guestName} — ${guestsCount} persone il ${formattedDate} alle ${formattedTime}`;
      createNotification(supabase, {
        organizationId,
        locationId: locationId ?? null,
        type: "new_booking",
        title: "Nuova prenotazione",
        body: notifBody,
        link: "/reservations",
        metadata: { bookingId: newBooking.id, guestsCount, bookingTime },
      });
      // Push notification to staff — non-blocking, respects preferences
      sendBookingPush(organizationId, {
        id: newBooking.id,
        guestName: guestName,
        guestsCount: guestsCount,
        bookingTime: bookingTime,
        locationId: locationId ?? undefined,
      }, "manual");
    }

    // Trigger the 24h reminder job for non-same-day bookings with phone number
    if (newBooking && guestPhone) {
      const bookingDate = new Date(bookingTime);
      const hoursUntilBooking = (bookingDate.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilBooking > 24) {
        try {
          const { tasks } = await import("@trigger.dev/sdk/v3");
          const { verifyBooking } = await import("@/trigger/verify-booking");
          await tasks.trigger<typeof verifyBooking>("verify-booking", {
            bookingId: newBooking.id,
            locationId: locationId!,
            customerId: finalCustomerId || undefined,
            guestName: guestName || "Ospite",
            guestPhone,
            bookingTime,
          });
        } catch (triggerErr) {
          // Non-blocking: log but don't fail the booking creation
          console.error("[createBooking] Failed to trigger verify-booking:", triggerErr);
        }
      }

      // Trigger review request at booking time (for all bookings with a phone number)
      try {
        const { tasks } = await import("@trigger.dev/sdk/v3");
        const { requestReview } = await import("@/trigger/request-review");
        await tasks.trigger<typeof requestReview>("request-review", {
          bookingId: newBooking.id,
          locationId: locationId!,
          guestPhone,
          bookingTime,
        });
      } catch (triggerErr) {
        console.error("[createBooking] Failed to trigger request-review:", triggerErr);
      }
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    return { error: "An unexpected error occurred", success: false };
  }

  revalidatePath(PATHS.RESERVATIONS_PLATFORM_LAYOUT, "layout");
  return { success: true, message: "Booking created successfully" };
}

export async function updateBooking(
  id: string,
  data: Record<string, unknown>,
  prevState?: CreateBookingState,
  formData?: FormData,
): Promise<
  CreateBookingState | { error?: string; success: boolean; message?: string }
> {
  const auth = await requireAuth();
  if (!auth.success) return { error: auth.error, success: false };
  const { supabase } = auth;

  // If called directly with data (like from status changes, table assignment, etc.)
  if (!formData) {
    // Fetch current booking before update to get locationId + googleEventId
    const { data: current } = await supabase
      .from("bookings")
      .select("location_id, google_event_id, status")
      .eq("id", id)
      .single();

    const { error } = await supabase.from("bookings").update(data).eq("id", id);

    if (error) {
      console.error("Booking Update Error:", error);
      return { error: "Failed to update booking", success: false };
    }

    // Trigger GCal sync — fire-and-forget
    if (current?.location_id) {
      const newStatus = data.status as string | undefined;
      const isTerminal = newStatus === "cancelled" || newStatus === "no_show";

      if (isTerminal && current.google_event_id) {
        // Delete the GCal event when booking is cancelled/no-show
        triggerGcalDelete(current.location_id, current.google_event_id, id);
      } else if (newStatus === "confirmed" || current.google_event_id) {
        // Create or update GCal event on confirm, or whenever booking already has one
        triggerGcalSync(id, current.location_id);
      }
    }

    revalidatePath(PATHS.RESERVATIONS_PLATFORM_LAYOUT, "layout");
    revalidatePath(PATHS.RESERVATIONS_ORG);
    return { success: true, message: "Booking updated successfully" };
  }

  // Otherwise, it was called from a form
  const guestName = getStr(formData, "name");
  const guestPhone = getStr(formData, "phone");
  const guestsCount = getInt(formData, "guests");
  const childrenCount = getInt(formData, "children_count", 0);
  const allergies = getNullableStr(formData, "allergies");

  const bookingTime = getStr(formData, "date");
  const notes = getStr(formData, "notes");
  const isKnownCustomer = getBool(formData, "isKnownCustomer");
  const selectedCustomerId = getNullableStr(formData, "selectedCustomer");

  // Validation for form submission
  if (!guestsCount || !bookingTime) {
    return {
      error: "Missing required fields (guests or date)",
      success: false,
    };
  }

  const updatePayload: Record<string, unknown> = {
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
    const guestError = validateGuestFields({ guestName, guestPhone });
    if (guestError) return { error: guestError, success: false };
    updatePayload.guest_name = guestName;
    updatePayload.guest_phone = guestPhone;

    if (!isKnownCustomer) {
      updatePayload.customer_id = null;
    }
  }

  // Fetch current booking to get locationId + googleEventId before update
  const { data: current } = await supabase
    .from("bookings")
    .select("location_id, google_event_id")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("bookings")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    console.error("Booking Update Error:", error);
    return { error: "Failed to update booking", success: false };
  }

  // Sync GCal if the booking already has a linked event
  if (current?.location_id && current.google_event_id) {
    triggerGcalSync(id, current.location_id);
  }

  revalidatePath(PATHS.RESERVATIONS_PLATFORM_LAYOUT, "layout");
  revalidatePath(PATHS.RESERVATIONS_ORG);
  return { success: true, message: "Booking updated successfully" };
}

// ── GCal trigger helpers (fire-and-forget) ────────────────────────────────────

function triggerGcalSync(bookingId: string, locationId: string) {
  import("@trigger.dev/sdk/v3")
    .then(({ tasks }) => import("@/trigger/sync-booking-to-gcal").then(({ syncBookingToGcal }) =>
      tasks.trigger<typeof syncBookingToGcal>("sync-booking-to-gcal", {
        action: "sync",
        bookingId,
        locationId,
      })
    ))
    .catch((e) => console.error("[GCal] triggerGcalSync failed:", e));
}

function triggerGcalDelete(locationId: string, googleEventId: string, bookingId?: string) {
  import("@trigger.dev/sdk/v3")
    .then(({ tasks }) => import("@/trigger/sync-booking-to-gcal").then(({ syncBookingToGcal }) =>
      tasks.trigger<typeof syncBookingToGcal>("sync-booking-to-gcal", {
        action: "delete",
        locationId,
        googleEventId,
        bookingId,
      })
    ))
    .catch((e) => console.error("[GCal] triggerGcalDelete failed:", e));
}

// Helpers
async function getCustomerInfo(supabase: SupabaseClient, id: string) {
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
  supabase: SupabaseClient,
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
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const { error } = await supabase
    .from("bookings")
    .update({ table_id: tableId })
    .eq("id", bookingId);

  if (error) return fail(error.message);

  revalidatePath(PATHS.RESERVATIONS_ORG);
  return ok();
}

export async function unassignBooking(bookingId: string) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const { error } = await supabase
    .from("bookings")
    .update({ table_id: null })
    .eq("id", bookingId);

  if (error) return fail(error.message);

  revalidatePath(PATHS.RESERVATIONS_ORG);
  return ok();
}

export async function createWalkInBooking(
  locationId: string,
  tableId: string,
  guestsCount: number,
) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const { data: loc } = await supabase
    .from("locations")
    .select("organization_id")
    .eq("id", locationId)
    .single();

  if (!loc) return fail("Sede non trovata");

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

  if (error) return fail(error.message);

  revalidatePath(PATHS.RESERVATIONS_ORG);
  return { success: true as const, data };
}

/**
 * Shared helper to create a booking record in the DB, resolving the display name/phone
 * if a customer ID is provided.
 */
export async function createBookingRecord(
  supabase: SupabaseClient,
  organizationId: string,
  locationId: string,
  customerId: string | null,
  providedGuestName: string,
  providedGuestPhone: string,
  guestsCount: number,
  bookingTime: string,
  childrenCount?: number | null,
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

export async function deleteBookings(ids: string[]) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase, user, organizationId } = auth;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "owner") {
    return fail("Solo gli amministratori possono eliminare le prenotazioni");
  }

  // Collect GCal events to clean up before deletion
  const { data: linked } = await supabase
    .from("bookings")
    .select("id, location_id, google_event_id")
    .in("id", ids)
    .not("google_event_id", "is", null);

  const { error } = await supabase
    .from("bookings")
    .delete()
    .in("id", ids)
    .eq("organization_id", organizationId);

  if (error) return fail(error.message);

  // Fire GCal delete tasks after DB removal (pass googleEventId directly since row is gone)
  linked?.forEach((b) => {
    if (b.google_event_id && b.location_id) {
      triggerGcalDelete(b.location_id, b.google_event_id);
    }
  });

  revalidatePath(PATHS.RESERVATIONS);
  return ok("Prenotazioni eliminate con successo");
}

/**
 * Creates a booking starting from a Google Calendar event (import flow).
 * Sets google_event_id automatically so the event is linked from the start.
 */
export async function createBookingFromGcalEvent({
  locationId,
  guestName,
  guestPhone,
  guestsCount,
  bookingTime,
  googleEventId,
  notes,
}: {
  locationId: string;
  guestName: string;
  guestPhone: string;
  guestsCount: number;
  bookingTime: string;
  googleEventId: string;
  notes?: string;
}) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase, organizationId } = auth;

  const finalCustomerId = guestPhone
    ? await upsertCustomerForBooking(supabase, organizationId, locationId, guestName, guestPhone, bookingTime)
    : null;

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      organization_id: organizationId,
      location_id: locationId,
      customer_id: finalCustomerId,
      guest_name: guestName,
      guest_phone: guestPhone,
      guests_count: guestsCount,
      booking_time: bookingTime,
      notes: notes ?? null,
      status: "confirmed",
      source: "manual",
      google_event_id: googleEventId,
    })
    .select("id")
    .single();

  if (error) return fail("Impossibile creare la prenotazione");

  revalidatePath(PATHS.RESERVATIONS_PLATFORM_LAYOUT, "layout");
  return ok(booking.id);
}
