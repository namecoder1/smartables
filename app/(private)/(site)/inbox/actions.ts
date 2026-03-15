"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/supabase-helpers";

/**
 * Fetch the list of customers that have interacted via WhatsApp,
 * ordered by the most recent message.
 */
export async function getInboxCustomers(organizationId: string) {
  const supabase = await createClient();

  // We want to fetch customers that belong to the organization
  // and join the latest message to order them, but a simpler query
  // in Supabase is fetching customers directly.
  // Then we can get the latest message for ordering.

  const { data: customers, error } = await supabase
    .from("customers")
    .select(
      `
      *,
      whatsapp_messages:whatsapp_messages(created_at, content, direction, status)
    `,
    )
    .eq("organization_id", organizationId)
    .order("created_at", {
      referencedTable: "whatsapp_messages",
      ascending: false,
    })
    .limit(1, { referencedTable: "whatsapp_messages" });

  if (error) {
    console.error("Error fetching inbox customers:", error);
    return { success: false, error: error.message };
  }

  // Calculate standard format for the list
  // Calculate standard format for the list
  const formattedCustomers = customers
    .map((c: any) => {
      const latestMessage =
        c.whatsapp_messages && c.whatsapp_messages.length > 0
          ? c.whatsapp_messages[0]
          : null;
      return {
        ...c,
        latestMessage,
      };
    })
    .filter((c: any) => c.latestMessage) // Only show customers that have a message
    .sort((a: any, b: any) => {
      const dateA = new Date(a.latestMessage?.created_at || 0).getTime();
      const dateB = new Date(b.latestMessage?.created_at || 0).getTime();
      return dateB - dateA;
    });

  return { success: true, data: formattedCustomers };
}

/**
 * Fetch all the messages for a specific customer thread.
 */
export async function getCustomerMessages(customerId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("whatsapp_messages")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(`Error fetching messages for customer ${customerId}:`, error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * Sends a manual WhatsApp message from the inbox (outbound_human).
 * Requires the bot to be paused for the customer first.
 */
export async function sendHumanMessage(customerId: string, text: string) {
  const auth = await requireAuth();
  if (!auth.success) return { success: false, error: "Unauthorized" };
  const { supabase } = auth;

  // Get customer phone and org
  const { data: customer } = await supabase
    .from("customers")
    .select("phone_number, organization_id")
    .eq("id", customerId)
    .single();

  if (!customer) return { success: false, error: "Customer not found" };

  // Get the location from the most recent inbound message
  const { data: lastInbound } = await supabase
    .from("whatsapp_messages")
    .select("location_id")
    .eq("customer_id", customerId)
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!lastInbound?.location_id) {
    return { success: false, error: "Nessuna location trovata per questo cliente" };
  }

  // Get meta_phone_id for that location
  const { data: location } = await supabase
    .from("locations")
    .select("meta_phone_id")
    .eq("id", lastInbound.location_id)
    .single();

  if (!location?.meta_phone_id) {
    return { success: false, error: "Location non configurata con numero WhatsApp" };
  }

  // Send via Meta API
  const { sendWhatsAppText } = await import("@/lib/whatsapp");
  let messageId: string | null = null;
  try {
    const waResponse = await sendWhatsAppText(
      customer.phone_number,
      text,
      location.meta_phone_id,
    );
    messageId = waResponse?.messages?.[0]?.id || null;
  } catch (err) {
    console.error("[sendHumanMessage] WhatsApp send failed:", err);
    return { success: false, error: "Invio WhatsApp fallito" };
  }

  // Save to DB
  const { error: dbError } = await supabase.from("whatsapp_messages").insert({
    organization_id: customer.organization_id,
    location_id: lastInbound.location_id,
    customer_id: customerId,
    meta_message_id: messageId,
    content: { type: "text", text },
    direction: "outbound_human",
    status: "sent",
  });

  if (dbError) {
    console.error("[sendHumanMessage] DB insert failed:", dbError);
    return { success: false, error: "Messaggio inviato ma errore nel salvataggio" };
  }

  return { success: true };
}

/**
 * Toggles the bot handoff status (paused vs active) for a customer.
 */
export async function setCustomerBotHandoff(
  customerId: string,
  pauseHours: number = 24,
) {
  const supabase = await createClient();

  // Calculate timestamp or null to reactivate
  const pausedUntil =
    pauseHours > 0
      ? new Date(Date.now() + pauseHours * 60 * 60 * 1000).toISOString()
      : null;

  const { error } = await supabase
    .from("customers")
    .update({ bot_paused_until: pausedUntil })
    .eq("id", customerId);

  if (error) {
    console.error(`Error pausing bot for customer ${customerId}:`, error);
    return { success: false, error: error.message };
  }

  return { success: true, pausedUntil };
}
