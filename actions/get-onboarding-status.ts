"use server";

import { createClient } from "@/utils/supabase/server";
import {
  Location,
  TelnyxRegulatoryRequirement,
  Organization,
} from "@/types/general";

export type OnboardingData = {
  documents: boolean;
  phone: boolean;
  voice: boolean;
  branding: boolean;
  whatsapp: boolean;
};

export async function getOnboardingStatus(
  locationId: string,
): Promise<OnboardingData> {
  const supabase = await createClient();

  // 1. Fetch Location data
  const { data: location, error: locationError } = await supabase
    .from("locations")
    .select("*, organization:organization_id (*)")
    .eq("id", locationId)
    .single();

  if (locationError || !location) {
    console.error(
      "Error fetching location for onboarding status:",
      locationError,
    );
    return {
      documents: false,
      phone: false,
      voice: false,
      branding: false,
      whatsapp: false,
    };
  }

  // 2. Fetch Regulatory Requirement status (if ID exists)
  let documentsStatus = false;
  if (location.regulatory_requirement_id) {
    const { data: requirement } = await supabase
      .from("telnyx_regulatory_requirements")
      .select("status")
      .eq("id", location.regulatory_requirement_id)
      .single();

    // valid statuses: 'approved' | 'pending' | 'more_info_required' | 'rejected'
    // check if it exists and is not rejected? or just approved?
    // User said "Invia documenti", so maybe just having sent them (pending) is enough for that step?
    // But usually "Completed" means approved. Let's stick to 'approved' for green check.
    // Actually, let's treat 'pending' or 'approved' as "Action Taken" so the step is marked as done?
    // No, "Done" implies success. Let's stick to approved.
    // Wait, if it takes time, the user might feel stuck.
    // For now: documents = approved.
    if (requirement && requirement.status === "approved") {
      documentsStatus = true;
    }
  }

  // 3. Determine other statuses
  const phoneStatus = !!location.telnyx_phone_number;
  const voiceStatus = !!location.telnyx_voice_app_id;
  const brandingStatus = !!(location.branding && location.branding.logo_url);
  // Check association with organization for WhatsApp
  // Using 'organization' join from above
  const organization = location.organization as unknown as Organization;
  const whatsappStatus = !!organization?.telnyx_managed_account_id;

  return {
    documents: documentsStatus,
    phone: phoneStatus,
    voice: voiceStatus,
    branding: brandingStatus,
    whatsapp: whatsappStatus,
  };
}
