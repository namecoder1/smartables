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
  test: boolean;
  phoneNumber: string | null;
  activationStatus: string | null;
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
      test: false,
      phoneNumber: null,
      activationStatus: "pending",
    };
  }

  // 2. Fetch Regulatory Requirement status (if ID exists)
  let documentsStatus = false;
  // For now: documents = approved.

  if (location.regulatory_requirement_id) {
    const { data: requirement } = await supabase
      .from("telnyx_regulatory_requirements")
      .select("status")
      .eq("id", location.regulatory_requirement_id)
      .single();

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
  const phoneStatus =
    !!location.telnyx_phone_number &&
    location.activation_status !== "purchasing";
  const voiceStatus =
    location.activation_status === "verified" ||
    location.activation_status === "active";
  const brandingStatus = !!(location.branding && location.branding.logo_url);
  // Check association with organization for WhatsApp
  // Using 'organization' join from above
  const organization = location.organization as unknown as Organization;

  // Test status: check if whatsapp_usage_count > 0
  const testStatus = organization?.whatsapp_usage_count > 0;

  return {
    documents: documentsStatus,
    phone: phoneStatus,
    voice: voiceStatus,
    branding: brandingStatus,
    test: testStatus,
    phoneNumber: location.telnyx_phone_number || null,
    activationStatus: location.activation_status || "pending",
  };
}
