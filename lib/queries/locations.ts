/**
 * Query centralizzate per la tabella `locations`.
 *
 * Importare queste funzioni invece di scrivere query `.from("locations")` inline.
 * La `Location` è l'entità più usata del sistema — tutti i webhook e le actions
 * caricano la location per ottenere config, numeri Telnyx, meta_phone_id, ecc.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Location } from "@/types/general";

// ─── Read ────────────────────────────────────────────────────────────────────

/**
 * Restituisce una singola location per ID.
 * La query più usata nel sistema — webhook, actions, trigger task.
 */
export async function getLocationById(
  supabase: SupabaseClient,
  id: string,
): Promise<Location | null> {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[getLocationById]", error.message, { id });
    }
    return null;
  }
  return data as Location;
}

/**
 * Restituisce tutte le location di un'organizzazione, ordinate per data di creazione.
 */
export async function getLocationsByOrg(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<Location[]> {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at");

  if (error) {
    console.error("[getLocationsByOrg]", error.message, { organizationId });
    return [];
  }
  return (data as Location[]) ?? [];
}

/**
 * Restituisce una location per slug pubblico.
 * Usato nelle pagine pubbliche `/p/[locationSlug]` e `/m/[locationSlug]`.
 */
export async function getLocationBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<Location | null> {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[getLocationBySlug]", error.message, { slug });
    }
    return null;
  }
  return data as Location;
}

/**
 * Restituisce la location associata a un numero di telefono Telnyx.
 * Usato nel webhook Telnyx per risolvere la location dalla chiamata in entrata.
 */
export async function getLocationByTelnyxNumber(
  supabase: SupabaseClient,
  phoneNumber: string,
): Promise<Location | null> {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("telnyx_phone_number", phoneNumber)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[getLocationByTelnyxNumber]", error.message, { phoneNumber });
    }
    return null;
  }
  return data as Location;
}

/**
 * Restituisce la location associata a un `meta_phone_id` WhatsApp.
 * Usato nel webhook WhatsApp per risolvere la location dal messaggio in entrata.
 */
export async function getLocationByMetaPhoneId(
  supabase: SupabaseClient,
  metaPhoneId: string,
): Promise<Location | null> {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("meta_phone_id", metaPhoneId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[getLocationByMetaPhoneId]", error.message, { metaPhoneId });
    }
    return null;
  }
  return data as Location;
}

/**
 * Conta le location di un'organizzazione.
 * Usato dal limiter per verificare il cap sedi.
 */
export async function countLocationsByOrg(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("locations")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error) {
    console.error("[countLocationsByOrg]", error.message, { organizationId });
    return 0;
  }
  return count ?? 0;
}
