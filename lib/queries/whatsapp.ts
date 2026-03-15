/**
 * Query centralizzate per la tabella `whatsapp_messages`.
 *
 * Importare queste funzioni invece di scrivere query `.from("whatsapp_messages")` inline.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type WhatsAppMessage = {
  id: string;
  organization_id: string;
  location_id: string;
  customer_id: string;
  meta_message_id: string | null;
  content: Record<string, unknown>;
  direction: "inbound" | "outbound_auto" | "outbound_human";
  status: string;
  created_at: string;
};

// ─── Read ────────────────────────────────────────────────────────────────────

/**
 * Restituisce tutti i messaggi di un customer, ordinati cronologicamente.
 * Usato nella inbox per mostrare il thread di conversazione.
 */
export async function getMessagesByCustomer(
  supabase: SupabaseClient,
  customerId: string,
): Promise<WhatsAppMessage[]> {
  const { data, error } = await supabase
    .from("whatsapp_messages")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getMessagesByCustomer]", error.message, { customerId });
    return [];
  }
  return (data as WhatsAppMessage[]) ?? [];
}

/**
 * Restituisce l'ultimo messaggio inbound di un customer.
 * Usato per ricavare la location_id quando si risponde manualmente.
 */
export async function getLastInboundMessage(
  supabase: SupabaseClient,
  customerId: string,
): Promise<WhatsAppMessage | null> {
  const { data, error } = await supabase
    .from("whatsapp_messages")
    .select("*")
    .eq("customer_id", customerId)
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[getLastInboundMessage]", error.message, { customerId });
    }
    return null;
  }
  return data as WhatsAppMessage;
}

/**
 * Restituisce l'ultimo messaggio inviato a un numero di telefono da una location.
 * Usato per il controllo anti-spam (finestra 24h).
 */
export async function getLastMessageToPhone(
  supabase: SupabaseClient,
  locationId: string,
  phoneNumber: string,
): Promise<WhatsAppMessage | null> {
  const { data, error } = await supabase
    .from("whatsapp_messages")
    .select("id, created_at, direction")
    .eq("location_id", locationId)
    .eq("direction", "outbound_auto")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[getLastMessageToPhone]", error.message, { locationId, phoneNumber });
    }
    return null;
  }
  return data as WhatsAppMessage;
}

/**
 * Conta i messaggi inviati da una location nell'ultimo ciclo di fatturazione.
 * Usato per il controllo del cap mensile WhatsApp.
 */
export async function countOutboundMessagesByLocation(
  supabase: SupabaseClient,
  locationId: string,
  from: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("whatsapp_messages")
    .select("id", { count: "exact", head: true })
    .eq("location_id", locationId)
    .in("direction", ["outbound_auto", "outbound_human"])
    .gte("created_at", from);

  if (error) {
    console.error("[countOutboundMessagesByLocation]", error.message, { locationId });
    return 0;
  }
  return count ?? 0;
}
