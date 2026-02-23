"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

// --- Locations ---

export async function updateLocation(
  locationId: string,
  data: {
    name?: string;
    address?: string | null;
    phone_number?: string | null;
    branding?: any;
    seats?: number;
    max_covers_per_shift?: number | null;
    standard_reservation_duration?: number | null;
    opening_hours?: any;
    slug?: string;
  },
) {
  const supabase = await createClient();

  const { error, data: result } = await supabase
    .from("locations")
    .update(data)
    .eq("id", locationId)
    .select();

  if (error) {
    console.error("Error updating location:", error);
    throw new Error("Failed to update location");
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function createMenu(
  organizationId: string,
  data: {
    name: string;
    description?: string;
    pdf_url?: string;
    location_ids?: string[];
    is_active?: boolean;
  },
) {
  const supabase = await createClient();

  // Create menu with empty content
  if (true) {
    // Valid Javascript block to allow logic
    const { location_ids, ...menuData } = data; // content is handled manually below

    const { data: menu, error } = await supabase
      .from("menus")
      .insert({
        organization_id: organizationId,
        name: menuData.name,
        description: menuData.description,
        pdf_url: menuData.pdf_url,
        is_active: menuData.is_active,
        content: [],
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating menu:", error);
      throw new Error("Failed to create menu");
    }

    // Assign to locations if provided
    if (location_ids && location_ids.length > 0) {
      const locationInserts = location_ids.map((locId) => ({
        menu_id: menu.id,
        location_id: locId,
        is_active: true,
      }));

      const { error: locError } = await supabase
        .from("menu_locations")
        .insert(locationInserts);

      if (locError) {
        console.error("Error assigning menu to locations:", locError);
      }
    }

    revalidatePath("/settings");
    return { success: true };
  }
}

export async function updateMenu(
  menuId: string,
  data: {
    name?: string;
    description?: string;
    is_active?: boolean;
    pdf_url?: string | null;
  },
) {
  const supabase = await createClient();

  const { error } = await supabase.from("menus").update(data).eq("id", menuId);

  if (error) {
    console.error("Error updating menu:", error);
    throw new Error("Failed to update menu");
  }

  revalidatePath("/settings");
  return { success: true };
}

// --- Storage Helpers ---
async function deleteFileFromStorage(publicUrl: string, bucketName: string) {
  try {
    const supabase = await createClient();
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split(`${bucketName}/`);
    if (pathParts.length > 1) {
      const filePath = decodeURIComponent(pathParts[1]);
      await supabase.storage.from(bucketName).remove([filePath]);
    }
  } catch (e) {
    console.error(`Failed to delete file from ${bucketName}:`, e);
  }
}

// --- Menus ---

// ... (createMenu and updateMenu remain unchanged) ...

export async function deleteMenu(menuId: string) {
  const supabase = await createClient();

  // 1. Fetch menu content to find images
  const { data: menu, error: fetchError } = await supabase
    .from("menus")
    .select("content, pdf_url")
    .eq("id", menuId)
    .single();

  if (fetchError) {
    console.error("Error fetching menu for deletion:", fetchError);
    // Proceed with deletion even if fetch fails? risky, but we want to unblock.
    // Better to throw or log.
  }

  if (menu) {
    // Delete PDF if exists
    if (menu.pdf_url) {
      await deleteFileFromStorage(menu.pdf_url, "menu-files");
    }

    // Delete all Item Images
    const content = Array.isArray(menu.content) ? menu.content : [];
    for (const cat of content) {
      if (Array.isArray(cat.items)) {
        for (const item of cat.items) {
          if (item.image_url) {
            await deleteFileFromStorage(item.image_url, "menu-images");
          }
        }
      }
    }
  }

  // 2. Delete Menu Row
  const { error } = await supabase.from("menus").delete().eq("id", menuId);

  if (error) {
    console.error("Error deleting menu:", error);
    throw new Error("Failed to delete menu");
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function assignMenuToLocations(
  menuId: string,
  locationIds: string[],
) {
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("menu_locations")
    .select("location_id")
    .eq("menu_id", menuId);

  if (fetchError) throw new Error("Failed to fetch menu locations");

  const existingIds = existing.map((r: any) => r.location_id);

  const toInsert = locationIds.filter((id) => !existingIds.includes(id));
  const toDelete = existingIds.filter((id) => !locationIds.includes(id));

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from("menu_locations").insert(
      toInsert.map((id) => ({
        menu_id: menuId,
        location_id: id,
        is_active: true,
      })),
    );

    if (insertError) {
      console.error(insertError);
      throw new Error("Failed to assign locations");
    }
  }

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("menu_locations")
      .delete()
      .eq("menu_id", menuId)
      .in("location_id", toDelete);

    if (deleteError) {
      console.error(deleteError);
      throw new Error("Failed to remove locations");
    }
  }

  revalidatePath("/settings");
  return { success: true };
}

// --- Menu Helpers ---
// Since everything is in JSON, we need to fetch -> patch -> update.
// In a high-concurrency real app we'd use PL/pgSQL functions or jsonb_set,
// but for an MVP admin panel, read-modify-write is acceptable.

async function getMenuContent(menuId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menus")
    .select("content")
    .eq("id", menuId)
    .single();

  if (error || !data) throw new Error("Menu not found");
  // ensure content is array
  return Array.isArray(data.content) ? data.content : [];
}

async function saveMenuContent(menuId: string, content: any[]) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("menus")
    .update({ content })
    .eq("id", menuId);
  if (error) throw new Error("Failed to save menu content");
}

// --- Categories ---

export async function createCategory(
  menuId: string,
  organizationId: string,
  data: { name: string; description?: string; is_visible?: boolean },
) {
  try {
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

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Failed to create category" };
  }
}

export async function updateCategory(
  categoryId: string,
  menuId: string, // REQUIRED now to find the menu
  data: {
    name?: string;
    description?: string;
    sort_order?: number;
    is_visible?: boolean;
  },
) {
  try {
    const content = await getMenuContent(menuId);
    const category = content.find((c: any) => c.id === categoryId);

    if (!category) throw new Error("Category not found");

    if (data.name !== undefined) category.name = data.name;
    if (data.description !== undefined) category.description = data.description;
    if (data.sort_order !== undefined) category.sort_order = data.sort_order;
    if (data.is_visible !== undefined) category.is_visible = data.is_visible;

    await saveMenuContent(menuId, content);

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Failed to update category" };
  }
}

export async function deleteCategory(menuId: string, categoryId: string) {
  try {
    let content = await getMenuContent(menuId);

    // Find category to delete images
    const category = content.find((c: any) => c.id === categoryId);
    if (category && Array.isArray(category.items)) {
      for (const item of category.items) {
        if (item.image_url) {
          await deleteFileFromStorage(item.image_url, "menu-images");
        }
      }
    }

    content = content.filter((c: any) => c.id !== categoryId);

    await saveMenuContent(menuId, content);

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Failed to delete category" };
  }
}

// --- Menu Items ---

export async function createMenuItem(
  menuId: string, // REQUIRED
  categoryId: string,
  data: {
    name: string;
    price: number;
    description?: string;
    image_url?: string;
    is_available?: boolean;
  },
) {
  try {
    const content = await getMenuContent(menuId);
    const category = content.find((c: any) => c.id === categoryId);
    if (!category) throw new Error("Category not found");

    const newItem = {
      id: uuidv4(),
      name: data.name,
      description: data.description || "",
      price: data.price,
      is_available: data.is_available ?? true,
      image_url: data.image_url || null,
      sort_order: (category.items || []).length,
    };

    if (!category.items) category.items = [];
    category.items.push(newItem);

    await saveMenuContent(menuId, content);

    revalidatePath("/settings");
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
    image_url?: string;
    is_available?: boolean;
    sort_order?: number;
  },
) {
  try {
    const content = await getMenuContent(menuId);

    // Find item in any category
    let found = false;
    for (const cat of content) {
      if (cat.items) {
        const item = cat.items.find((i: any) => i.id === itemId);
        if (item) {
          if (data.name !== undefined) item.name = data.name;
          if (data.description !== undefined)
            item.description = data.description;
          if (data.price !== undefined) item.price = data.price;
          if (data.image_url !== undefined) item.image_url = data.image_url;
          if (data.is_available !== undefined)
            item.is_available = data.is_available;
          if (data.sort_order !== undefined) item.sort_order = data.sort_order;
          found = true;
          break;
        }
      }
    }

    if (!found) throw new Error("Item not found");

    await saveMenuContent(menuId, content);

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Failed to update item" };
  }
}

export async function deleteMenuItem(menuId: string, itemId: string) {
  try {
    const content = await getMenuContent(menuId);

    for (const cat of content) {
      if (cat.items) {
        const itemIndex = cat.items.findIndex((i: any) => i.id === itemId);
        if (itemIndex !== -1) {
          const item = cat.items[itemIndex];
          if (item.image_url) {
            await deleteFileFromStorage(item.image_url, "menu-images");
          }
          cat.items.splice(itemIndex, 1);
        }
      }
    }

    await saveMenuContent(menuId, content);

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Failed to delete item" };
  }
}

// --- Variants ---
// (Simplified: Variants are just property of Item now, if implemented)
// For now, we can omit specific logic or implement similar deep patching.
