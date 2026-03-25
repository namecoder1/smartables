import { createAdminClient } from "@/utils/supabase/admin";
import { sendPushToOrganization } from "@/lib/push-notifications";

/**
 * Sends a "new booking" push notification to all org devices,
 * but only if push_new_booking preference is enabled.
 *
 * Safe to call from any context (server actions, webhooks, trigger tasks).
 * Non-blocking: errors are swallowed.
 */
export async function sendBookingPush(
  organizationId: string,
  booking: {
    id?: string;
    guestName: string;
    guestsCount: number;
    bookingTime: string; // ISO string
    locationId?: string;
  },
  source: "manual" | "whatsapp" | "public" | "thefork" | "quandoo" | "opentable" = "manual",
) {
  try {
    const supabase = createAdminClient();

    const { data: org } = await supabase
      .from("organizations")
      .select("ux_settings")
      .eq("id", organizationId)
      .single();

    const prefs = (org?.ux_settings as any)?.notifications?.preferences;
    if (prefs?.push_new_booking === false) return; // explicitly disabled

    const date = new Date(booking.bookingTime);
    const formattedDate = date.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
    const formattedTime = date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

    const sourceLabel: Record<typeof source, string> = {
      manual:    "manuale",
      whatsapp:  "WhatsApp",
      public:    "sito",
      thefork:   "TheFork",
      quandoo:   "Quandoo",
      opentable: "OpenTable",
    };

    await sendPushToOrganization(organizationId, {
      title: `📅 Nuova prenotazione (${sourceLabel[source]})`,
      body: `${booking.guestName} — ${booking.guestsCount} persone il ${formattedDate} alle ${formattedTime}`,
      data: {
        type: "new_booking",
        bookingId: booking.id ?? "",
        locationId: booking.locationId ?? "",
      },
    });
  } catch {
    // Non-blocking: never let push failures propagate
  }
}
