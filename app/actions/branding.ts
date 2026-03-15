"use server";

import { updateBusinessProfile, updateProfilePicture } from "@/lib/whatsapp";
import { revalidatePath } from "next/cache";
import { ok, fail } from "@/lib/action-response";
import { PATHS } from "@/lib/revalidation-paths";
import { getStr, getFile } from "@/lib/form-parsers";
import { requireAuth } from "@/lib/supabase-helpers";
import { adjustOrgStorage } from "@/app/actions/storage";

export async function updateWhatsappProfile(formData: FormData) {
  const auth = await requireAuth();
  if (!auth.success) return auth;
  const { supabase, organizationId } = auth;

  const locationId = getStr(formData, "locationId");
  const description = getStr(formData, "description");
  const about = getStr(formData, "about");
  const email = getStr(formData, "email");
  const website = getStr(formData, "website");
  const address = getStr(formData, "address");
  const vertical = getStr(formData, "vertical");
  const profileImage = getFile(formData, "profileImage");

  if (!locationId) {
    return fail("Location ID is required");
  }

  try {
    // 1. Get Location & Meta Phone ID
    const { data: location, error: locError } = await supabase
      .from("locations")
      .select("meta_phone_id, id, branding")
      .eq("id", locationId)
      .single();

    if (locError || !location?.meta_phone_id) {
      throw new Error("Location not found or not connected to WhatsApp");
    }

    const phoneId = location.meta_phone_id;

    // 2. Update Profile Text Fields
    const profileData: any = {
      description,
      about,
      email,
      address,
      vertical,
      websites: website ? [website] : [],
    };

    // Filter out empty strings to avoid overwriting with empty
    Object.keys(profileData).forEach((key) => {
      if (
        !profileData[key] ||
        (Array.isArray(profileData[key]) && profileData[key].length === 0)
      ) {
        delete profileData[key];
      }
    });

    if (Object.keys(profileData).length > 0) {
      await updateBusinessProfile(phoneId, profileData);
    }

    // 3. Update Profile Picture (if provided)
    let finalLogoUrl = "";
    if (profileImage && profileImage.size > 0) {
      const fileExt = profileImage.name.split(".").pop();
      const filePath = `whatsapp-profiles/${locationId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("compliance-docs")
        .upload(filePath, profileImage);

      if (uploadError) throw new Error("Failed to upload image to storage");

      const { data: urlData } = await supabase.storage
        .from("compliance-docs")
        .createSignedUrl(filePath, 3600);

      if (!urlData?.signedUrl)
        throw new Error("Failed to get signed URL for image");

      await updateProfilePicture(phoneId, urlData.signedUrl);
      await adjustOrgStorage(supabase, organizationId, profileImage.size);

      const { data: publicUrlData } = supabase.storage
        .from("compliance-docs")
        .getPublicUrl(filePath);
      finalLogoUrl = publicUrlData.publicUrl;
    }

    // 4. Update Database Branding to keep in sync & Set Complete
    const currentBranding = location.branding || {
      colors: { primary: "#000000", secondary: "#ffffff", accent: "#3b82f6" },
      logo_url: "",
      social_links: { instagram: "", facebook: "", tiktok: "" },
    };

    await supabase
      .from("locations")
      .update({
        branding: {
          ...currentBranding,
          logo_url: finalLogoUrl || currentBranding.logo_url,
        },
        is_branding_completed: true, // Mark as completed!
      })
      .eq("id", locationId);

    revalidatePath(PATHS.COMPLIANCE);
    revalidatePath(PATHS.HOME);
    return ok();
  } catch (error: any) {
    console.error("Update Branding Error:", error);
    return fail(error.message);
  }
}
