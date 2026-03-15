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

  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('organization_id', profile?.organization_id)
    .order('created_at')

  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profile?.organization_id)
    .single()

  if (!profile || !profile.organization_id) {
    throw new Error("No organization found");
  }

  return {
    supabase,
    locations,
    organization,
    user,
    organizationId: profile.organization_id,
  };
}
