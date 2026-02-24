"use server";

import { createClient } from "@/utils/supabase/server";
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

  // 2. Handle deletions (Soft delete tables not in the current payload)
  const zoneIds = zones.map((z) => z.id);

  // Get all currently active tables for these zones
  const { data: existingTables } = await supabase
    .from("restaurant_tables")
    .select("id")
    .in("zone_id", zoneIds)
    .eq("is_active", true);

  if (existingTables) {
    // IDs present in the new payload
    const payloadIds = new Set(tables.map((t) => t.uniqueId || t.id));

    // Find tables that are in DB but not in payload
    const tablesToDelete = existingTables
      .filter((t) => !payloadIds.has(t.id))
      .map((t) => t.id);

    if (tablesToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("restaurant_tables")
        .update({ is_active: false })
        .in("id", tablesToDelete);

      if (deleteError) {
        console.error("Error soft-deleting tables:", deleteError);
        throw new Error("Failed to delete removed tables");
      }
    }
  }

  // 3. Upsert Tables
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
        width:
          t.type === "circle" ||
          t.type === "plant" ||
          (t.type === "column" && t.radius)
            ? t.radius
              ? t.radius * 2
              : t.width
            : t.width,
        height:
          t.type === "circle" ||
          t.type === "plant" ||
          (t.type === "column" && t.radius)
            ? t.radius
              ? t.radius * 2
              : t.height
            : t.height,
        // radius for circle not directly in schema props column?
        // Schema has width/height. We can store radius as width/2 or use specific column if added.
        // For now using width/height for both.
        is_active: true,
        min_capacity: t.seats > 0 ? (t.min_capacity ?? 1) : null,
        max_capacity: t.seats > 0 ? (t.max_capacity ?? t.seats) : null,
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

export async function getOrganizationZonesCount(organizationId: string) {
  const supabase = await createClient();

  // Get all locations for this organization
  const { data: locations, error: locError } = await supabase
    .from("locations")
    .select("id")
    .eq("organization_id", organizationId);

  if (locError) throw new Error(locError.message);

  if (!locations || locations.length === 0) return 0;

  const locationIds = locations.map((l) => l.id);

  // Count zones in these locations
  const { count, error: countError } = await supabase
    .from("restaurant_zones")
    .select("*", { count: "exact", head: true })
    .in("location_id", locationIds);

  if (countError) throw new Error(countError.message);

  return count || 0;
}
