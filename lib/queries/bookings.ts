/**
 * Query centralizzate per la tabella `bookings`.
 *
 * Tutte le funzioni ricevono un `SupabaseClient` già autenticato e restituiscono
 * dati tipizzati. Non contengono logica di business — solo accesso al DB.
 *
 * Importare queste funzioni dalle Server Actions e dagli RSC invece di
 * scrivere query `.from("bookings")` inline.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Booking } from "@/types/general";

export interface BookingFilters {
  status?: Booking["status"];
  from?: string;   // ISO datetime string
  to?: string;     // ISO datetime string
  tableId?: string;
}

// ─── Read ────────────────────────────────────────────────────────────────────

/**
 * Restituisce tutte le prenotazioni di una location, con filtri opzionali.
 * Ordinate per `booking_time` ascendente.
 */
export async function getBookingsByLocation(
  supabase: SupabaseClient,
  locationId: string,
  filters: BookingFilters = {},
): Promise<Booking[]> {
  let query = supabase
    .from("bookings")
    .select("*")
    .eq("location_id", locationId)
    .order("booking_time", { ascending: true });

  if (filters.status)  query = query.eq("status", filters.status);
  if (filters.from)    query = query.gte("booking_time", filters.from);
  if (filters.to)      query = query.lte("booking_time", filters.to);
  if (filters.tableId) query = query.eq("table_id", filters.tableId);

  const { data, error } = await query;
  if (error) {
    console.error("[getBookingsByLocation]", error.message, { locationId });
    return [];
  }
  return (data as Booking[]) ?? [];
}

/**
 * Restituisce una singola prenotazione per ID.
 */
export async function getBookingById(
  supabase: SupabaseClient,
  id: string,
): Promise<Booking | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[getBookingById]", error.message, { id });
    }
    return null;
  }
  return data as Booking;
}

/**
 * Restituisce le prenotazioni recenti di un'organizzazione.
 * Usato nella home dashboard e nelle notifiche.
 */
export async function getRecentBookingsByOrg(
  supabase: SupabaseClient,
  organizationId: string,
  limit = 20,
): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getRecentBookingsByOrg]", error.message, { organizationId });
    return [];
  }
  return (data as Booking[]) ?? [];
}

/**
 * Conta le prenotazioni di una location in un intervallo di tempo.
 * Usato dal limiter per controllare il cap mensile.
 */
export async function countBookingsByLocation(
  supabase: SupabaseClient,
  locationId: string,
  from: string,
  to: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("location_id", locationId)
    .gte("booking_time", from)
    .lte("booking_time", to);

  if (error) {
    console.error("[countBookingsByLocation]", error.message, { locationId });
    return 0;
  }
  return count ?? 0;
}

/**
 * Restituisce le prenotazioni di un tavolo specifico in una finestra temporale.
 * Usato per verificare conflitti prima dell'assegnazione.
 */
export async function getBookingsForTable(
  supabase: SupabaseClient,
  tableId: string,
  from: string,
  to: string,
): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("table_id", tableId)
    .gte("booking_time", from)
    .lte("booking_time", to)
    .neq("status", "cancelled");

  if (error) {
    console.error("[getBookingsForTable]", error.message, { tableId });
    return [];
  }
  return (data as Booking[]) ?? [];
}
