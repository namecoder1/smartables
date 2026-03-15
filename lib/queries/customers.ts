/**
 * Query centralizzate per la tabella `customers`.
 *
 * Importare queste funzioni invece di scrivere query `.from("customers")` inline.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Customer } from "@/types/general";

// ─── Read ────────────────────────────────────────────────────────────────────

/**
 * Cerca un customer per numero di telefono all'interno di un'organizzazione.
 * Usato per evitare duplicati al momento della creazione (upsert).
 */
export async function getCustomerByPhone(
  supabase: SupabaseClient,
  organizationId: string,
  phone: string,
): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("phone_number", phone)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[getCustomerByPhone]", error.message, { organizationId, phone });
    }
    return null;
  }
  return data as Customer;
}

/**
 * Restituisce un singolo customer per ID.
 */
export async function getCustomerById(
  supabase: SupabaseClient,
  id: string,
): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[getCustomerById]", error.message, { id });
    }
    return null;
  }
  return data as Customer;
}

/**
 * Cerca customers per nome (ILIKE) all'interno di un'organizzazione.
 * Usato nella combobox di ricerca customer nelle form di prenotazione.
 */
export async function searchCustomersByName(
  supabase: SupabaseClient,
  organizationId: string,
  query: string,
  limit = 10,
): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("organization_id", organizationId)
    .ilike("name", `%${query}%`)
    .limit(limit);

  if (error) {
    console.error("[searchCustomersByName]", error.message, { organizationId, query });
    return [];
  }
  return (data as Customer[]) ?? [];
}

/**
 * Restituisce tutti i customers di un'organizzazione, ordinati per nome.
 */
export async function getCustomersByOrg(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  if (error) {
    console.error("[getCustomersByOrg]", error.message, { organizationId });
    return [];
  }
  return (data as Customer[]) ?? [];
}

/**
 * Restituisce i customers con l'ultimo messaggio WhatsApp, per la inbox.
 * Ordinati per data del messaggio più recente (desc).
 */
export async function getInboxCustomers(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<(Customer & { whatsapp_messages: { created_at: string; content: unknown; direction: string; status: string }[] })[]> {
  const { data, error } = await supabase
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
    console.error("[getInboxCustomers]", error.message, { organizationId });
    return [];
  }
  return (data ?? []) as (Customer & { whatsapp_messages: { created_at: string; content: unknown; direction: string; status: string }[] })[];
}

/**
 * Conta i customers di un'organizzazione.
 * Usato dal limiter per verificare il cap di contatti WhatsApp.
 */
export async function countCustomersByOrg(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error) {
    console.error("[countCustomersByOrg]", error.message, { organizationId });
    return 0;
  }
  return count ?? 0;
}
