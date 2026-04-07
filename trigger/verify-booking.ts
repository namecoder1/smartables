import { task, wait } from "@trigger.dev/sdk";
import { createClient } from "@supabase/supabase-js";
import { isBefore, subHours } from "date-fns";
import { captureError } from "@/lib/monitoring";

// Supabase client initialization requires explicit passing since it runs in a different worker
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

type VerifyBookingPayload = {
  bookingId: string;
  locationId: string;
  customerId?: string;
  guestName: string;
  guestPhone: string;
  bookingTime: string; // ISO string
};

export const verifyBooking = task({
  id: "verify-booking",
  run: async (payload: VerifyBookingPayload) => {
    const { bookingId, locationId, guestName, guestPhone, bookingTime } =
      payload;

    const supabase = getSupabaseAdmin();

    // Re-check the database to ensure the booking hasn't been cancelled or already confirmed by the user manually
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("status, organization_id, source, created_at")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error(
        `[Verify Booking] Booking ${bookingId} not found or error.`,
        bookingError,
      );
      return { success: false, reason: "NOT_FOUND" };
    }

    // Italian timezone formatter for same-day evaluation
    const itFormatter = new Intl.DateTimeFormat("it-IT", {
      timeZone: "Europe/Rome",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const createdAtStr = itFormatter.format(new Date(booking.created_at));
    const bookingTimeStr = itFormatter.format(new Date(bookingTime));

    // PERCHÉ saltiamo i whatsapp_auto same-day:
    // Quando un cliente prenota tramite WhatsApp Flow (source: "whatsapp_auto"),
    // ha già interagito con il sistema nel giorno stesso della prenotazione.
    // Inviargli anche un reminder "Confermi la tua prenotazione per oggi?" è
    // ridondante e potrebbe generare confusione o block del messaggio.
    // Il reminder 24h ha senso solo per prenotazioni future (domani o oltre).
    if (booking.source === "whatsapp_auto" && createdAtStr === bookingTimeStr) {
      console.log(
        `[Verify Booking] Booking ${bookingId} is a same-day whatsapp_auto. Skipping verification.`,
      );
      return { success: false, reason: "SAME_DAY_WHATSAPP" };
    }

    // Only send the verification if it's still pending
    if (booking.status !== "pending") {
      console.log(
        `[Verify Booking] Booking ${bookingId} is no longer pending (status: ${booking.status}). Skipping.`,
      );
      return { success: false, reason: "NO_LONGER_PENDING" };
    }

    // Calculate 24 hours before the booking time
    const targetDate = subHours(new Date(bookingTime), 24);

    // If for some reason the 24h mark has already passed, we just skip waiting and execute now
    // though this shouldn't happen because we filter same-day and <24h bookings out before triggering
    if (isBefore(new Date(), targetDate)) {
      console.log(
        `[Verify Booking] Waiting until ${targetDate.toISOString()} to verify booking ${bookingId}`,
      );
      await wait.until({ date: targetDate });

      // Re-fetch booking status after the long wait to make sure they didn't manually cancel/confirm
      const { data: bookingAfterWait } = await supabase
        .from("bookings")
        .select("status")
        .eq("id", bookingId)
        .single();

      if (!bookingAfterWait || bookingAfterWait.status !== "pending") {
        console.log(
          `[Verify Booking] Booking ${bookingId} is no longer pending after waking up. Skipping.`,
        );
        return { success: false, reason: "NO_LONGER_PENDING" };
      }
    }

    // Fetch the location meta phone ID AND name
    const { data: location } = await supabase
      .from("locations")
      .select("meta_phone_id, name")
      .eq("id", locationId)
      .single();

    if (!location?.meta_phone_id) {
      console.error(
        `[Verify Booking] missing meta_phone_id for location ${locationId}`,
      );
      return { success: false, reason: "MISSING_PHONE_ID" };
    }

    // Format time for the template (e.g., "20:30")
    const bookingDateObj = new Date(bookingTime);
    const timeString = bookingDateObj.toLocaleTimeString("it-IT", {
      timeZone: "Europe/Rome",
      hour: "2-digit",
      minute: "2-digit",
    });

    console.log(
      `[Verify Booking] Sending verify template to ${guestPhone} for ${timeString}`,
    );

    // Call WhatsApp API via our internal utility by providing the URL we run locally or remote
    // NOTE: In trigger worker we can't always import next/server modules directly if they rely on request context
    // It's safer to use the helper function directly
    const { sendWhatsAppMessage } = await import("../lib/whatsapp");

    try {
      await sendWhatsAppMessage(
        guestPhone,
        {
          name: "verify_booking",
          language: { code: "it" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: guestName }, // {{1}} Name
                { type: "text", text: timeString }, // {{2}} Time
                { type: "text", text: location.name || "il ristorante" }, // {{3}} Location Name
              ],
            },
          ],
        },
        location.meta_phone_id,
      );

      // Update DB to mark verification sent (if using that column) or just complete
      const { error: updateErr } = await supabase
        .from("bookings")
        .update({ verification_sent: true })
        .eq("id", bookingId);
      if (updateErr) {
        captureError(updateErr, { service: "supabase", flow: "booking_verification_mark_sent", bookingId, locationId });
      }

      return { success: true };
    } catch (e) {
      captureError(e, {
        service: "whatsapp",
        flow: "booking_verification",
        bookingId,
        locationId,
        customerPhone: guestPhone,
      });
      console.error(`[Verify Booking] Failed to send whatsapp message`, e);
      return { success: false, error: e };
    }
  },
});
