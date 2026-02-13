"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateOrganizationStatus(
  organizationId: string,
  status: string,
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("organizations")
    .update({ activation_status: status })
    .eq("id", organizationId);

  if (error) {
    throw new Error("Failed to update organization status");
  }

  revalidatePath("/", "layout");
}
