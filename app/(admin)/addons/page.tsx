import { createAdminClient } from "@/utils/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ADDON_CATALOG, ADDON_COLOR_MAP } from "@/lib/addon-catalog";
import { ADDON_UNIT_VALUE, DEFAULT_ADDON_CONFIG } from "@/lib/addons";
import type { AddonConfig } from "@/lib/addons";
import {
  Package, TrendingUp, Users, Plug, CheckCircle2, XCircle,
} from "lucide-react";
import Link from "next/link";

// ── Tier limits (for usage calculation) ──────────────────────────────────────

const TIER_PLAN_LIMITS: Record<string, { staff: number; locations: number; storage_mb: number }> = {
  starter:  { staff: 5,     locations: 1,  storage_mb: 300  },
  growth:   { staff: 15,    locations: 3,  storage_mb: 1024 },
  business: { staff: 10000, locations: 10, storage_mb: 5120 },
};

const STRIPE_STATUS_COLOR: Record<string, string> = {
  active:     "bg-green-100 text-green-700",
  past_due:   "bg-red-100 text-red-700",
  unpaid:     "bg-red-100 text-red-700",
  canceled:   "bg-gray-100 text-gray-600",
  trialing:   "bg-amber-100 text-amber-700",
  incomplete: "bg-orange-100 text-orange-700",
};

// ── Types ─────────────────────────────────────────────────────────────────────

type OrgRow = {
  id: string;
  name: string;
  slug: string | null;
  billing_tier: string;
  stripe_status: string | null;
  addons_config: AddonConfig;
  whatsapp_usage_count: number;
  usage_cap_whatsapp: number;
  total_storage_used: number;
  location_count: number;
  staff_count: number;
  thefork_connected: boolean;
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AddonsPage() {
  const supabase = createAdminClient();

  const [
    { data: rawOrgs },
    { data: locationRows },
    { data: staffRows },
    { data: theforkLocations },
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, slug, billing_tier, stripe_status, addons_config, whatsapp_usage_count, usage_cap_whatsapp, total_storage_used")
      .not("stripe_status", "is", null)
      .order("name"),
    supabase
      .from("locations")
      .select("organization_id"),
    supabase
      .from("profiles")
      .select("organization_id"),
    supabase
      .from("locations")
      .select("organization_id")
      .not("thefork_restaurant_id", "is", null),
  ]);

  // Build per-org location/staff/thefork counts
  const locationCountMap: Record<string, number> = {};
  for (const l of locationRows ?? []) {
    locationCountMap[l.organization_id] = (locationCountMap[l.organization_id] ?? 0) + 1;
  }
  const staffCountMap: Record<string, number> = {};
  for (const s of staffRows ?? []) {
    staffCountMap[s.organization_id] = (staffCountMap[s.organization_id] ?? 0) + 1;
  }
  const theforkOrgSet = new Set<string>((theforkLocations ?? []).map((l) => l.organization_id));

  const orgs: OrgRow[] = (rawOrgs ?? []).map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    billing_tier: o.billing_tier ?? "starter",
    stripe_status: o.stripe_status,
    addons_config: { ...DEFAULT_ADDON_CONFIG, ...(o.addons_config ?? {}) } as AddonConfig,
    whatsapp_usage_count: o.whatsapp_usage_count ?? 0,
    usage_cap_whatsapp: o.usage_cap_whatsapp ?? 400,
    total_storage_used: o.total_storage_used ?? 0,
    location_count: locationCountMap[o.id] ?? 0,
    staff_count: staffCountMap[o.id] ?? 0,
    thefork_connected: theforkOrgSet.has(o.id),
  }));

  // ── Aggregate addon stats ──────────────────────────────────────────────────

  type AddonOrgEntry = OrgRow & { units: number; usageLabel: string };

  const addonStats = ADDON_CATALOG.map((entry) => {
    const key = entry.key as keyof AddonConfig;
    const unitValue = ADDON_UNIT_VALUE[key];

    const purchasedOrgs: AddonOrgEntry[] = orgs
      .filter((o) => (o.addons_config[key] ?? 0) > 0)
      .map((o) => {
        const raw = o.addons_config[key] ?? 0;
        const units = Math.round(raw / unitValue);

        // Usage label per addon type
        let usageLabel = "";
        const tier = TIER_PLAN_LIMITS[o.billing_tier] ?? TIER_PLAN_LIMITS.starter;
        if (key === "extra_staff") {
          usageLabel = `${o.staff_count} / ${tier.staff + raw} staff`;
        } else if (key === "extra_contacts_wa") {
          const pct = o.usage_cap_whatsapp > 0 ? Math.round((o.whatsapp_usage_count / o.usage_cap_whatsapp) * 100) : 0;
          usageLabel = `WA ${pct}% usato`;
        } else if (key === "extra_storage_mb") {
          const totalMb = tier.storage_mb + raw;
          const usedMb = Math.round(o.total_storage_used / 1024 / 1024);
          usageLabel = `${usedMb} / ${totalMb} MB`;
        } else if (key === "extra_locations") {
          usageLabel = `${o.location_count} / ${tier.locations + raw} sedi`;
        } else if (key === "extra_analytics") {
          usageLabel = "Analytics Pro attivo";
        } else if (key === "extra_connections") {
          usageLabel = o.thefork_connected ? "TheFork connesso ✓" : "Non ancora connesso";
        }

        return { ...o, units, usageLabel };
      });

    const totalUnits = purchasedOrgs.reduce((s, o) => s + o.units, 0);
    const mrr = parseFloat((totalUnits * entry.priceMonth).toFixed(2));

    return { entry, purchasedOrgs, totalUnits, mrr };
  });

  const totalAddonMrr = addonStats.reduce((s, a) => s + a.mrr, 0);
  const totalAddonOrgs = new Set(
    addonStats.flatMap((a) => a.purchasedOrgs.map((o) => o.id))
  ).size;
  const topAddon = [...addonStats].sort((a, b) => b.purchasedOrgs.length - a.purchasedOrgs.length)[0];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Addon Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Adozione, revenue e utilizzo degli addon per organizzazione.
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="py-4 gap-0">
          <CardContent className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <TrendingUp className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Addon MRR totale</p>
              <p className="text-2xl font-bold">€{totalAddonMrr.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4 gap-0">
          <CardContent className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <Users className="size-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Organizzazioni con addon</p>
              <p className="text-2xl font-bold">{totalAddonOrgs}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4 gap-0">
          <CardContent className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Package className="size-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Addon più diffuso</p>
              <p className="text-lg font-bold leading-tight">{topAddon?.entry.name ?? "—"}</p>
              <p className="text-xs text-muted-foreground">
                {topAddon?.purchasedOrgs.length ?? 0} orgs
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-addon cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {addonStats.map(({ entry, purchasedOrgs, totalUnits, mrr }) => {
          const colors = ADDON_COLOR_MAP[entry.color] ?? ADDON_COLOR_MAP.blue;
          const Icon = entry.icon;

          return (
            <Card key={entry.key} className="overflow-hidden py-0 gap-0">
              <CardHeader className={`${colors.bg} border-b ${colors.border} py-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white/70 border-2 ${colors.border}`}>
                      <Icon className={`size-5 ${colors.text}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {entry.name}
                        {entry.starterOnly && (
                          <Badge variant="outline" className="text-xs font-normal">
                            Solo Starter
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {entry.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold">€{entry.priceMonth}/mese</p>
                    <p className="text-xs text-muted-foreground">per unità</p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex gap-6 mt-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Orgs: </span>
                    <span className="font-semibold">{purchasedOrgs.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Unità tot.: </span>
                    <span className="font-semibold">{totalUnits}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">MRR: </span>
                    <span className="font-semibold text-green-700">€{mrr.toFixed(2)}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {purchasedOrgs.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-4 py-8 text-center">
                    Nessuna organizzazione ha acquistato questo addon.
                  </p>
                ) : (
                  <div className="divide-y">
                    {purchasedOrgs.map((org) => {
                      const statusCfg = STRIPE_STATUS_COLOR[org.stripe_status ?? ""] ?? "bg-gray-100 text-gray-600";
                      const isConnectionsAddon = entry.key === "extra_connections";
                      return (
                        <div key={org.id} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            {isConnectionsAddon && (
                              org.thefork_connected
                                ? <CheckCircle2 className="size-3.5 text-green-600 shrink-0" />
                                : <XCircle className="size-3.5 text-amber-500 shrink-0" />
                            )}
                            <Link
                              href={`/organizations/${org.id}`}
                              className="font-medium hover:underline truncate"
                            >
                              {org.name}
                            </Link>
                            <Badge variant="outline" className="capitalize text-xs shrink-0">
                              {org.billing_tier}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-muted-foreground">{org.usageLabel}</span>
                            <span className="text-xs font-medium tabular-nums">
                              ×{org.units}
                            </span>
                            <Badge className={`text-xs ${statusCfg}`}>
                              {org.stripe_status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Glitchtip + Trigger.dev callouts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <Card className="border-amber-200 bg-amber-50 py-4">
          <CardContent className="flex gap-3 items-start text-sm">
            <Plug className="size-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="font-semibold text-amber-800">GlitchTip non integrato nell'admin</p>
              <p className="text-amber-700 text-xs mt-1">
                GlitchTip è configurato nel progetto ma gli errori critici non sono visibili qui.
                Aggiungi un widget o collega la GlitchTip Issues API per vedere i crash in tempo reale.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50 py-4">
          <CardContent className="flex gap-3 items-start text-sm">
            <Plug className="size-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="font-semibold text-blue-800">Trigger.dev job monitor non integrato</p>
              <p className="text-blue-700 text-xs mt-1">
                I background job (booking verify, auto-reply, review request) non hanno
                visibilità in questo panel. Considera di aggiungere una vista runs/failures.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
