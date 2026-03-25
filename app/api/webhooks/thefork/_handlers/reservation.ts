import { SupabaseClient } from "@supabase/supabase-js";

// ── TheFork POS API — payload types ──────────────────────────────────────────

type TheForkMealStatus = "RECORDED" | "CANCELED" | "NO_SHOW" | "LEFT";

type TheForkCustomer = {
  id?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  allergies?: string[];
  dietaryRestrictions?: string[];
  seatingPreferences?: string[];
};

type TheForkReservationPayload = {
  mealUuid: string;          // TheFork reservation UUID → external_id
  mealStatus: TheForkMealStatus;
  mealDate: string;          // ISO datetime
  covers: number;
  customer?: TheForkCustomer;
  table?: {
    name?: string;
    area?: string;
  };
  loyaltyDiscount?: unknown;
  prepayment?: unknown;
};

// ── Status mapping ────────────────────────────────────────────────────────────

const THEFORK_STATUS_MAP: Record<TheForkMealStatus, string> = {
  RECORDED: "arrived",    // Customer arrived, meal started
  NO_SHOW:  "no_show",
  CANCELED: "cancelled",
  LEFT:     "arrived",    // Meal complete — keep as arrived (no 'completed' status)
};

// ── Handler ───────────────────────────────────────────────────────────────────

export async function handleTheForkReservation(
  supabase: SupabaseClient,
  locationId: string,
  organizationId: string,
  payload: TheForkReservationPayload,
) {
  const { mealUuid, mealStatus, mealDate, covers, customer, table } = payload;
  const newStatus = THEFORK_STATUS_MAP[mealStatus];

  // 1. Find existing booking by external_id (idempotent)
  const { data: existingBooking } = await supabase
    .from("bookings")
    .select("id, customer_id, status")
    .eq("location_id", locationId)
    .eq("external_id", mealUuid)
    .maybeSingle();

  if (existingBooking) {
    // Update status if changed
    if (existingBooking.status !== newStatus) {
      await supabase
        .from("bookings")
        .update({ status: newStatus, sync_status: "synced" })
        .eq("id", existingBooking.id);
    }

    // Enrich customer profile if we have new data
    if (existingBooking.customer_id && customer) {
      await enrichCustomer(supabase, existingBooking.customer_id, customer);
    }
    return;
  }

  // 2. No existing booking — upsert customer then create booking
  let customerId: string | null = null;

  if (customer) {
    customerId = await upsertCustomer(supabase, organizationId, locationId, customer);
  }

  const guestName = [customer?.firstName, customer?.lastName].filter(Boolean).join(" ") || "Ospite TheFork";
  const guestPhone = customer?.phone ?? "";

  const notes = buildNotes(table, payload);

  await supabase.from("bookings").insert({
    organization_id: organizationId,
    location_id: locationId,
    customer_id: customerId,
    guest_name: guestName,
    guest_phone: guestPhone,
    guests_count: covers,
    booking_time: mealDate,
    status: newStatus,
    source: "thefork",
    external_id: mealUuid,
    sync_status: "synced",
    allergies: customer?.allergies?.join(", ") || null,
    notes,
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function upsertCustomer(
  supabase: SupabaseClient,
  organizationId: string,
  locationId: string,
  customer: TheForkCustomer,
): Promise<string | null> {
  const phone = customer.phone ?? "";
  const email = customer.email ?? null;
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || null;

  // Try match by phone first, then by email
  let existing = null;

  if (phone) {
    const { data } = await supabase
      .from("customers")
      .select("id, metadata")
      .eq("organization_id", organizationId)
      .eq("phone_number", phone)
      .maybeSingle();
    existing = data;
  }

  if (!existing && email) {
    const { data } = await supabase
      .from("customers")
      .select("id, metadata")
      .eq("organization_id", organizationId)
      .eq("email", email)
      .maybeSingle();
    existing = data;
  }

  if (existing) {
    await enrichCustomer(supabase, existing.id, customer);
    return existing.id;
  }

  // Create new customer
  const metadata = buildMetadata(customer);
  const { data: newCustomer } = await supabase
    .from("customers")
    .insert({
      organization_id: organizationId,
      location_id: locationId,
      phone_number: phone || `thefork-${customer.id ?? Date.now()}`,
      name: name ?? "Ospite TheFork",
      email,
      total_visits: 1,
      last_visit: new Date().toISOString(),
      metadata,
    })
    .select("id")
    .single();

  return newCustomer?.id ?? null;
}

async function enrichCustomer(
  supabase: SupabaseClient,
  customerId: string,
  customer: TheForkCustomer,
) {
  const { data: current } = await supabase
    .from("customers")
    .select("metadata, email, name")
    .eq("id", customerId)
    .single();

  if (!current) return;

  const updatedMetadata = {
    ...(current.metadata ?? {}),
    ...buildMetadata(customer),
  };

  const updates: Record<string, unknown> = { metadata: updatedMetadata };

  // Fill email if missing
  if (!current.email && customer.email) updates.email = customer.email;
  // Fill name if missing
  if (!current.name && (customer.firstName || customer.lastName)) {
    updates.name = [customer.firstName, customer.lastName].filter(Boolean).join(" ");
  }

  await supabase.from("customers").update(updates).eq("id", customerId);
}

function buildMetadata(customer: TheForkCustomer): Record<string, unknown> {
  const meta: Record<string, unknown> = {};
  if (customer.id) meta.thefork_id = customer.id;
  if (customer.dietaryRestrictions?.length) meta.dietary_preferences = customer.dietaryRestrictions;
  if (customer.seatingPreferences?.length) meta.seating_preferences = customer.seatingPreferences;
  return meta;
}

function buildNotes(
  table: TheForkReservationPayload["table"],
  payload: TheForkReservationPayload,
): string | null {
  const parts: string[] = [];
  if (table?.name) parts.push(`Tavolo TheFork: ${table.name}${table.area ? ` (${table.area})` : ""}`);
  if (payload.loyaltyDiscount) parts.push("Sconto loyalty applicato");
  if (payload.prepayment) parts.push("Prepagato");
  return parts.length > 0 ? parts.join(" · ") : null;
}
