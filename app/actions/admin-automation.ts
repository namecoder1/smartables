"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { purchasePhoneNumber } from "@/lib/telnyx";
import {
  addNumberToWaba,
  requestVerificationCode,
} from "@/lib/meta-registration";
import { revalidatePath } from "next/cache";

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
      throw new Error("Location or Phone Number not found");
    }

    await purchasePhoneNumber(location.telnyx_phone_number, requirementGroupId);

    revalidatePath("/manage");
    return { success: true, message: "Number purchased successfully" };
  } catch (error: any) {
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
      throw new Error("Location data not found");
    }

    const cleanNumber = location.telnyx_phone_number.replace("+", "");

    // 2. Add to WABA
    const metaPhoneId = await addNumberToWaba(cleanNumber, location.name);

    // 3. Update DB
    const { error: updateError } = await supabase
      .from("locations")
      .update({
        meta_phone_id: metaPhoneId,
        activation_status: "active", // Assuming if we are here, it's pretty active
      })
      .eq("id", locationId);

    if (updateError) throw updateError;

    revalidatePath("/manage");
    return { success: true, message: "Added to Meta WABA", metaPhoneId };
  } catch (error: any) {
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
      throw new Error("Meta Phone ID not found on location");
    }

    // 2. Request Code
    await requestVerificationCode(location.meta_phone_id, "VOICE");

    revalidatePath("/manage");
    return { success: true, message: "Voice Verification Requested" };
  } catch (error: any) {
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

    if (error) throw error;

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
    if (error) throw error;

    revalidatePath("/manage");
    return { success: true, message: "User and all data deleted successfully" };
  } catch (error: any) {
    console.error("[Admin] Delete User Error:", error);
    return { success: false, message: error.message };
  }
}
