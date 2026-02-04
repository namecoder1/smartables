"use server";

import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";

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
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const openingHoursRaw = formData.get("openingHours") as string;

  let openingHours = {};
  if (openingHoursRaw) {
    try {
      openingHours = JSON.parse(openingHoursRaw);
    } catch (e) {
      console.error("Failed to parse opening hours", e);
    }
  }

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
    return { error: "Failed to create location" };
  }

  revalidatePath("/(private)/(organization)/general-settings", "page");
  return { success: true };
}

export async function updateLocation(locationId: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const phone = formData.get("phone") as string;
  const openingHoursRaw = formData.get("openingHours") as string;

  let openingHours = {};
  if (openingHoursRaw) {
    try {
      openingHours = JSON.parse(openingHoursRaw);
    } catch (e) {
      console.error("Failed to parse opening hours", e);
    }
  }

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
    return { error: "Failed to update location" };
  }

  revalidatePath("/(private)/(organization)/general-settings", "page");
  return { success: true };
}

export async function deleteLocation(locationId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("locations")
    .delete()
    .eq("id", locationId);

  if (error) {
    console.error("Error deleting location:", error);
    return { error: "Failed to delete location" };
  }

  revalidatePath("/(private)/(organization)/general-settings", "page");
  return { success: true };
}
