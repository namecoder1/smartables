"use server";

import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";

export async function getFloorPlan(locationId: string) {
  const supabase = await createClient();

  // Fetch zones
  const { data: zones, error: zonesError } = await supabase
    .from("restaurant_zones")
    .select("*")
    .eq("location_id", locationId);

  if (zonesError) throw new Error(zonesError.message);

  // Fetch tables for these zones
  const zoneIds = zones.map((z) => z.id);
  let tables: any[] = [];

  if (zoneIds.length > 0) {
    const { data: tablesData, error: tablesError } = await supabase
      .from("restaurant_tables")
      .select("*")
      .in("zone_id", zoneIds)
      .eq("is_active", true);

    if (tablesError) throw new Error(tablesError.message);
    tables = tablesData;
  }

  return { zones, tables };
}

export async function saveFloorPlan(
  locationId: string,
  zones: any[],
  tables: any[],
) {
  const supabase = await createClient();

  // 1. Upsert Zones
  // For simplicity, we assume one zone "Main" for now if not specified,
  // but if the UI supports multiple zones, we handle them here.
  // We'll trust the checked-in zones.
  const { data: savedZones, error: zonesError } = await supabase
    .from("restaurant_zones")
    .upsert(
      zones.map((z) => ({
        id: z.id,
        location_id: locationId,
        name: z.name,
        width: z.width,
        height: z.height,
      })),
    )
    .select();

  if (zonesError) throw new Error(zonesError.message);

  // 2. Upsert Tables
  const { error: tablesError } = await supabase
    .from("restaurant_tables")
    .upsert(
      tables.map((t) => ({
        id: t.uniqueId || t.id, // handle both client-side uniqueId and db id
        zone_id: t.zone_id,
        table_number: t.label, // mapping label to table_number
        seats: t.seats,
        shape: t.type, // mapping type to shape
        position_x: t.x,
        position_y: t.y,
        rotation: t.rotation,
        width: t.width,
        height: t.height,
        // radius for circle not directly in schema props column?
        // Schema has width/height. We can store radius as width/2 or use specific column if added.
        // For now using width/height for both.
        is_active: true,
      })),
    );

  if (tablesError) throw new Error(tablesError.message);

  revalidatePath("/(private)/(platform)/settings/floor-plan");
  return { success: true };
}

export async function deleteFloorPlan(zoneId: any) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("restaurant_zones")
    .delete()
    .eq("id", zoneId);

  if (error) throw new Error(error.message);

  revalidatePath("/(private)/(platform)/settings/floor-plan");
  return { success: true };
}
