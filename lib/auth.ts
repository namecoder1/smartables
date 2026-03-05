"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Centralized auth + organization context for all server actions.
 * Replaces the repetitive auth + profile + org lookup pattern.
 */
export async function getAuthContext() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.organization_id) {
    throw new Error("No organization found");
  }

  return {
    supabase,
    user,
    organizationId: profile.organization_id,
  };
}
