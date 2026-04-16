"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { PATHS } from "@/lib/revalidation-paths";
import { requireAuth } from "@/lib/supabase-helpers";
import { getStorageFileSize, adjustOrgStorage } from "@/app/actions/storage";
import type { SupabaseClient } from "@supabase/supabase-js";

// ── Storage Helper ──

export async function deleteFileFromStorage(
  publicUrl: string,
  bucketName: string,
  supabase: SupabaseClient,
  orgId: string,
) {
  try {
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split(`${bucketName}/`);
    if (pathParts.length > 1) {
      const filePath = decodeURIComponent(pathParts[1]);
      const fileSize = await getStorageFileSize(supabase, bucketName, filePath);
      await supabase.storage.from(bucketName).remove([filePath]);
      if (fileSize > 0) {
        await adjustOrgStorage(supabase, orgId, -fileSize);
      }
    }
  } catch (e) {
    console.error(`Failed to delete file from ${bucketName}:`, e);
  }
}

// ── Internal Helpers ──

async function getMenuContent(menuId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menus")
    .select("content")
    .eq("id", menuId)
    .single();

  if (error || !data) throw new Error("Menu not found");
  return Array.isArray(data.content) ? data.content : [];
}

async function saveMenuContent(menuId: string, content: unknown[]) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("menus")
    .update({ content })
    .eq("id", menuId);
  if (error) throw new Error("Failed to save menu content");
}

// ── Categories ──

export async function createCategory(
  menuId: string,
  organizationId: string,
  data: { name: string; description?: string; is_visible?: boolean },
) {
  try {
    const auth = await requireAuth();
    if (!auth.success) return { error: "Unauthorized" };

    const content = await getMenuContent(menuId);

    const newCategory = {
      id: uuidv4(),
      name: data.name,
      description: data.description || "",
      items: [],
      is_visible: data.is_visible ?? true,
      sort_order: content.length,
    };

    content.push(newCategory);
    await saveMenuContent(menuId, content);

    revalidatePath(PATHS.SETTINGS);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Failed to create category" };
  }
}

export async function updateCategory(
  categoryId: string,
  menuId: string,
  data: {
    name?: string;
    description?: string;
    sort_order?: number;
    is_visible?: boolean;
  },
) {
  try {
    const auth = await requireAuth();
    if (!auth.success) return { error: "Unauthorized" };

    const content = await getMenuContent(menuId);
    const category = content.find((c: Record<string, unknown>) => c.id === categoryId);

    if (!category) throw new Error("Category not found");

    if (data.name !== undefined) category.name = data.name;
    if (data.description !== undefined) category.description = data.description;
    if (data.sort_order !== undefined) category.sort_order = data.sort_order;
    if (data.is_visible !== undefined) category.is_visible = data.is_visible;

    await saveMenuContent(menuId, content);

    revalidatePath(PATHS.SETTINGS);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Failed to update category" };
  }
}

export async function deleteCategory(menuId: string, categoryId: string) {
  const auth = await requireAuth();
  if (!auth.success) return { error: "Unauthorized" };
  const { supabase, organizationId } = auth;

  try {

    let content = await getMenuContent(menuId);

    const category = content.find((c: Record<string, unknown>) => c.id === categoryId);
    if (category && Array.isArray(category.items)) {
      for (const item of category.items as Array<{ image_url?: string }>) {
        if (item.image_url) {
          await deleteFileFromStorage(item.image_url, "menu-images", supabase, organizationId);
        }
      }
    }

    content = content.filter((c: Record<string, unknown>) => c.id !== categoryId);

    await saveMenuContent(menuId, content);

    revalidatePath(PATHS.SETTINGS);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Failed to delete category" };
  }
}

// ── Menu Items ──

export async function createMenuItem(
  menuId: string,
  categoryId: string,
  data: {
    name: string;
    price: number;
    description?: string;
    image_url?: string | null;
    is_available?: boolean;
    is_new?: boolean;
    allergens?: string[];
    tags?: string[];
  },
) {
  try {
    const auth = await requireAuth();
    if (!auth.success) return { error: "Unauthorized" };

    const content = await getMenuContent(menuId);
    const category = content.find((c: Record<string, unknown>) => c.id === categoryId);
    if (!category) throw new Error("Category not found");

    const newItem = {
      id: uuidv4(),
      name: data.name,
      description: data.description || "",
      price: data.price,
      is_available: data.is_available ?? true,
      is_new: data.is_new ?? false,
      allergens: data.allergens || [],
      tags: data.tags || [],
      image_url: data.image_url || null,
      sort_order: (Array.isArray(category.items) ? category.items.length : 0),
    };

    if (!category.items) category.items = [];
    (category.items as unknown[]).push(newItem);

    await saveMenuContent(menuId, content);

    revalidatePath(PATHS.SETTINGS);
    revalidatePath(`/menus-management/${menuId}`);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Failed to create item" };
  }
}

export async function updateMenuItem(
  menuId: string,
  itemId: string,
  data: {
    name?: string;
    description?: string;
    price?: number;
    image_url?: string | null;
    is_available?: boolean;
    is_new?: boolean;
    allergens?: string[];
    tags?: string[];
    sort_order?: number;
  },
) {
  try {
    const auth = await requireAuth();
    if (!auth.success) return { error: "Unauthorized" };

    const content = await getMenuContent(menuId);

    let found = false;
    for (const cat of content) {
      if (Array.isArray(cat.items)) {
        const item = (cat.items as Array<Record<string, unknown>>).find((i) => i.id === itemId);
        if (item) {
          if (data.name !== undefined) item.name = data.name;
          if (data.description !== undefined) item.description = data.description;
          if (data.price !== undefined) item.price = data.price;
          if ('image_url' in data) item.image_url = data.image_url ?? null;
          if (data.is_available !== undefined) item.is_available = data.is_available;
          if (data.is_new !== undefined) item.is_new = data.is_new;
          if (data.allergens !== undefined) item.allergens = data.allergens;
          if (data.tags !== undefined) item.tags = data.tags;
          if (data.sort_order !== undefined) item.sort_order = data.sort_order;
          found = true;
          break;
        }
      }
    }

    if (!found) throw new Error("Item not found");

    await saveMenuContent(menuId, content);

    revalidatePath(PATHS.SETTINGS);
    revalidatePath(`/menus-management/${menuId}`);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Failed to update item" };
  }
}

export async function deleteMenuItem(menuId: string, itemId: string) {
  const auth = await requireAuth();
  if (!auth.success) return { error: "Unauthorized" };
  const { supabase, organizationId } = auth;

  try {

    const content = await getMenuContent(menuId);

    for (const cat of content) {
      if (Array.isArray(cat.items)) {
        const items = cat.items as Array<Record<string, unknown>>;
        const itemIndex = items.findIndex((i) => i.id === itemId);
        if (itemIndex !== -1) {
          const item = items[itemIndex];
          if (item.image_url) {
            await deleteFileFromStorage(item.image_url as string, "menu-images", supabase, organizationId);
          }
          items.splice(itemIndex, 1);
        }
      }
    }

    await saveMenuContent(menuId, content);

    revalidatePath(PATHS.SETTINGS);
    revalidatePath(`/menus-management/${menuId}`);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Failed to delete item" };
  }
}

