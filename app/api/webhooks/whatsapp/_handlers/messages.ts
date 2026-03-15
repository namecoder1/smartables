import { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { normalizePhoneNumber } from "@/lib/utils";

// ── Helpers ──

async function handleBookingCancellation(
  supabase: SupabaseClient,
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

async function upsertCustomerAndGetThread(
  supabase: SupabaseClient,
  organizationId: string,
  locationId: string,
  from: string,
  customerName?: string,
) {
  let { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("location_id", locationId)
    .eq("phone_number", from)
    .maybeSingle();

  if (!customer) {
    const { data: newCustomer, error } = await supabase
      .from("customers")
      .insert({
        organization_id: organizationId,
        location_id: locationId,
        phone_number: from,
        name: customerName || "Nuovo Cliente",
        total_visits: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("[WhatsApp Webhook] Error creating customer:", error);
      throw error;
    }
    customer = newCustomer;
  } else if (
    customerName &&
    (customer.name === "Nuovo Cliente" || !customer.name) &&
    customerName !== "Nuovo Cliente"
  ) {
    const { data: updatedCustomer } = await supabase
      .from("customers")
      .update({ name: customerName })
      .eq("id", customer.id)
      .select()
      .single();
    if (updatedCustomer) customer = updatedCustomer;
  }

  return customer;
}

async function saveWhatsAppMessage(
  supabase: SupabaseClient,
  organizationId: string,
  locationId: string,
  customerId: string,
  metaMessageId: string | null,
  content: object,
  direction: "inbound" | "outbound_bot" | "outbound_human",
  status: "pending" | "sent" | "delivered" | "read" | "failed" = "delivered",
) {
  const { error } = await supabase.from("whatsapp_messages").insert({
    organization_id: organizationId,
    location_id: locationId,
    customer_id: customerId,
    meta_message_id: metaMessageId,
    content: content,
    direction,
    status,
  });

  if (error) {
    console.error(
      `[WhatsApp Webhook] Failed to save ${direction} message:`,
      error,
    );
  }
}

// ── Message Handlers ──

export async function handleButtonClick(
  supabase: SupabaseClient,
  message: Record<string, unknown>,
  value: Record<string, unknown>,
  phoneNumberId: string,
) {
  const rawFrom = message.from as string;
  const from = normalizePhoneNumber(rawFrom);
  const buttonPayload =
    (message.button as Record<string, string>)?.payload ||
    (message.button as Record<string, string>)?.text ||
    "";
  console.log(
    `[WhatsApp Webhook] 🔘 Button click from ${from}: "${buttonPayload}"`,
  );

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

  const contacts = value.contacts as { profile?: { name?: string } }[] | undefined;
  const customerName = contacts?.[0]?.profile?.name || "";
  const customer = await upsertCustomerAndGetThread(
    supabase,
    location.organization_id,
    location.id,
    from,
    customerName,
  );

  if (customer && message.id) {
    await saveWhatsAppMessage(
      supabase,
      location.organization_id,
      location.id,
      customer.id,
      message.id as string,
      { type: "button", text: buttonPayload },
      "inbound",
    );
  }

  const normalizedPayload = buttonPayload.toLowerCase().trim();

  if (
    normalizedPayload.includes("fornitore") ||
    normalizedPayload === "supplier"
  ) {
    console.log(
      `[WhatsApp Webhook] 📦 Tagging ${from} as supplier for location ${location.id}`,
    );
    if (customer) {
      const currentTags = customer.tags || [];
      if (!currentTags.includes("supplier")) {
        await supabase
          .from("customers")
          .update({ tags: [...currentTags, "supplier"] })
          .eq("id", customer.id);
      }
    }
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
    console.log(
      `[WhatsApp Webhook] 🍽️ Booking request from ${from} — forwarding to chatbot flow`,
    );
    await sendWhatsAppText(
      from,
      `Perfetto! 🍽️ Per quale giorno e a che ora vorresti prenotare? E per quante persone?`,
      phoneNumberId,
    );
  } else if (normalizedPayload.includes("menu")) {
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
    console.log(
      `[WhatsApp Webhook] ❌ Booking Cancellation from ${from} for location ${location.id}`,
    );
    await handleBookingCancellation(supabase, location.id, from, phoneNumberId);
  } else {
    console.log(
      `[WhatsApp Webhook] ❓ Unknown button from ${from}: ${buttonPayload}`,
    );
  }

  return null;
}

export async function handleFlowCompletion(
  supabase: SupabaseClient,
  message: Record<string, unknown>,
  value: Record<string, unknown>,
  phoneNumberId: string,
) {
  const rawFrom = message.from as string;
  const from = normalizePhoneNumber(rawFrom);
  console.log(`[WhatsApp Webhook] ✅ Flow completion from ${from}`);

  const interactiveData = (message as Record<string, unknown>).interactive as Record<string, unknown>;
  const responseJsonStr = (interactiveData.nfm_reply as Record<string, string>).response_json;

  try {
    const payload = JSON.parse(responseJsonStr);

    const { data: location } = await supabase
      .from("locations")
      .select("id, organization_id, name")
      .eq("meta_phone_id", phoneNumberId)
      .single();

    if (!location) return null;

    if (!payload.date || !payload.time) {
      console.error(
        "[WhatsApp Webhook] Missing date or time in flow payload:",
        payload,
      );
      return new NextResponse("EVENT_RECEIVED", { status: 200 });
    }

    const { fromZonedTime } = await import("date-fns-tz");
    const bookingTimeDate = fromZonedTime(
      `${payload.date}T${payload.time}:00`,
      "Europe/Rome",
    );

    if (isNaN(bookingTimeDate.getTime())) {
      console.error(
        "[WhatsApp Webhook] Invalid date/time constructed:",
        `${payload.date}T${payload.time}`,
      );
      return new NextResponse("EVENT_RECEIVED", { status: 200 });
    }

    const bookingDate = bookingTimeDate.toISOString();

    const customer = await upsertCustomerAndGetThread(
      supabase,
      location.organization_id,
      location.id,
      from,
      payload.guest_name,
    );

    if (customer) {
      await saveWhatsAppMessage(
        supabase,
        location.organization_id,
        location.id,
        customer.id,
        (message.id as string) || null,
        {
          type: "text",
          text: `🏁 Prenotazione completata via Flow (${payload.guests} persone, bambini: ${payload.children_count || payload.children || "nessuno"}, ${payload.date} ${payload.time})`,
        },
        "inbound",
      );
    }

    const { error } = await supabase.from("bookings").insert({
      organization_id: location.organization_id,
      location_id: location.id,
      customer_id: customer?.id || null,
      guest_name: payload.guest_name,
      guest_phone: from,
      guests_count: parseInt(payload.guests),
      children_count: payload.children_count || payload.children || null,
      allergies: payload.allergies || null,
      booking_time: bookingDate,
      status: "pending",
      source: "whatsapp_auto",
      notes: payload.extra_notes || payload.notes || "",
    });

    if (error) {
      console.error("Booking creation failed via WhatsApp Webhook", error);
      await sendWhatsAppText(
        from,
        `Ci dispiace, c'è stato un problema nel salvare la prenotazione. Contattaci in chat per confermare il tavolo!`,
        phoneNumberId,
      );
      return null;
    }

    const { data: latestBooking } = await supabase
      .from("bookings")
      .select("id")
      .eq("guest_phone", from)
      .eq("booking_time", bookingDate)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const [year, month, day] = payload.date.split("-");
    let extraText = "";

    const itFormatter = new Intl.DateTimeFormat("it-IT", {
      timeZone: "Europe/Rome",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayStr = itFormatter.format(new Date());
    const targetDateStr = itFormatter.format(new Date(bookingDate));
    const isSameDay = todayStr === targetDateStr;

    if (isSameDay) {
      extraText = `\n\n💡 Se hai un imprevisto dell'ultimo minuto, scrivici "Annulla" in questa chat.`;
    } else if (latestBooking) {
      try {
        const { tasks } = await import("@trigger.dev/sdk/v3");
        const { verifyBooking } = await import("@/trigger/verify-booking");
        await tasks.trigger<typeof verifyBooking>("verify-booking", {
          bookingId: latestBooking.id,
          locationId: location.id,
          customerId: customer?.id,
          guestName: payload.guest_name,
          guestPhone: from,
          bookingTime: bookingDate,
        });
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

    if (latestBooking) {
      try {
        const { tasks } = await import("@trigger.dev/sdk/v3");
        const { requestReview } = await import("@/trigger/request-review");
        await tasks.trigger<typeof requestReview>("request-review", {
          bookingId: latestBooking.id,
          locationId: location.id,
          guestPhone: from,
          bookingTime: bookingDate,
        });
        console.log(
          `[WhatsApp Webhook] Review request task dispatched for ${latestBooking.id}`,
        );
      } catch (e) {
        console.warn(
          `[WhatsApp Webhook] Failed to dispatch review request task:`,
          e,
        );
      }
    }

    await sendWhatsAppText(
      from,
      `✅ Perfetto! La tua prenotazione per *${payload.guests} persone* a nome di *${payload.guest_name}* per il *${day}/${month} alle ${payload.time}* è stata registrata! Ti aspettiamo presso ${location.name}.${extraText}`,
      phoneNumberId,
    );
  } catch (e) {
    console.error("Error parsing flow response", e);
  }

  return null;
}

export async function handleTextMessage(
  supabase: SupabaseClient,
  message: Record<string, unknown>,
  value: Record<string, unknown>,
  phoneNumberId: string,
) {
  const rawFrom = message.from as string;
  const from = normalizePhoneNumber(rawFrom);
  const textBody =
    (message.text as { body?: string })?.body?.toLowerCase().trim() || "";
  const originalText = (message.text as { body?: string })?.body || "";
  console.log(`[WhatsApp Webhook] 💬 Text from ${from}: ${textBody}`);

  const { data: location } = await supabase
    .from("locations")
    .select("id, organization_id")
    .eq("meta_phone_id", phoneNumberId)
    .single();

  if (!location) return new NextResponse("EVENT_RECEIVED", { status: 200 });

  const contacts = value.contacts as { profile?: { name?: string } }[] | undefined;
  const customerName = contacts?.[0]?.profile?.name || "";
  const customer = await upsertCustomerAndGetThread(
    supabase,
    location.organization_id,
    location.id,
    from,
    customerName,
  );

  if (customer && message.id) {
    await saveWhatsAppMessage(
      supabase,
      location.organization_id,
      location.id,
      customer.id,
      message.id as string,
      { type: "text", text: originalText },
      "inbound",
    );
  }

  if (textBody.includes("annulla")) {
    await handleBookingCancellation(
      supabase,
      location.id,
      from,
      phoneNumberId,
    );
    return new NextResponse("EVENT_RECEIVED", { status: 200 });
  }

  const now = new Date();
  const isBotPaused =
    customer?.bot_paused_until && new Date(customer.bot_paused_until) > now;

  if (isBotPaused) {
    console.log(
      `[WhatsApp Webhook] ⏸️ Bot paused for ${from}. Ignoring message.`,
    );
    return new NextResponse("EVENT_RECEIVED", { status: 200 });
  }

  if (customer) {
    try {
      const { tasks } = await import("@trigger.dev/sdk/v3");
      const { replyToMessage } = await import("@/trigger/reply-to-message");
      await tasks.trigger<typeof replyToMessage>("reply-to-message", {
        organizationId: location.organization_id,
        locationId: location.id,
        customerId: customer.id,
        customerPhone: from,
        customerName: customerName,
        metaPhoneId: phoneNumberId,
      });
      console.log(
        `[WhatsApp Webhook] Trigger.dev AI reply task dispatched for ${from}`,
      );
    } catch (e) {
      console.error(
        `[WhatsApp Webhook] Failed to dispatch AI reply task:`,
        e,
      );
    }
  }

  return null;
}
