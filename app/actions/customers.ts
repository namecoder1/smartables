"use server";

import { requireAuth } from "@/lib/supabase-helpers";
import { okWith, ok, fail } from "@/lib/action-response";
import { getStr, getInt, getNullableStr } from "@/lib/form-parsers";
import { revalidatePath } from "next/cache";
import { PATHS } from "@/lib/revalidation-paths";
import { captureCritical, captureWarning } from "@/lib/monitoring";

export async function searchCustomers(query: string) {
  const auth = await requireAuth();
  if (!auth.success) return [];
  const { supabase, organizationId } = auth;

  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .eq("organization_id", organizationId)
    .ilike("name", `%${query}%`)
    .limit(10);

  if (error) {
    console.error("[searchCustomers]", error.message);
    return [];
  }

  return customers;
}

export async function createCustomer(locationId: string, formData: FormData) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase, organizationId } = auth;

  const name = getStr(formData, "name");
  const phone_number = getStr(formData, "phone_number");
  const totalVisitsRaw = getNullableStr(formData, "total_visits");
  const total_visits = totalVisitsRaw ? getInt(formData, "total_visits") : undefined;

  const { data, error } = await supabase
    .from("customers")
    .insert({
      organization_id: organizationId,
      location_id: locationId,
      name,
      phone_number,
      ...(total_visits !== undefined && { total_visits }),
    })
    .select()
    .single();

  if (error) {
    console.error("[createCustomer]", error.message);
    return fail("Failed to create customer");
  }

  revalidatePath(PATHS.CLIENTS);
  return okWith(data);
}

export async function updateCustomer(customerId: string, formData: FormData) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase, organizationId } = auth;

  const name = getStr(formData, "name");
  const phone_number = getStr(formData, "phone_number");
  const totalVisitsRaw = getNullableStr(formData, "total_visits");
  const total_visits = totalVisitsRaw ? getInt(formData, "total_visits") : undefined;

  const { data, error } = await supabase
    .from("customers")
    .update({
      name,
      phone_number,
      ...(total_visits !== undefined && { total_visits }),
    })
    .eq("id", customerId)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error) {
    console.error("[updateCustomer]", error.message);
    return fail("Failed to update customer");
  }

  revalidatePath(PATHS.CLIENTS);
  return okWith(data);
}

export async function deleteCustomers(ids: string[]) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase, user, organizationId } = auth;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "owner") {
    return fail("Solo gli amministratori possono eliminare i clienti");
  }

  // ── GDPR-compliant deletion ───────────────────────────────────────────────
  //
  // We cannot simply delete the customer row because:
  //   1. bookings.customer_id FK has no ON DELETE CASCADE → delete would fail
  //      if the customer has any bookings.
  //   2. bookings retain business value for the restaurant (revenue, analytics)
  //      so we anonymize rather than delete them.
  //   3. whatsapp_messages.customer_id FK *does* have ON DELETE CASCADE, so
  //      those are wiped automatically when the customer row is deleted.
  //   4. callback_requests stores phone_number directly (no customer FK) →
  //      must be deleted separately by phone number.
  //
  // Deletion order:
  //   Step 1 — fetch phone numbers of customers being deleted (needed for step 3)
  //   Step 2 — anonymize bookings: null out PII fields, unlink customer_id
  //   Step 3 — delete callback_requests by phone number
  //   Step 4 — delete customer rows (auto-cascades whatsapp_messages)

  // Step 1: fetch phone numbers before deletion
  const { data: customers, error: fetchErr } = await supabase
    .from("customers")
    .select("id, phone_number")
    .in("id", ids)
    .eq("organization_id", organizationId);

  if (fetchErr) {
    captureCritical(fetchErr, { service: "supabase", flow: "gdpr_customer_delete_fetch", organizationId });
    return fail("Impossibile recuperare i dati dei clienti");
  }

  const phoneNumbers = (customers ?? [])
    .map((c) => c.phone_number)
    .filter(Boolean) as string[];

  // Step 2: anonymize bookings — preserve record for business analytics, remove PII
  const { error: bookingsErr } = await supabase
    .from("bookings")
    .update({
      guest_name: "Cliente eliminato",
      guest_phone: null,
      customer_id: null,
    })
    .in("customer_id", ids)
    .eq("organization_id", organizationId);

  if (bookingsErr) {
    captureCritical(bookingsErr, { service: "supabase", flow: "gdpr_customer_delete_anonymize_bookings", organizationId });
    return fail("Impossibile anonimizzare le prenotazioni del cliente");
  }

  // Step 3: delete callback_requests by phone number (no customer FK)
  if (phoneNumbers.length > 0) {
    const { error: cbErr } = await supabase
      .from("callback_requests")
      .delete()
      .in("phone_number", phoneNumbers);

    if (cbErr) {
      // Non-blocking: log and continue — callback_requests are low-stakes
      captureWarning("Failed to delete callback_requests during GDPR customer delete", {
        service: "supabase",
        flow: "gdpr_customer_delete_callback_requests",
        organizationId,
      });
    }
  }

  // Step 4: delete customer rows (cascades to whatsapp_messages automatically)
  const { error } = await supabase
    .from("customers")
    .delete()
    .in("id", ids)
    .eq("organization_id", organizationId);

  if (error) {
    captureCritical(error, { service: "supabase", flow: "gdpr_customer_delete", organizationId });
    return fail(error.message);
  }

  revalidatePath(PATHS.CLIENTS);
  return ok("Clienti eliminati con successo");
}

export async function getAllCustomers() {
  const auth = await requireAuth();
  if (!auth.success) return [];
  const { supabase, organizationId } = auth;

  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  if (error) {
    console.error("[getAllCustomers]", error.message);
    return [];
  }

  return customers;
}
