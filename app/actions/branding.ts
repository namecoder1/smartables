"use server";

import { createClient } from "@/utils/supabase/server";
import { updateBusinessProfile, updateProfilePicture } from "@/lib/whatsapp";
import { revalidatePath } from "next/cache";

export async function updateWhatsappProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const locationId = formData.get("locationId") as string;
  const description = formData.get("description") as string;
  const about = formData.get("about") as string;
  const email = formData.get("email") as string;
  const website = formData.get("website") as string;
  const profileImage = formData.get("profileImage") as File;

  if (!locationId) {
    return { success: false, error: "Location ID is required" };
  }

  try {
    // 1. Get Location & Meta Phone ID
    const { data: location, error: locError } = await supabase
      .from("locations")
      .select("meta_phone_id, id")
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
    if (profileImage && profileImage.size > 0) {
      // We need a public URL for the WhatsApp API to fetch the image from, OR use resumable upload with bytes.
      // The `updateProfilePicture` in `lib/whatsapp.ts` currently expects a URL and does a complex fetch-buffer-upload dance.
      // Let's first upload to Supabase Storage to get a public URL (or signed URL), then pass that to the lib.

      const fileExt = profileImage.name.split(".").pop();
      const filePath = `whatsapp-profiles/${locationId}-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("compliance-docs") // Or a public bucket if possible? 'compliance-docs' might be private.
        .upload(filePath, profileImage);

      if (uploadError) throw new Error("Failed to upload image to storage");

      // Get Signed URL (valid for 1 hour)
      const { data: urlData } = await supabase.storage
        .from("compliance-docs")
        .createSignedUrl(filePath, 3600);

      if (!urlData?.signedUrl)
        throw new Error("Failed to get signed URL for image");

      // Pass this URL to the lib function
      await updateProfilePicture(phoneId, urlData.signedUrl);
    }

    revalidatePath("/compliance");
    return { success: true };
  } catch (error: any) {
    console.error("Update Branding Error:", error);
    return { success: false, error: error.message };
  }
}
