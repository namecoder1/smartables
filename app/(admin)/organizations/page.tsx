import { createAdminClient } from "@/utils/supabase/admin";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2, AlertTriangle, CheckCircle2, XCircle,
  TrendingDown, MessageSquare, Calendar, Users, ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

// ── Health score ─────────────────────────────────────────────────────────────

function computeHealthScore(params: {
  stripeStatus: string;
  hasVerifiedLocation: boolean;
  recentBookings: number;
  recentWaMessages: number;
  staffCount: number;
}): { score: number; label: string; color: string; bg: string } {
  let score = 0;
  if (params.stripeStatus === "active") score += 20;
  if (params.hasVerifiedLocation) score += 25;
  if (params.recentBookings > 0) score += 25;
  if (params.recentWaMessages > 0) score += 20;
  if (params.staffCount > 1) score += 10;

  if (score >= 80) return { score, label: "Ottimo", color: "text-green-700", bg: "bg-green-100" };
  if (score >= 60) return { score, label: "Buono", color: "text-blue-700", bg: "bg-blue-100" };
  if (score >= 40) return { score, label: "A rischio", color: "text-amber-700", bg: "bg-amber-100" };
  return { score, label: "Critico", color: "text-red-700", bg: "bg-red-100" };
}

const TIER_COLORS: Record<string, string> = {
  starter: "bg-gray-100 text-gray-700",
  growth: "bg-blue-100 text-blue-700",
  business: "bg-purple-100 text-purple-700",
};

const STRIPE_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: "Attivo", color: "text-green-600" },
  past_due: { label: "Scaduto", color: "text-red-600" },
  canceled: { label: "Cancellato", color: "text-gray-500" },
  trialing: { label: "Trial", color: "text-amber-600" },
  unpaid: { label: "Non pagato", color: "text-red-700" },
  incomplete: { label: "Incompleto", color: "text-orange-600" },
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function OrganizationsPage() {
  const supabase = createAdminClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: allOrgs },
    { data: allLocations },
    { data: allProfiles },
    { data: recentBookings },
    { data: recentWaMessages },
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, billing_tier, stripe_status, stripe_cancel_at_period_end, stripe_current_period_end, whatsapp_usage_count, usage_cap_whatsapp, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("locations")
      .select("id, organization_id, activation_status, telnyx_phone_number, meta_phone_id"),
    supabase
      .from("profiles")
      .select("organization_id"),
    supabase
      .from("bookings")
      .select("organization_id")
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("whatsapp_messages")
      .select("location_id")
      .gte("created_at", sevenDaysAgo),
  ]);

  // Build location → org map for WA messages
  const locationToOrg: Record<string, string> = {};
  (allLocations ?? []).forEach((l) => { locationToOrg[l.id] = l.organization_id; });

  // Group counts by org
  const bookingsByOrg: Record<string, number> = {};
  (recentBookings ?? []).forEach((b) => {
    bookingsByOrg[b.organization_id] = (bookingsByOrg[b.organization_id] ?? 0) + 1;
  });

  const waMsgByOrg: Record<string, number> = {};
  (recentWaMessages ?? []).forEach((m) => {
    const orgId = locationToOrg[m.location_id];
    if (orgId) waMsgByOrg[orgId] = (waMsgByOrg[orgId] ?? 0) + 1;
  });

  const staffByOrg: Record<string, number> = {};
  (allProfiles ?? []).forEach((p) => {
    staffByOrg[p.organization_id] = (staffByOrg[p.organization_id] ?? 0) + 1;
  });

  const locationsByOrg: Record<string, typeof allLocations> = {};
  (allLocations ?? []).forEach((l) => {
    if (!locationsByOrg[l.organization_id]) locationsByOrg[l.organization_id] = [];
    locationsByOrg[l.organization_id]!.push(l);
  });

  // Compute orgs with risk data
  const orgsWithHealth = (allOrgs ?? []).map((org) => {
    const locs = locationsByOrg[org.id] ?? [];
    const hasVerifiedLocation = locs.some((l) => l.activation_status === "verified");
    const health = computeHealthScore({
      stripeStatus: org.stripe_status ?? "",
      hasVerifiedLocation,
      recentBookings: bookingsByOrg[org.id] ?? 0,
      recentWaMessages: waMsgByOrg[org.id] ?? 0,
      staffCount: staffByOrg[org.id] ?? 0,
    });
    const waPercent = org.usage_cap_whatsapp
      ? Math.round((org.whatsapp_usage_count / org.usage_cap_whatsapp) * 100)
      : 0;
    return { ...org, health, locs, waPercent };
  });

  // Summary stats
  const criticalCount = orgsWithHealth.filter((o) => o.health.score < 40).length;
  const atRiskCount = orgsWithHealth.filter((o) => o.health.score >= 40 && o.health.score < 60).length;
  const dunningCount = orgsWithHealth.filter((o) => o.stripe_status === "past_due" || o.stripe_status === "unpaid").length;
  const churningCount = orgsWithHealth.filter((o) => o.stripe_cancel_at_period_end).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organizzazioni</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{allOrgs?.length ?? 0} totali</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Critici" value={criticalCount} color="text-red-600" bg="bg-red-50" icon={XCircle} />
        <SummaryCard label="A rischio" value={atRiskCount} color="text-amber-600" bg="bg-amber-50" icon={AlertTriangle} />
        <SummaryCard label="Dunning" value={dunningCount} color="text-orange-600" bg="bg-orange-50" icon={TrendingDown} />
        <SummaryCard label="Cancellano" value={churningCount} color="text-gray-600" bg="bg-gray-100" icon={XCircle} />
      </div>

      {/* Table */}
      <Card className="py-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Organizzazione</th>
                  <th className="text-center px-3 py-3 font-medium">Health</th>
                  <th className="text-center px-3 py-3 font-medium">Piano</th>
                  <th className="text-center px-3 py-3 font-medium">Stato</th>
                  <th className="text-center px-3 py-3 font-medium">Sedi</th>
                  <th className="text-center px-3 py-3 font-medium">Staff</th>
                  <th className="text-center px-3 py-3 font-medium">Booking 30d</th>
                  <th className="text-center px-3 py-3 font-medium">WA 7d</th>
                  <th className="text-center px-3 py-3 font-medium">WA%</th>
                  <th className="text-left px-4 py-3 font-medium">Creata</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {orgsWithHealth.map((org) => {
                  const stripeConf = STRIPE_STATUS_CONFIG[org.stripe_status ?? ""] ?? { label: org.stripe_status ?? "—", color: "text-muted-foreground" };
                  return (
                    <tr key={org.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{org.name}</div>
                        <div className="text-xs text-muted-foreground font-mono truncate max-w-36">{org.id}</div>
                        {org.stripe_cancel_at_period_end && (
                          <span className="text-[10px] text-red-600 font-medium">↓ Cancella a fine periodo</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${org.health.bg} ${org.health.color}`}>
                          {org.health.score}
                        </span>
                        <div className={`text-[10px] mt-0.5 ${org.health.color}`}>{org.health.label}</div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TIER_COLORS[org.billing_tier ?? ""] ?? "bg-gray-100 text-gray-600"}`}>
                          {org.billing_tier ?? "—"}
                        </span>
                      </td>
                      <td className={`px-3 py-3 text-center text-xs font-medium ${stripeConf.color}`}>
                        {stripeConf.label}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="tabular-nums">{org.locs.length}</span>
                        {org.locs.some((l) => l.activation_status === "verified") && (
                          <CheckCircle2 className="h-3 w-3 text-green-500 inline ml-1" />
                        )}
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums text-muted-foreground">
                        {staffByOrg[org.id] ?? 0}
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums">
                        <span className={(bookingsByOrg[org.id] ?? 0) === 0 ? "text-red-500" : "text-foreground"}>
                          {bookingsByOrg[org.id] ?? 0}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums">
                        <span className={(waMsgByOrg[org.id] ?? 0) === 0 ? "text-amber-500" : "text-foreground"}>
                          {waMsgByOrg[org.id] ?? 0}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-xs">
                        {org.usage_cap_whatsapp ? (
                          <span className={org.waPercent >= 90 ? "text-red-600 font-semibold" : org.waPercent >= 70 ? "text-amber-600" : "text-muted-foreground"}>
                            {org.waPercent}%
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(org.created_at), { addSuffix: true, locale: it })}
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/organizations/${org.id}`}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                        >
                          Dettagli <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label, value, color, bg, icon: Icon,
}: {
  label: string; value: number; color: string; bg: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className={`py-0 ${value > 0 ? "" : "opacity-70"}`}>
      <CardContent className={`p-4 flex items-center gap-3 ${bg} rounded-3xl`}>
        <Icon className={`h-5 w-5 ${color} shrink-0`} />
        <div>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
