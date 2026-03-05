import { NextRequest, NextResponse } from "next/server";
import { WhatsAppWebhookPayload, sendWhatsAppText } from "@/lib/whatsapp";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === "subscribe" && token === verifyToken) {
      console.log("WEBHOOK_VERIFIED");
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return new NextResponse("Bad Request", { status: 400 });
}

// ── Helpers ──

/**
 * Find and cancel the most imminent pending/confirmed booking for a phone number.
 * Returns true if a booking was found and cancelled, false otherwise.
 */
async function handleBookingCancellation(
  supabase: ReturnType<typeof createAdminClient>,
  locationId: string,
  from: string,
  phoneNumberId: string,
) {
  const { data: booking } = await supabase
    .from("bookings")
    .select("id")
    .eq("location_id", locationId)
    .eq("guest_phone", from)
    .in("status", ["pending", "confirmed"])
    .gte("booking_time", new Date().toISOString())
    .order("booking_time", { ascending: true })
    .limit(1)
    .single();

  if (booking) {
    await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", booking.id);
    await sendWhatsAppText(
      from,
      `Nessun problema, abbiamo annullato la tua prenotazione. Speriamo di vederti la prossima volta! 👋`,
      phoneNumberId,
    );
    return true;
  } else {
    await sendWhatsAppText(
      from,
      `Non ho trovato prenotazioni attive a tuo nome da annullare. Se pensi sia un errore, scrivici qui!`,
      phoneNumberId,
    );
    return false;
  }
}

// ── POST Handler ──

export async function POST(req: NextRequest) {
  try {
    const body: WhatsAppWebhookPayload = await req.json();

    console.log("[WhatsApp Webhook] Received:", JSON.stringify(body, null, 2));

    if (
      body.entry &&
      body.entry[0]?.changes &&
      body.entry[0].changes[0]?.value
    ) {
      const value = body.entry[0].changes[0].value;
      const phoneNumberId = value.metadata?.phone_number_id;
      const messages = value.messages;

      if (messages && messages[0]) {
        const message = messages[0];
        const from = message.from; // caller's WhatsApp number

        // ── Handle Quick Reply Button Clicks ──
        if (message.type === "button") {
          const buttonPayload =
            (message as any).button?.payload ||
            (message as any).button?.text ||
            "";
          console.log(
            `[WhatsApp Webhook] 🔘 Button click from ${from}: "${buttonPayload}"`,
          );

          // Find the location by its meta_phone_id
          const supabase = createAdminClient();

          const { data: location } = await supabase
            .from("locations")
            .select("id, organization_id, name")
            .eq("meta_phone_id", phoneNumberId)
            .maybeSingle();

          if (!location) {
            console.error(
              `[WhatsApp Webhook] ❌ No location found for phone_number_id ${phoneNumberId}`,
            );
            return new NextResponse("EVENT_RECEIVED", { status: 200 });
          }

          const normalizedPayload = buttonPayload.toLowerCase().trim();

          if (
            normalizedPayload.includes("fornitore") ||
            normalizedPayload === "supplier"
          ) {
            // ── SUPPLIER TAG ──
            console.log(
              `[WhatsApp Webhook] 📦 Tagging ${from} as supplier for location ${location.id}`,
            );

            await supabase.from("contact_attributes").upsert(
              {
                location_id: location.id,
                phone_number: from,
                tag: "supplier",
                updated_at: new Date().toISOString(),
              },
              { onConflict: "location_id,phone_number,tag" },
            );

            await sendWhatsAppText(
              from,
              'Ricevuto! ✅ Non riceverai più questo messaggio automatico per le prossime chiamate. Se vuoi prenotare come cliente, scrivici "Prenota" in questa chat.',
              phoneNumberId,
            );
          } else if (
            normalizedPayload.includes("richiama") ||
            normalizedPayload.includes("parlare") ||
            normalizedPayload === "callback"
          ) {
            // ── CALLBACK REQUEST ──
            console.log(
              `[WhatsApp Webhook] 📞 Callback request from ${from} for location ${location.id}`,
            );

            await supabase.from("callback_requests").insert({
              location_id: location.id,
              phone_number: from,
              status: "pending",
            });

            await sendWhatsAppText(
              from,
              `Ti ricontatteremo il prima possibile! 📞 Nel frattempo, puoi anche scriverci qui in chat.`,
              phoneNumberId,
            );
          } else if (
            normalizedPayload.includes("prenota") ||
            normalizedPayload.includes("tavolo") ||
            normalizedPayload === "book"
          ) {
            // ── BOOKING FLOW ──
            console.log(
              `[WhatsApp Webhook] 🍽️ Booking request from ${from} — forwarding to chatbot flow`,
            );

            await sendWhatsAppText(
              from,
              `Perfetto! 🍽️ Per quale giorno e a che ora vorresti prenotare? E per quante persone?`,
              phoneNumberId,
            );
          } else if (normalizedPayload.includes("menu")) {
            // ── MENU REQUEST ──
            console.log(`[WhatsApp Webhook] 📜 Menu request from ${from}`);

            await sendWhatsAppText(
              from,
              `Ecco il link al nostro menù digitale: https://smartables.it/m/${location.id}\n\n(Il link reale verrà generato per la sede corretta)`,
              phoneNumberId,
            );
          } else if (
            normalizedPayload.includes("ci sono") ||
            normalizedPayload.includes("confermo")
          ) {
            // ── BOOKING CONFIRMATION (from verify_booking template) ──
            console.log(
              `[WhatsApp Webhook] ✅ Booking Confirmation from ${from} for location ${location.id}`,
            );

            const { data: booking } = await supabase
              .from("bookings")
              .select("id")
              .eq("location_id", location.id)
              .eq("guest_phone", from)
              .eq("status", "pending")
              .gte("booking_time", new Date().toISOString())
              .order("booking_time", { ascending: true })
              .limit(1)
              .single();

            if (booking) {
              await supabase
                .from("bookings")
                .update({ status: "confirmed" })
                .eq("id", booking.id);
              await sendWhatsAppText(
                from,
                `Ottimo! 🎉 Abbiamo confermato il tuo tavolo. A presto!`,
                phoneNumberId,
              );
            } else {
              await sendWhatsAppText(
                from,
                `Non ho trovato prenotazioni in sospeso a tuo nome. Se hai bisogno di aiuto, scrivici pure!`,
                phoneNumberId,
              );
            }
          } else if (
            normalizedPayload.includes("non ci sarò") ||
            normalizedPayload.includes("annulla")
          ) {
            // ── BOOKING CANCELLATION (from verify_booking template or direct message) ──
            console.log(
              `[WhatsApp Webhook] ❌ Booking Cancellation from ${from} for location ${location.id}`,
            );
            await handleBookingCancellation(
              supabase,
              location.id,
              from,
              phoneNumberId,
            );
          } else {
            // ── UNKNOWN BUTTON ──
            console.log(
              `[WhatsApp Webhook] ❓ Unknown button from ${from}: ${buttonPayload}`,
            );
          }
        }
        // ── Handle Flow Completions (Interactive messages) ──
        else if (message.type === "interactive") {
          const interactiveData = (message as any).interactive;

          if (interactiveData.type === "nfm_reply") {
            console.log(`[WhatsApp Webhook] ✅ Flow completion from ${from}`);
            const responseJsonStr = interactiveData.nfm_reply.response_json;

            try {
              const payload = JSON.parse(responseJsonStr);

              // Find the location
              const supabase = createAdminClient();
              const { data: location } = await supabase
                .from("locations")
                .select("id, organization_id, name")
                .eq("meta_phone_id", phoneNumberId)
                .single();

              if (location) {
                // Construct the booking date handling the Italian timezone safely
                const { fromZonedTime } = await import("date-fns-tz");
                const bookingTimeDate = fromZonedTime(
                  `${payload.date}T${payload.time}:00`,
                  "Europe/Rome",
                );
                const bookingDate = bookingTimeDate.toISOString();

                // Insert booking directly into Supabase with the confirmed user phone number
                const { error } = await supabase.from("bookings").insert({
                  organization_id: location.organization_id,
                  location_id: location.id,
                  guest_name: payload.guest_name,
                  guest_phone: from,
                  guests_count: parseInt(payload.guests),
                  children_count: payload.children_count || null,
                  allergies: payload.allergies || null,
                  booking_time: bookingDate,
                  status: "pending",
                  source: "whatsapp_auto",
                  notes: payload.extra_notes || "",
                });

                if (error) {
                  console.error(
                    "Booking creation failed via WhatsApp Webhook",
                    error,
                  );
                  await sendWhatsAppText(
                    from,
                    `Ci dispiace, c'è stato un problema nel salvare la prenotazione. Contattaci in chat per confermare il tavolo!`,
                    phoneNumberId,
                  );
                } else {
                  // Fetch the latest inserted booking for Trigger.dev
                  const { data: latestBooking } = await supabase
                    .from("bookings")
                    .select("id")
                    .eq("guest_phone", from)
                    .eq("booking_time", bookingDate)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();

                  // Formatting dates for friendly output
                  const [year, month, day] = payload.date.split("-");
                  let extraText = "";

                  // Check if booking is "same-day" in Italian timezone (Europe/Rome)
                  const itFormatter = new Intl.DateTimeFormat("it-IT", {
                    timeZone: "Europe/Rome",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  });
                  const todayStr = itFormatter.format(new Date());
                  const targetDateStr = itFormatter.format(
                    new Date(bookingDate),
                  );

                  const isSameDay = todayStr === targetDateStr;

                  if (isSameDay) {
                    extraText = `\n\n💡 Se hai un imprevisto dell'ultimo minuto, scrivici "Annulla" in questa chat.`;
                  } else if (latestBooking) {
                    // Future booking: dispatch the verify task via Trigger.dev SDK
                    try {
                      const { tasks } = await import("@trigger.dev/sdk/v3");
                      const { verifyBooking } =
                        await import("@/trigger/verify-booking");

                      await tasks.trigger<typeof verifyBooking>(
                        "verify-booking",
                        {
                          bookingId: latestBooking.id,
                          locationId: location.id,
                          guestName: payload.guest_name,
                          guestPhone: from,
                          bookingTime: bookingDate,
                        },
                      );
                      console.log(
                        `[WhatsApp Webhook] Trigger.dev verification task dispatched for ${latestBooking.id}`,
                      );
                    } catch (e) {
                      console.warn(
                        `[WhatsApp Webhook] Failed to dispatch Trigger task:`,
                        e,
                      );
                    }
                  }

                  await sendWhatsAppText(
                    from,
                    `✅ Perfetto! La tua prenotazione per *${payload.guests} persone* a nome di *${payload.guest_name}* per il *${day}/${month} alle ${payload.time}* è stata registrata! Ti aspettiamo presso ${location.name}.${extraText}`,
                    phoneNumberId,
                  );
                }
              }
            } catch (e) {
              console.error("Error parsing flow response", e);
            }
          }
        }
        // ── Handle regular text messages ──
        else if (message.type === "text") {
          const textBody = message.text?.body?.toLowerCase().trim() || "";
          console.log(`[WhatsApp Webhook] 💬 Text from ${from}: ${textBody}`);

          if (textBody.includes("annulla")) {
            // Let them cancel via text since same-day bookings don't get buttons
            const supabase = createAdminClient();
            const { data: location } = await supabase
              .from("locations")
              .select("id")
              .eq("meta_phone_id", phoneNumberId)
              .single();

            if (location) {
              await handleBookingCancellation(
                supabase,
                location.id,
                from,
                phoneNumberId,
              );
              return new NextResponse("EVENT_RECEIVED", { status: 200 }); // stop processing
            }
          }

          // Temporary placeholder until chatbot is integrated
          await sendWhatsAppText(
            from,
            `Grazie per il messaggio! Questa è una risposta automatica, l'assistente AI sarà attivo a breve.`,
            phoneNumberId,
          );
        }
      }
    }

    return new NextResponse("EVENT_RECEIVED", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
