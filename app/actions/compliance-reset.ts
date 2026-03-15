"use server";

import { requireAuth } from "@/lib/supabase-helpers";
import { ok, fail } from "@/lib/action-response";
import { PATHS } from "@/lib/revalidation-paths";
import { revalidatePath } from "next/cache";

export async function resetComplianceAction(locationId: string) {
  const auth = await requireAuth();
  if (!auth.success) return fail("Non autorizzato");
  const { supabase, user } = auth;

  // Get the current location
  const { data: location } = await supabase
    .from("locations")
    .select("organization_id")
    .eq("id", locationId)
    .single();

  if (!location) return fail("Location not found");

  // Verify ownership (organization created_by user)
  const { data: org } = await supabase
    .from("organizations")
    .select("created_by")
    .eq("id", location.organization_id)
    .single();

  if (!org || org.created_by !== user.id) return fail("Non autorizzato");

  // Reset location regulatory fields
  const { error } = await supabase
    .from("locations")
    .update({
      telnyx_requirement_group_id: null,
      telnyx_bundle_request_id: null,
      regulatory_status: "pending",
      regulatory_rejection_reason: null,
      regulatory_documents_data: {},
      telnyx_phone_number: null,
      activation_status: "pending",
    })
    .eq("id", locationId);

  if (error) {
    console.error("Reset Compliance Error:", error);
    return fail(error.message);
  }

  revalidatePath(PATHS.COMPLIANCE);
  return ok();
}
