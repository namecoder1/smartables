"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPromotions(organizationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("promotions")
    .select(
      `
      *,
      promotion_locations(*),
      promotion_menus(*),
      promotion_items(*)
    `,
    )
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
    .select(
      `
      *,
      promotion_locations(*),
      promotion_menus(*),
      promotion_items(*)
    `,
    )
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
    image_url?: string;
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
  const supabase = await createClient();

  const { location_ids, menu_ids, items, ...promotionData } = data;

  // Insert promotion
  const { data: promotion, error } = await supabase
    .from("promotions")
    .insert({
      organization_id: organizationId,
      ...promotionData,
    })
    .select()
    .single();

  if (error || !promotion) {
    console.error("Error creating promotion:", error);
    return { error: "Failed to create promotion" };
  }

  // Insert junction rows
  if (location_ids && location_ids.length > 0) {
    const { error: locError } = await supabase
      .from("promotion_locations")
      .insert(
        location_ids.map((lid) => ({
          promotion_id: promotion.id,
          location_id: lid,
        })),
      );
    if (locError)
      console.error("Error inserting promotion_locations:", locError);
  }

  if (menu_ids && menu_ids.length > 0) {
    const { error: menuError } = await supabase.from("promotion_menus").insert(
      menu_ids.map((mid) => ({
        promotion_id: promotion.id,
        menu_id: mid,
      })),
    );
    if (menuError) console.error("Error inserting promotion_menus:", menuError);
  }

  if (items && items.length > 0) {
    const { error: itemError } = await supabase.from("promotion_items").insert(
      items.map((item) => ({
        promotion_id: promotion.id,
        ...item,
      })),
    );
    if (itemError) console.error("Error inserting promotion_items:", itemError);
  }

  revalidatePath("/(private)/(org)/promotions", "page");
  return { success: true, id: promotion.id };
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
  const supabase = await createClient();

  const { location_ids, menu_ids, items, ...promotionData } = data;

  // Update promotion row
  const { error } = await supabase
    .from("promotions")
    .update({
      ...promotionData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating promotion:", error);
    return { error: "Failed to update promotion" };
  }

  // Replace junction rows: delete old, insert new
  // Locations
  await supabase.from("promotion_locations").delete().eq("promotion_id", id);
  if (location_ids && location_ids.length > 0) {
    await supabase.from("promotion_locations").insert(
      location_ids.map((lid) => ({
        promotion_id: id,
        location_id: lid,
      })),
    );
  }

  // Menus
  await supabase.from("promotion_menus").delete().eq("promotion_id", id);
  if (menu_ids && menu_ids.length > 0) {
    await supabase.from("promotion_menus").insert(
      menu_ids.map((mid) => ({
        promotion_id: id,
        menu_id: mid,
      })),
    );
  }

  // Items
  await supabase.from("promotion_items").delete().eq("promotion_id", id);
  if (items && items.length > 0) {
    await supabase.from("promotion_items").insert(
      items.map((item) => ({
        promotion_id: id,
        ...item,
      })),
    );
  }

  revalidatePath("/(private)/(org)/promotions", "page");
  return { success: true };
}

export async function deletePromotion(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("promotions").delete().eq("id", id);

  if (error) {
    console.error("Error deleting promotion:", error);
    return { error: "Failed to delete promotion" };
  }

  revalidatePath("/(private)/(org)/promotions", "page");
  return { success: true };
}
