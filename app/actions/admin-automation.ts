"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import {
  purchasePhoneNumber,
  getRequirementGroup,
  getOwnedNumbers,
} from "@/lib/telnyx";
import {
  addNumberToWaba,
  requestVerificationCode,
} from "@/lib/whatsapp-registration";
import { revalidatePath } from "next/cache";
import { captureError } from "@/lib/monitoring";

/**
 * Syncs the real Telnyx status (requirement group + number) for a location.
 * Fetches from Telnyx API and updates the DB if out of sync.
 */
export async function syncTelnyxStatus(locationId: string) {
  const supabase = createAdminClient();

  try {
    // 1. Fetch location with its regulatory data
    const { data: location, error: locError } = await supabase
      .from("locations")
      .select(
        `
        id, telnyx_phone_number, activation_status,
        regulatory_status, telnyx_requirement_group_id
      `,
      )
      .eq("id", locationId)
      .single();

    if (locError || !location) {
      return { success: false, message: "Location not found" };
    }

    const results: string[] = [];
    const reqGroupId = location.telnyx_requirement_group_id;

    // 2. Check Requirement Group status on Telnyx
    if (reqGroupId) {
      try {
        const telnyxGroup = await getRequirementGroup(reqGroupId);
        const telnyxStatus = telnyxGroup.status?.toLowerCase();
        const localStatus = location.regulatory_status;

        if (telnyxStatus !== localStatus) {
          await supabase
            .from("locations")
            .update({
              regulatory_status:
                telnyxStatus === "unapproved" ? "pending" : telnyxStatus,
              regulatory_rejection_reason:
                telnyxStatus === "approved"
                  ? null
                  : telnyxGroup.rejection_reason || null,
            })
            .eq("id", locationId);

          results.push(`Req Group: ${localStatus} → ${telnyxStatus}`);
        } else {
          results.push(`Req Group: già in sync (${telnyxStatus})`);
        }
      } catch (e: any) {
        captureError(e, { service: "telnyx", flow: "sync_telnyx_status_req_group", locationId });
        results.push(`Req Group error: ${e.message}`);
      }
    } else {
      results.push("Req Group: nessun ID Telnyx collegato");
    }

    // 3. Check phone number status on Telnyx
    if (location.telnyx_phone_number) {
      try {
        const ownedNumbers = await getOwnedNumbers();
        const matched = ownedNumbers.find(
          (n: any) => n.phoneNumber === location.telnyx_phone_number,
        );

        if (matched) {
          results.push(`Numero Telnyx: ${matched.status}`);

          // If number is active, the order was completed — force req group to approved
          if (matched.status === "active") {
            if (location.regulatory_status !== "approved") {
              await supabase
                .from("locations")
                .update({
                  regulatory_status: "approved",
                  regulatory_rejection_reason: null,
                })
                .eq("id", locationId);
              results.push(
                `Req Group forzato: ${location.regulatory_status} → approved (numero attivo)`,
              );
            }

            // Update location status if still provisioning
            if (location.activation_status === "provisioning") {
              await supabase
                .from("locations")
                .update({ activation_status: "pending_verification" })
                .eq("id", locationId);
              results.push(
                "Location status: provisioning → pending_verification",
              );
            }
          }
        } else {
          results.push("Numero non trovato tra owned numbers Telnyx");
        }
      } catch (e: any) {
        captureError(e, { service: "telnyx", flow: "sync_telnyx_status_owned_numbers", locationId });
        results.push(`Owned numbers error: ${e.message}`);
      }
    }

    revalidatePath("/manage");
    return { success: true, message: results.join("\n") };
  } catch (error: any) {
    captureError(error, { service: "telnyx", flow: "sync_telnyx_status", locationId });
    console.error("[Admin] Sync Error:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Manually triggers the purchase of a phone number for a location.
 * Assumes the requirement group is already approved.
 */
export async function manualPurchaseNumber(
  locationId: string,
  requirementGroupId: string,
) {
  const supabase = createAdminClient();

  try {
    // 1. Fetch Location
    const { data: location, error: locError } = await supabase
      .from("locations")
      .select("telnyx_phone_number")
      .eq("id", locationId)
      .single();

    if (locError || !location?.telnyx_phone_number) {
      return { success: false, message: "Location or Phone Number not found" };
    }

    await purchasePhoneNumber(location.telnyx_phone_number, requirementGroupId);

    revalidatePath("/manage");
    return { success: true, message: "Number purchased successfully" };
  } catch (error: any) {
    captureError(error, { service: "telnyx", flow: "manual_purchase_number", locationId });
    console.error("[Admin] Purchase Error:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Manually adds the number to Meta WABA.
 * Requires the number to be already purchased and active in Telnyx.
 */
export async function manualMetaRegistration(locationId: string) {
  const supabase = createAdminClient();

  try {
    // 1. Fetch Location
    const { data: location, error: locError } = await supabase
      .from("locations")
      .select("telnyx_phone_number, name")
      .eq("id", locationId)
      .single();

    if (locError || !location?.telnyx_phone_number) {
      return { success: false, message: "Location data not found" };
    }

    const cleanNumber = location.telnyx_phone_number.replace("+", "");

    // 2. Add to WABA
    const metaPhoneId = await addNumberToWaba(cleanNumber, location.name);

    // 3. Update DB
    const { error: updateError } = await supabase
      .from("locations")
      .update({
        meta_phone_id: metaPhoneId,
        activation_status: "pending_verification", // Number added to Meta, but voice verification still needed
      })
      .eq("id", locationId);

    if (updateError) return { success: false, message: updateError.message };

    revalidatePath("/manage");
    return { success: true, message: "Added to Meta WABA", metaPhoneId };
  } catch (error: any) {
    captureError(error, { service: "whatsapp", flow: "manual_meta_registration", locationId });
    console.error("[Admin] Meta Add Error:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Manually requests the Voice Verification code from Meta.
 * Requires Meta Phone ID to be present.
 */
export async function manualVoiceVerification(locationId: string) {
  const supabase = createAdminClient();

  try {
    // 1. Fetch Location
    const { data: location, error: locError } = await supabase
      .from("locations")
      .select("meta_phone_id")
      .eq("id", locationId)
      .single();

    if (locError || !location?.meta_phone_id) {
      return { success: false, message: "Meta Phone ID not found on location" };
    }

    // 2. Request Code
    await requestVerificationCode(location.meta_phone_id, "VOICE");

    revalidatePath("/manage");
    return { success: true, message: "Voice Verification Requested" };
  } catch (error: any) {
    captureError(error, { service: "whatsapp", flow: "manual_voice_verification", locationId });
    console.error("[Admin] Verify Error:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Permanently deletes a location and its data.
 * This is a destructive action for admin cleanup.
 */
export async function deleteLocationAction(locationId: string) {
  const supabase = createAdminClient();

  try {
    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("id", locationId);

    if (error) return { success: false, message: error.message };

    revalidatePath("/manage");
    return { success: true, message: "Location deleted successfully" };
  } catch (error: any) {
    console.error("[Admin] Delete Error:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Permanently deletes a user and all their data.
 * 1. Cleans up storage files via Storage API (SQL can't do this)
 * 2. Deletes the user from auth.users (triggers cascade for relational data)
 */
export async function deleteUserAction(userId: string) {
  const supabase = createAdminClient();

  try {
    // 1. Get org_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (profile?.organization_id) {
      const orgId = profile.organization_id;

      // 2. Get all location IDs
      const { data: locations } = await supabase
        .from("locations")
        .select("id")
        .eq("organization_id", orgId);

      const locationIds = locations?.map((l) => l.id) || [];

      // 3. Clean storage buckets

      // 3a. location-logo: files named like {location_id}/...
      for (const locId of locationIds) {
        const { data: logoFiles } = await supabase.storage
          .from("location-logo")
          .list(locId);
        if (logoFiles?.length) {
          await supabase.storage
            .from("location-logo")
            .remove(logoFiles.map((f) => `${locId}/${f.name}`));
        }
      }

      // 3b. compliance-docs: files in {location_id}/... folders
      for (const locId of locationIds) {
        const { data: compFiles } = await supabase.storage
          .from("compliance-docs")
          .list(locId);
        if (compFiles?.length) {
          await supabase.storage
            .from("compliance-docs")
            .remove(compFiles.map((f) => `${locId}/${f.name}`));
        }
      }

      // 3c. menu-images: files in {org_id}/... folder
      const { data: menuImgFiles } = await supabase.storage
        .from("menu-images")
        .list(orgId);
      if (menuImgFiles?.length) {
        await supabase.storage
          .from("menu-images")
          .remove(menuImgFiles.map((f) => `${orgId}/${f.name}`));
      }

      // 3d. menu-files: files in {org_id}/... folder
      const { data: menuPdfFiles } = await supabase.storage
        .from("menu-files")
        .list(orgId);
      if (menuPdfFiles?.length) {
        await supabase.storage
          .from("menu-files")
          .remove(menuPdfFiles.map((f) => `${orgId}/${f.name}`));
      }
    }

    // 4. Delete user from auth (triggers cascade for relational data)
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) return { success: false, message: error.message };

    revalidatePath("/manage");
    return { success: true, message: "User and all data deleted successfully" };
  } catch (error: any) {
    console.error("[Admin] Delete User Error:", error);
    return { success: false, message: error.message };
  }
}
