"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/supabase-helpers";
import { revalidatePath } from "next/cache";
import { ok, okWith, fail, type ActionResult } from "@/lib/action-response";
import { PATHS } from "@/lib/revalidation-paths";
import { deleteFileFromStorage } from "@/app/actions/menu-editor";

export async function getPromotions(organizationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching promotions:", error);
    throw new Error("Failed to fetch promotions");
  }

  return data;
}

export async function getPromotion(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching promotion:", error);
    throw new Error("Failed to fetch promotion");
  }

  return data;
}

export async function createPromotion(
  organizationId: string,
  data: {
    name: string;
    description?: string;
    image_url?: string | null;
    type: string;
    value?: number | null;
    all_locations: boolean;
    all_menus: boolean;
    starts_at?: string | null;
    ends_at?: string | null;
    recurring_schedule?: any;
    visit_threshold?: number | null;
    is_active: boolean;
    priority?: number;
    stackable?: boolean;
    notify_via_whatsapp?: boolean;
    location_ids?: string[];
    menu_ids?: string[];
    items?: {
      target_type: string;
      target_ref?: string | null;
      role: string;
      override_value?: number | null;
      override_type?: string | null;
    }[];
  },
) {
  const authCheck = await requireAuth();
  if (!authCheck.success) return fail("Non autorizzato");
  const { supabase } = authCheck;

  const { location_ids, menu_ids, items, ...promotionData } = data;

  // Insert promotion with arrays
  const { data: promotion, error } = await supabase
    .from("promotions")
    .insert({
      organization_id: organizationId,
      ...promotionData,
      target_location_ids: location_ids || [],
      target_menu_ids: menu_ids || [],
    })
    .select()
    .single();

  if (error || !promotion) {
    console.error("Error creating promotion:", error);
    return fail("Failed to create promotion");
  }

  revalidatePath(PATHS.PROMOTIONS, "page");
  return okWith({ id: promotion.id as string });
}

export async function updatePromotion(
  id: string,
  data: {
    name: string;
    description?: string | null;
    image_url?: string | null;
    type: string;
    value?: number | null;
    all_locations: boolean;
    all_menus: boolean;
    starts_at?: string | null;
    ends_at?: string | null;
    recurring_schedule?: any;
    visit_threshold?: number | null;
    is_active: boolean;
    priority?: number;
    stackable?: boolean;
    notify_via_whatsapp?: boolean;
    location_ids?: string[];
    menu_ids?: string[];
    items?: {
      target_type: string;
      target_ref?: string | null;
      role: string;
      override_value?: number | null;
      override_type?: string | null;
    }[];
  },
) {
  const authCheck = await requireAuth();
  if (!authCheck.success) return fail("Non autorizzato");
  const { supabase } = authCheck;

  const { location_ids, menu_ids, items, ...promotionData } = data;

  // Update promotion row with arrays
  const { error } = await supabase
    .from("promotions")
    .update({
      ...promotionData,
      target_location_ids: location_ids || [],
      target_menu_ids: menu_ids || [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating promotion:", error);
    return fail("Failed to update promotion");
  }

  revalidatePath(PATHS.PROMOTIONS, "page");
  return ok();
}

export async function deletePromotion(id: string): Promise<ActionResult> {
  const authCheck = await requireAuth();
  if (!authCheck.success) return fail("Non autorizzato");
  const { supabase, organizationId } = authCheck;

  const { data: promo } = await supabase
    .from("promotions")
    .select("image_url")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("promotions").delete().eq("id", id);

  if (error) {
    console.error("Error deleting promotion:", error);
    return fail("Failed to delete promotion");
  }

  if (promo?.image_url) {
    await deleteFileFromStorage(promo.image_url, "promotion-images", supabase, organizationId);
  }

  revalidatePath(PATHS.PROMOTIONS, "page");
  return ok();
}
