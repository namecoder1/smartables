"use server";

import { requireAuth } from "@/lib/supabase-helpers";
import { okWith, ok, fail } from "@/lib/action-response";
import { getStr, getInt, getNullableStr } from "@/lib/form-parsers";
import { revalidatePath } from "next/cache";
import { PATHS } from "@/lib/revalidation-paths";

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

  const { error } = await supabase
    .from("customers")
    .delete()
    .in("id", ids)
    .eq("organization_id", organizationId);

  if (error) return fail(error.message);

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
