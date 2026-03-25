import { task, wait } from "@trigger.dev/sdk";
import { createClient } from "@supabase/supabase-js";
import { captureError } from "@/lib/monitoring";

// Supabase client initialization requires explicit passing since it runs in a different worker
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

type RequestReviewPayload = {
  bookingId: string;
  locationId: string;
  guestPhone: string;
  bookingTime: string; // ISO string
};

/**
 * Formats a booking datetime as "12 Marzo 2026 delle 21:30" (Italian timezone).
 */
function formatBookingDateTime(bookingTime: string): string {
  const date = new Date(bookingTime);

  const dateStr = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  const timeStr = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  // Capitalize the month ("12 marzo 2026" → "12 Marzo 2026")
  const parts = dateStr.split(" ");
  if (parts[1]) parts[1] = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);

  return `${parts.join(" ")} delle ${timeStr}`;
}

export const requestReview = task({
  id: "request-review",
  run: async (payload: RequestReviewPayload) => {
    const { bookingId, locationId, guestPhone, bookingTime } = payload;
    const supabase = getSupabaseAdmin();

    const bookingDate = new Date(bookingTime);

    // Wait until booking time if it's still in the future
    if (bookingDate > new Date()) {
      console.log(
        `[Request Review] Waiting until ${bookingDate.toISOString()} for booking ${bookingId}`,
      );
      await wait.until({ date: bookingDate });
    }

    // Re-fetch booking to check current status after the wait
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("status, organization_id")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error(
        `[Request Review] Booking ${bookingId} not found`,
        bookingError,
      );
      return { success: false, reason: "NOT_FOUND" };
    }

    if (booking.status === "cancelled") {
      console.log(
        `[Request Review] Booking ${bookingId} is cancelled. Skipping review request.`,
      );
      return { success: false, reason: "CANCELLED" };
    }

    // Fetch location data including business_connectors
    const { data: location } = await supabase
      .from("locations")
      .select("meta_phone_id, name, business_connectors")
      .eq("id", locationId)
      .single();

    if (!location?.meta_phone_id) {
      console.error(
        `[Request Review] Missing meta_phone_id for location ${locationId}`,
      );
      return { success: false, reason: "MISSING_PHONE_ID" };
    }

    // Check that a review URL is configured before sending
    if (!location.business_connectors) {
      console.error(
        `[Request Review] No business_connectors configured for location ${locationId}`,
      );
      return { success: false, reason: "MISSING_REVIEW_URL" };
    }

    try {
      const { decryptConnectors } = await import("../lib/business-connectors");
      const connectors = decryptConnectors(location.business_connectors as string);
      if (!connectors.google_review_url) {
        console.error(`[Request Review] No google_review_url for location ${locationId}`);
        return { success: false, reason: "MISSING_REVIEW_URL" };
      }
    } catch (e) {
      captureError(e, {
        service: "supabase",
        flow: "review_request",
        bookingId,
        locationId,
      });
      console.error(`[Request Review] Failed to decrypt business_connectors`, e);
      return { success: false, reason: "DECRYPT_ERROR" };
    }

    // Use the redirect endpoint so the template URL stays fixed regardless of the actual review URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://smartables.it";
    const redirectPath = `/api/review/${locationId}`;

    const formattedDateTime = formatBookingDateTime(bookingTime);
    const { sendWhatsAppMessage } = await import("../lib/whatsapp");

    try {
      await sendWhatsAppMessage(
        guestPhone,
        {
          name: "transactional_service_feedback",
          language: { code: "it" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: location.name || "il ristorante" }, // {{1}} nome location
                { type: "text", text: formattedDateTime }, // {{2}} data e ora
              ],
            },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              // {{1}} = the dynamic suffix appended to the template base URL (smartables.it)
              parameters: [{ type: "text", text: redirectPath }],
            },
          ],
        },
        location.meta_phone_id,
      );

      console.log(
        `[Request Review] Sent review request to ${guestPhone} for booking ${bookingId}`,
      );
      return { success: true };
    } catch (e) {
      captureError(e, {
        service: "whatsapp",
        flow: "review_request",
        bookingId,
        locationId,
        customerPhone: guestPhone,
      });
      console.error(`[Request Review] Failed to send WhatsApp message`, e);
      return { success: false, error: e };
    }
  },
});
