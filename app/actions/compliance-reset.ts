"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function resetComplianceAction(locationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  try {
    // 1. Get the current requirement ID
    const { data: location } = await supabase
      .from("locations")
      .select("regulatory_requirement_id, organization_id")
      .eq("id", locationId)
      .single();

    if (!location) throw new Error("Location not found");

    // Verify ownership (organization created_by user)
    const { data: org } = await supabase
      .from("organizations")
      .select("created_by")
      .eq("id", location.organization_id)
      .single();

    if (!org || org.created_by !== user.id) throw new Error("Unauthorized");

    // 2. Clear location reference
    await supabase
      .from("locations")
      .update({
        regulatory_requirement_id: null,
        telnyx_phone_number: null,
        activation_status: "pending", // Reset to pending initial state
      })
      .eq("id", locationId);

    // 3. Delete the RG row if it exists
    if (location.regulatory_requirement_id) {
      await supabase
        .from("telnyx_regulatory_requirements")
        .delete()
        .eq("id", location.regulatory_requirement_id);
    }

    revalidatePath("/compliance");
    return { success: true };
  } catch (error: any) {
    console.error("Reset Compliance Error:", error);
    throw new Error(error.message);
  }
}
