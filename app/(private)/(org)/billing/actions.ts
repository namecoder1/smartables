"use server";

import { createClient } from "@/utils/supabase/server";

export async function checkSubscriptionStatus() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    throw new Error("No organization found");
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_price_id, stripe_status")
    .eq("id", profile.organization_id)
    .single();

  return {
    priceId: org?.stripe_price_id,
    status: org?.stripe_status,
  };
}
