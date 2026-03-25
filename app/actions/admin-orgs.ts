"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { ok, fail } from "@/lib/action-response";
import { revalidatePath } from "next/cache";

export async function adminResetWhatsappUsage(orgId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("organizations")
    .update({ whatsapp_usage_count: 0 })
    .eq("id", orgId);
  if (error) return fail(error.message);
  revalidatePath("/organizations");
  revalidatePath(`/organizations/${orgId}`);
  return ok();
}

export async function adminSetBillingTier(
  orgId: string,
  tier: "starter" | "growth" | "business"
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("organizations")
    .update({ billing_tier: tier })
    .eq("id", orgId);
  if (error) return fail(error.message);
  revalidatePath("/organizations");
  revalidatePath(`/organizations/${orgId}`);
  return ok();
}
