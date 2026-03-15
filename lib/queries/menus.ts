/**
 * Query centralizzate per le tabelle `menus` e `menu_locations`.
 *
 * Importare queste funzioni invece di scrivere query `.from("menus")` inline.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Menu, MenuLocation } from "@/types/general";

// ─── Read ────────────────────────────────────────────────────────────────────

/**
 * Restituisce tutti i menu di un'organizzazione.
 */
export async function getMenusByOrg(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<Menu[]> {
  const { data, error } = await supabase
    .from("menus")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getMenusByOrg]", error.message, { organizationId });
    return [];
  }
  return (data as Menu[]) ?? [];
}

/**
 * Restituisce un singolo menu per ID.
 */
export async function getMenuById(
  supabase: SupabaseClient,
  id: string,
): Promise<Menu | null> {
  const { data, error } = await supabase
    .from("menus")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[getMenuById]", error.message, { id });
    }
    return null;
  }
  return data as Menu;
}

/**
 * Restituisce i menu assegnati a una location specifica (via menu_locations).
 * Include i dati di configurazione giornaliera (daily_from, daily_until).
 */
export async function getMenusByLocation(
  supabase: SupabaseClient,
  locationId: string,
): Promise<(Menu & { menu_locations: MenuLocation[] })[]> {
  const { data, error } = await supabase
    .from("menus")
    .select(
      `
      *,
      menu_locations:menu_locations!inner(
        menu_id, location_id, is_active, daily_from, daily_until
      )
    `,
    )
    .eq("menu_locations.location_id", locationId);

  if (error) {
    console.error("[getMenusByLocation]", error.message, { locationId });
    return [];
  }
  return (data ?? []) as (Menu & { menu_locations: MenuLocation[] })[];
}

/**
 * Restituisce tutte le assegnazioni menu-location per un'organizzazione.
 * Usato nel settings dei menu per mostrare quale menu è attivo dove.
 */
export async function getMenuLocationsByOrg(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<MenuLocation[]> {
  // Prima prendo gli ID dei menu dell'org, poi le assegnazioni
  const { data: menus, error: menusError } = await supabase
    .from("menus")
    .select("id")
    .eq("organization_id", organizationId);

  if (menusError || !menus || menus.length === 0) return [];

  const menuIds = menus.map((m) => m.id);

  const { data, error } = await supabase
    .from("menu_locations")
    .select("*")
    .in("menu_id", menuIds);

  if (error) {
    console.error("[getMenuLocationsByOrg]", error.message, { organizationId });
    return [];
  }
  return (data as MenuLocation[]) ?? [];
}

/**
 * Conta i menu di un'organizzazione.
 * Usato dal limiter per verificare il cap menu digitali.
 */
export async function countMenusByOrg(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("menus")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error) {
    console.error("[countMenusByOrg]", error.message, { organizationId });
    return 0;
  }
  return count ?? 0;
}
