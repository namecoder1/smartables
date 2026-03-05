"use server";

import { createClient } from "@/utils/supabase/server";
import { getPhoneNumberDetails, getBusinessProfile } from "@/lib/whatsapp";

export async function getWhatsappSettings() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

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
    .eq("created_by", user.id)
    .single();

  if (!organization) {
    return { success: false, error: "Organization not found" };
  }

  const primaryLocation = organization.locations?.[0];
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

  return {
    success: true,
    data: {
      primaryLocation,
      whatsappName,
      businessProfile,
      pendingCallbackCount,
    },
  };
}
