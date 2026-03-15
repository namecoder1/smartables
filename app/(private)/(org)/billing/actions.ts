"use server";

import { requireAuth } from "@/lib/supabase-helpers";
import { okWith, fail } from "@/lib/action-response";

export async function checkSubscriptionStatus() {
  const auth = await requireAuth();
  if (!auth.success) return fail("Non autorizzato");
  const { supabase, organizationId } = auth;

  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_price_id, stripe_status")
    .eq("id", organizationId)
    .single();

  return okWith({
    priceId: org?.stripe_price_id,
    status: org?.stripe_status,
  });
}
