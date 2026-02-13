"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateLocationStatus(locationId: string, status: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("locations")
    .update({ activation_status: status })
    .eq("id", locationId);

  if (error) {
    throw new Error("Failed to update location status");
  }

  revalidatePath("/", "layout");
}
