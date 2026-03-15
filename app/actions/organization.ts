"use server";

import { requireAuth } from "@/lib/supabase-helpers";
import { ok, fail } from "@/lib/action-response";
import { PATHS } from "@/lib/revalidation-paths";
import { revalidatePath } from "next/cache";

export async function updateOrganizationStatus(
  organizationId: string,
  status: string,
) {
  const auth = await requireAuth();
  if (!auth.success) return fail("Non autorizzato");
  const { supabase } = auth;

  const { error } = await supabase
    .from("organizations")
    .update({ activation_status: status })
    .eq("id", organizationId);

  if (error) return fail("Failed to update organization status");

  revalidatePath(PATHS.ROOT_LAYOUT, "layout");
  return ok();
}
