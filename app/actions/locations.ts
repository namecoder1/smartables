"use server";

import { requireAuth } from "@/lib/supabase-helpers";
import { ok, fail } from "@/lib/action-response";
import { PATHS } from "@/lib/revalidation-paths";
import { revalidatePath } from "next/cache";

export async function updateLocationStatus(locationId: string, status: string) {
  const auth = await requireAuth();
  if (!auth.success) return fail("Non autorizzato");
  const { supabase } = auth;

  const { error } = await supabase
    .from("locations")
    .update({ activation_status: status })
    .eq("id", locationId);

  if (error) return fail("Failed to update location status");

  revalidatePath(PATHS.ROOT_LAYOUT, "layout");
  return ok();
}
