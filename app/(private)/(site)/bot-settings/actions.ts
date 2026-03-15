"use server";

import { requireAuth } from "@/lib/supabase-helpers";
import { okWith, fail } from "@/lib/action-response";
import { getPhoneNumberDetails, getBusinessProfile } from "@/lib/whatsapp";

export async function getWhatsappSettings() {
  const auth = await requireAuth();
  if (!auth.success) return fail("Non autorizzato");
  const { supabase, organizationId } = auth;

  const { data: organization } = await supabase
    .from("organizations")
    .select(
      `
      id,
      locations (
        id,
        name,
        activation_status,
        meta_phone_id,
        telnyx_phone_number
      )
    `,
    )
    .eq("id", organizationId)
    .single();

  if (!organization) return fail("Organization not found");

  const primaryLocation = (organization.locations as any)?.[0];
  let whatsappName = "";
  let businessProfile = null;
  let pendingCallbackCount = 0;

  if (primaryLocation?.meta_phone_id) {
    const details = await getPhoneNumberDetails(primaryLocation.meta_phone_id);
    if (details) {
      whatsappName = details.verified_name || details.display_phone_number;
    }
    businessProfile = await getBusinessProfile(primaryLocation.meta_phone_id);
  }

  if (primaryLocation) {
    const { count } = await supabase
      .from("callback_requests")
      .select("id", { count: "exact", head: true })
      .eq("location_id", primaryLocation.id)
      .eq("status", "pending");
    pendingCallbackCount = count || 0;
  }

  return okWith({
    primaryLocation,
    whatsappName,
    businessProfile,
    pendingCallbackCount,
  });
}
