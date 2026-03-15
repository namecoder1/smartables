"use server";

import { createClient } from "@/utils/supabase/server";
import { Location, Organization } from "@/types/general";

export type OnboardingData = {
  documents: boolean;
  phone: boolean;
  voice: boolean;
  branding: boolean;
  test: boolean;
  phoneNumber: string | null;
  activationStatus: string | null;
  rejectionReason: string | null;
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
      rejectionReason: null,
    };
  }

  // 2. Regulatory Requirement status
  let documentsStatus = false;
  let rejectionReason = null;

  if (location.regulatory_status) {
    rejectionReason = location.regulatory_rejection_reason;
    if (
      location.regulatory_status === "approved" ||
      location.regulatory_status === "pending" ||
      location.regulatory_status === "unapproved"
    ) {
      documentsStatus = true;
    }
  }

  // 3. Determine other statuses
  const phoneStatus =
    !!location.telnyx_phone_number &&
    location.activation_status !== "purchasing";
  const voiceStatus = location.activation_status === "verified";
  const brandingStatus = !!location.is_branding_completed;
  // Check association with organization for WhatsApp
  // Using 'organization' join from above
  const organization = location.organization as unknown as Organization;

  // Test status: check if the explicit flag is true
  const testStatus = !!location.is_test_completed;

  const result: OnboardingData = {
    documents: documentsStatus,
    phone: phoneStatus,
    voice: voiceStatus,
    branding: brandingStatus,
    test: testStatus,
    phoneNumber: location.telnyx_phone_number || null,
    activationStatus: location.activation_status || "pending",
    rejectionReason: rejectionReason,
  };

  return result;
}
