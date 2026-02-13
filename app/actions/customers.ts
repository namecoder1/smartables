"use server";

import { createClient } from "@/utils/supabase/server";

export async function searchCustomers(query: string) {
  const supabase = await createClient();

  // Get current user and organization
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.organization_id) return [];

  // Search customers by name (case insensitive)
  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .ilike("name", `%${query}%`)
    .limit(10);

  if (error) {
    console.error("Error searching customers:", error);
    return [];
  }

  return customers;
}
