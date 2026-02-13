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
  test: boolean;
  phoneNumber: string | null;
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
      test: false,
      phoneNumber: null,
    };
  }

  // 2. Fetch Regulatory Requirement status (if ID exists)
  let documentsStatus = false;
  // For now: documents = approved.
  console.log(
    "Checking regulatory requirement:",
    location.regulatory_requirement_id,
  );
  if (location.regulatory_requirement_id) {
    const { data: requirement } = await supabase
      .from("telnyx_regulatory_requirements")
      .select("status")
      .eq("id", location.regulatory_requirement_id)
      .single();

    console.log("Requirement status:", requirement?.status);

    if (
      requirement &&
      (requirement.status === "approved" ||
        requirement.status === "pending" ||
        requirement.status === "unapproved")
    ) {
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

  // Test status: check if whatsapp_usage_count > 0
  const testStatus = organization?.whatsapp_usage_count > 0;

  return {
    documents: documentsStatus,
    phone: phoneStatus,
    voice: voiceStatus,
    branding: brandingStatus,
    whatsapp: whatsappStatus,
    test: testStatus,
    phoneNumber: location.telnyx_phone_number || null,
  };
}
