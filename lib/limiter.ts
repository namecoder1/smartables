/**
 * Gatekeeper — centralized resource availability checks.
 *
 * Formula: TotalLimit = PlanLimit + AddonCapacity
 *
 * Usage:
 *   const avail = await checkResourceAvailability(supabase, orgId, "staff");
 *   if (!avail.allowed) return fail("Limite account staff raggiunto");
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { AddonConfig, BASE_KB_CHARS_BY_TIER, DEFAULT_ADDON_CONFIG, DEFAULT_BASE_KB_CHARS } from "./addons";

export type ResourceType =
  | "staff"
  | "contacts_wa"
  | "storage"
  | "locations"
  | "menus"
  | "zones"
  | "bookings"
  | "kb_chars"
  | "analytics";

export type ResourceAvailability = {
  allowed: boolean;
  current: number;
  /** Base limit in natural units (bytes for storage, counts for others) */
  limit: number;
  remaining: number;
  /** Storage only: true when usage ≥ 100% of limit (soft-cap warning) */
  softCapWarning?: boolean;
};

/**
 * Check whether an organization can create one more unit of a resource.
 */
export async function checkResourceAvailability(
  supabase: SupabaseClient,
  orgId: string,
  type: ResourceType,
): Promise<ResourceAvailability> {
  // Fetch org fields needed for limit computation
  const { data: org } = await supabase
    .from("organizations")
    .select(
      "stripe_price_id, billing_tier, addons_config, total_storage_used, usage_cap_whatsapp, whatsapp_usage_count, current_billing_cycle_start",
    )
    .eq("id", orgId)
    .single();

  if (!org) return notAllowed();

  const addons: AddonConfig = {
    ...DEFAULT_ADDON_CONFIG,
    ...(org.addons_config ?? {}),
  };

  // Fetch plan limits
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("limits")
    .eq("stripe_price_id", org.stripe_price_id)
    .single();

  const limits: Record<string, number | string> = plan?.limits ?? {};

  switch (type) {
    case "staff": {
      const planLimit = (limits.max_staff as number) ?? 5;
      const limit = planLimit + addons.extra_staff;
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId);
      return build(count ?? 0, limit);
    }

    case "locations": {
      const planLimit = (limits.max_locations as number) ?? 1;
      const limit = planLimit + addons.extra_locations;
      const { count } = await supabase
        .from("locations")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId);
      return build(count ?? 0, limit);
    }

    case "menus": {
      const limit = (limits.max_menus as number) ?? 5;
      const { count } = await supabase
        .from("menus")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId);
      return build(count ?? 0, limit);
    }

    case "zones": {
      const limit = (limits.max_zones as number) ?? 3;
      // Count zones across all locations of this org
      const { data: locationIds } = await supabase
        .from("locations")
        .select("id")
        .eq("organization_id", orgId);
      const ids = (locationIds ?? []).map((l) => l.id);
      if (ids.length === 0) return build(0, limit);
      const { count } = await supabase
        .from("restaurant_zones")
        .select("id", { count: "exact", head: true })
        .in("location_id", ids);
      return build(count ?? 0, limit);
    }

    case "contacts_wa": {
      // usage_cap_whatsapp is already the effective cap (base plan + addon extra),
      // kept in sync by the Stripe webhook on every subscription update.
      const limit: number = org.usage_cap_whatsapp ?? 400;
      const current: number = org.whatsapp_usage_count ?? 0;
      return build(current, limit);
    }

    case "bookings": {
      const limit = (limits.max_bookings as number) ?? 300;
      // Count bookings in the current billing cycle only
      const cycleStart: string | null = org.current_billing_cycle_start;
      let query = supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId);
      if (cycleStart) query = query.gte("created_at", cycleStart);
      const { count } = await query;
      return build(count ?? 0, limit);
    }

    case "storage": {
      const planStorageMb = (limits.storage_mb as number) ?? 300;
      const totalLimitMb = planStorageMb + addons.extra_storage_mb;
      const totalLimitBytes = totalLimitMb * 1024 * 1024;
      // Hard cap at 110% of the limit
      const hardCapBytes = Math.floor(totalLimitBytes * 1.1);
      const current: number = org.total_storage_used ?? 0;
      const softCapWarning = current >= totalLimitBytes;
      const allowed = current < hardCapBytes;
      return {
        allowed,
        current,
        limit: totalLimitBytes,
        remaining: Math.max(0, hardCapBytes - current),
        softCapWarning,
      };
    }

    case "kb_chars": {
      const tier: string = (org as any).billing_tier ?? "starter";
      const baseChars = BASE_KB_CHARS_BY_TIER[tier] ?? DEFAULT_BASE_KB_CHARS;
      const limit = baseChars + addons.extra_kb_chars;
      // Sum title + content lengths across all KB entries for this org
      const { data: entries } = await supabase
        .from("knowledge_base")
        .select("title, content")
        .eq("organization_id", orgId);
      const current = (entries ?? []).reduce(
        (sum, e) => sum + (e.title?.length ?? 0) + (e.content?.length ?? 0),
        0,
      );
      return build(current, limit);
    }

    case "analytics": {
      const tier: string = (org as any).billing_tier ?? "starter";
      const hasAddon = addons.extra_analytics > 0;
      const allowed = tier === "growth" || tier === "business" || hasAddon;
      return { allowed, current: hasAddon ? 1 : 0, limit: 1, remaining: allowed ? 1 : 0 };
    }

    default:
      return { allowed: true, current: 0, limit: 0, remaining: 0 };
  }
}

function build(current: number, limit: number): ResourceAvailability {
  return {
    allowed: current < limit,
    current,
    limit,
    remaining: Math.max(0, limit - current),
  };
}

function notAllowed(): ResourceAvailability {
  return { allowed: false, current: 0, limit: 0, remaining: 0 };
}
