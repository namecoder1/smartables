"use server";

import { createClient } from "@/utils/supabase/server";

export type FeatureStatus = {
  hasMenu: boolean;
  hasFloors: boolean;
  hasTables: boolean;
  hasTeam: boolean;
};

export async function getFeatureStatus(
  locationId: string,
  organizationId: string,
): Promise<FeatureStatus> {
  const supabase = await createClient();

  // 1. Check for Menus
  const { count: menuCount } = await supabase
    .from("menus")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  // 2. Check for Floors (Zones)
  const { count: floorCount } = await supabase
    .from("restaurant_zones")
    .select("*", { count: "exact", head: true })
    .eq("location_id", locationId);

  // 3. Check for Tables
  // We need to check if there are any tables in any of the zones of this location
  const { data: zones } = await supabase
    .from("restaurant_zones")
    .select("id")
    .eq("location_id", locationId);

  let tableCount = 0;
  if (zones && zones.length > 0) {
    const zoneIds = zones.map((z) => z.id);
    const { count } = await supabase
      .from("restaurant_tables")
      .select("*", { count: "exact", head: true })
      .in("zone_id", zoneIds);
    tableCount = count || 0;
  }

  // 4. Check for Team (more than one profile)
  const { count: profileCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  return {
    hasMenu: (menuCount || 0) > 0,
    hasFloors: (floorCount || 0) > 0,
    hasTables: tableCount > 0,
    hasTeam: (profileCount || 0) > 1,
  };
}
