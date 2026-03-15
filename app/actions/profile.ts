"use server";

import { requireAuth } from "@/lib/supabase-helpers";

export async function getUserRole(): Promise<string | null> {
  const auth = await requireAuth();
  if (!auth.success) return null;

  const { supabase, user } = auth;
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return data?.role ?? null;
}
