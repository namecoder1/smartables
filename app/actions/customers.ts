"use server";

import { getAuthContext } from "@/lib/auth";

export async function searchCustomers(query: string) {
  try {
    const { supabase, organizationId } = await getAuthContext();

    const { data: customers, error } = await supabase
      .from("customers")
      .select("*")
      .eq("organization_id", organizationId)
      .ilike("name", `%${query}%`)
      .limit(10);

    if (error) {
      console.error("Error searching customers:", error);
      return [];
    }

    return customers;
  } catch {
    return [];
  }
}

export async function getAllCustomers() {
  try {
    const { supabase, organizationId } = await getAuthContext();

    const { data: customers, error } = await supabase
      .from("customers")
      .select("*")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching all customers:", error);
      return [];
    }

    return customers;
  } catch {
    return [];
  }
}
