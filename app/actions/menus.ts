"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { PATHS } from "@/lib/revalidation-paths";
import { requireAuth } from "@/lib/supabase-helpers";
import { ok, fail } from "@/lib/action-response";
import { deleteFileFromStorage } from "@/app/actions/menu-editor";
import { checkResourceAvailability } from "@/lib/limiter";

export async function createMenu(
  organizationId: string,
  data: {
    name: string;
    description?: string;
    pdf_url?: string;
    location_ids?: string[];
    is_active?: boolean;
    starts_at?: string | null;
    ends_at?: string | null;
  },
) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const menuAvail = await checkResourceAvailability(supabase, organizationId, "menus");
  if (!menuAvail.allowed) return fail("Limite menu digitali raggiunto. Aggiorna il piano per aggiungerne altri.");

  const { location_ids, ...menuData } = data;

  const { data: menu, error } = await supabase
    .from("menus")
    .insert({
      organization_id: organizationId,
      name: menuData.name,
      description: menuData.description,
      pdf_url: menuData.pdf_url,
      is_active: menuData.is_active,
      starts_at: menuData.starts_at || null,
      ends_at: menuData.ends_at || null,
      content: [],
    })
    .select()
    .single();

  if (error) return fail("Impossibile creare il menù");

  if (location_ids && location_ids.length > 0) {
    const locationInserts = location_ids.map((locId) => ({
      menu_id: menu.id,
      location_id: locId,
      is_active: true,
    }));

    await supabase.from("menu_locations").insert(locationInserts);
  }

  revalidatePath(PATHS.SETTINGS);
  return ok();
}

export async function updateMenu(
  menuId: string,
  data: {
    name?: string;
    description?: string;
    is_active?: boolean;
    pdf_url?: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
  },
) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const { error } = await supabase.from("menus").update(data).eq("id", menuId);
  if (error) return fail("Impossibile aggiornare il menù");

  revalidatePath(PATHS.SETTINGS);
  return ok();
}

export async function deleteMenu(menuId: string) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase, organizationId } = auth;

  const { data: menu } = await supabase
    .from("menus")
    .select("content, pdf_url")
    .eq("id", menuId)
    .single();

  if (menu) {
    if (menu.pdf_url) {
      await deleteFileFromStorage(menu.pdf_url, "menu-files", supabase, organizationId);
    }

    const content = Array.isArray(menu.content) ? menu.content : [];
    for (const cat of content) {
      if (Array.isArray(cat.items)) {
        for (const item of cat.items as Array<{ image_url?: string }>) {
          if (item.image_url) {
            await deleteFileFromStorage(item.image_url, "menu-images", supabase, organizationId);
          }
        }
      }
    }
  }

  const { error } = await supabase.from("menus").delete().eq("id", menuId);
  if (error) return fail("Impossibile eliminare il menù");

  revalidatePath(PATHS.SETTINGS);
  return ok();
}

export async function updateMenuLocationAvailability(
  menuId: string,
  locationId: string,
  dailyFrom: string | null,
  dailyUntil: string | null,
) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const { error } = await supabase
    .from("menu_locations")
    .update({ daily_from: dailyFrom, daily_until: dailyUntil })
    .eq("menu_id", menuId)
    .eq("location_id", locationId);

  if (error) return fail("Impossibile aggiornare la disponibilità del menù");

  revalidatePath(PATHS.SETTINGS);
  return ok();
}

export async function assignMenuToLocations(
  menuId: string,
  locationIds: string[],
) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const { data: existing, error: fetchError } = await supabase
    .from("menu_locations")
    .select("location_id")
    .eq("menu_id", menuId);

  if (fetchError) return fail("Impossibile recuperare le sedi del menù");

  const existingIds = existing.map((r: { location_id: string }) => r.location_id);

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
    if (insertError) return fail("Impossibile assegnare le sedi");
  }

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("menu_locations")
      .delete()
      .eq("menu_id", menuId)
      .in("location_id", toDelete);
    if (deleteError) return fail("Impossibile rimuovere le sedi");
  }

  revalidatePath(PATHS.SETTINGS);
  return ok();
}
