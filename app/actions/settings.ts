"use server";

import { revalidatePath } from "next/cache";
import { updateBusinessProfile, updateProfilePicture } from "@/lib/whatsapp";
import { PATHS } from "@/lib/revalidation-paths";
import { requireAuth } from "@/lib/supabase-helpers";
import { fail } from "@/lib/action-response";
import { captureWarning } from "@/lib/monitoring";

// ── Location Actions ──

export async function saveGoogleReviewUrl(
  locationId: string,
  reviewUrl: string,
) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const { data: loc } = await supabase
    .from("locations")
    .select("business_connectors")
    .eq("id", locationId)
    .single();

  const { encryptConnectors, decryptConnectors } = await import(
    "@/lib/business-connectors"
  );

  let existing = {};
  if (loc?.business_connectors) {
    try {
      existing = decryptConnectors(loc.business_connectors as string);
    } catch {
      // If decryption fails, start fresh
    }
  }

  const encrypted = encryptConnectors({
    ...existing,
    google_review_url: reviewUrl || undefined,
  });

  const { error } = await supabase
    .from("locations")
    .update({ business_connectors: encrypted })
    .eq("id", locationId);

  if (error) return fail("Failed to save Google review URL");

  revalidatePath(PATHS.SETTINGS);
  return { success: true };
}

export async function updateLocation(
  locationId: string,
  data: {
    name?: string;
    address?: string | null;
    phone_number?: string | null;
    branding?: Record<string, unknown>;
    seats?: number;
    max_covers_per_shift?: number | null;
    standard_reservation_duration?: number | null;
    opening_hours?: Record<string, unknown>;
    slug?: string;
  },
) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const { error, data: result } = await supabase
    .from("locations")
    .update(data)
    .eq("id", locationId)
    .select("id, meta_phone_id, branding")
    .single();

  if (error) return fail("Failed to update location");

  // Sync with Meta if branding changed and meta_phone_id exists
  if (data.branding && result?.meta_phone_id) {
    try {
      if (data.branding.logo_url) {
        await updateProfilePicture(
          result.meta_phone_id,
          data.branding.logo_url as string,
        );
      }

      const profileData: Record<string, string> = {};
      if (data.branding.description)
        profileData.description = data.branding.description as string;
      if (data.branding.email)
        profileData.email = data.branding.email as string;

      if (Object.keys(profileData).length > 0) {
        await updateBusinessProfile(result.meta_phone_id, profileData);
      }
    } catch (e) {
      // Non-critical: sync failure doesn't block the location update
      captureWarning("Failed to sync branding to Meta profile", { service: "whatsapp", flow: "location_branding_sync", locationId });
    }
  }

  revalidatePath(PATHS.SETTINGS);
  revalidatePath(PATHS.HOME);
  return { success: true };
}

