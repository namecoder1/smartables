"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/supabase-helpers";
import { revalidatePath } from "next/cache";
import { ok, fail, type ActionResult } from "@/lib/action-response";
import { PATHS } from "@/lib/revalidation-paths";
import { getStr, getJson } from "@/lib/form-parsers";
import { checkResourceAvailability } from "@/lib/limiter";

export async function getLocations(organizationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching locations:", error);
    throw new Error("Failed to fetch locations");
  }

  return data;
}

export async function createLocation(
  organizationId: string,
  formData: FormData
) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const locAvail = await checkResourceAvailability(supabase, organizationId, "locations");
  if (!locAvail.allowed) return fail("Limite sedi raggiunto. Aggiorna il piano o acquista l'addon Sede Extra.");

  const name = getStr(formData, "name");
  const phone = getStr(formData, "phone");
  const address = getStr(formData, "address");
  const openingHours = getJson(formData, "openingHours", {});

  const slug =
    name
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "") + `-${Date.now().toString().slice(-4)}`;

  const { error } = await supabase.from("locations").insert({
    organization_id: organizationId,
    name,
    address,
    phone_number: phone,
    opening_hours: openingHours,
    slug,
  });

  if (error) {
    console.error("Error creating location:", error);
    return fail("Failed to create location");
  }

  revalidatePath(PATHS.GENERAL_SETTINGS, "page");
  return ok();
}

export async function updateLocation(locationId: string, formData: FormData) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const name = getStr(formData, "name");
  const address = getStr(formData, "address");
  const phone = getStr(formData, "phone");
  const openingHours = getJson(formData, "openingHours", {});

  const { error } = await supabase
    .from("locations")
    .update({
      name,
      address,
      opening_hours: openingHours,
      phone_number: phone,
    })
    .eq("id", locationId);

  if (error) {
    console.error("Error updating location:", error);
    return fail("Failed to update location");
  }

  revalidatePath(PATHS.GENERAL_SETTINGS, "page");
  return ok();
}

export async function deleteLocation(locationId: string): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const { error } = await supabase
    .from("locations")
    .delete()
    .eq("id", locationId);

  if (error) {
    console.error("Error deleting location:", error);
    return fail("Failed to delete location");
  }

  revalidatePath(PATHS.GENERAL_SETTINGS, "page");
  return ok();
}
