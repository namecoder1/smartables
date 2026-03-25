import { createAdminClient } from "@/utils/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, CreditCard, AlertTriangle, XCircle, ArrowRight,
  TrendingDown, DollarSign, Users,
} from "lucide-react";
import Link from "next/link";
import { format, startOfMonth, subMonths } from "date-fns";
import { it } from "date-fns/locale";

const TIER_PRICES: Record<string, number> = { starter: 79, growth: 99, business: 199 };

function KpiCard({
  label, value, sub, icon: Icon, color = "text-foreground",
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ComponentType<{ className?: string }>; color?: string;
}) {
  return (
    <Card className="py-0">
      <CardContent className="p-5 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span className="text-xs">{label}</span>
        </div>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default async function RevenuePage() {
  const supabase = createAdminClient();

  const sixMonthsAgo = subMonths(new Date(), 6).toISOString();

  const [
    { data: allOrgs },
    { data: transactions },
    { data: failedTransactions },
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, billing_tier, stripe_status, stripe_cancel_at_period_end, stripe_current_period_end, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("transactions")
      .select("id, organization_id, amount, type, status, description, created_at, currency")
      .gte("created_at", sixMonthsAgo)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("transactions")
      .select("id, organization_id, amount, type, status, description, created_at")
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  // Fetch org names for failed transactions
  const failedOrgIds = [...new Set((failedTransactions ?? []).map((t) => t.organization_id))];
  const { data: failedOrgs } = failedOrgIds.length > 0
    ? await supabase.from("organizations").select("id, name, billing_tier, stripe_status").in("id", failedOrgIds)
    : { data: [] };
  const orgMap: Record<string, { name: string; billing_tier: string; stripe_status: string }> = {};
  (failedOrgs ?? []).forEach((o) => { orgMap[o.id] = o; });

  // --- MRR ---
  const activeOrgs = (allOrgs ?? []).filter((o) => o.stripe_status === "active");
  const mrr = activeOrgs.reduce((sum, o) => sum + (TIER_PRICES[o.billing_tier ?? ""] ?? 0), 0);
  const arr = mrr * 12;
  const canceledOrgs = (allOrgs ?? []).filter((o) => o.stripe_status === "canceled");
  const churningOrgs = (allOrgs ?? []).filter((o) => o.stripe_cancel_at_period_end);
  const dunningOrgs = (allOrgs ?? []).filter((o) => o.stripe_status === "past_due" || o.stripe_status === "unpaid");

  // Plan breakdown
  const planBreakdown = (["starter", "growth", "business"] as const).map((tier) => {
    const count = activeOrgs.filter((o) => o.billing_tier === tier).length;
    return { tier, count, revenue: count * (TIER_PRICES[tier] ?? 0) };
  });

  // Monthly revenue from transactions (last 6 months)
  const monthlyRevenue: Record<string, number> = {};
  (transactions ?? [])
    .filter((t) => t.type === "subscription" && t.status === "succeeded")
    .forEach((t) => {
      const month = format(new Date(t.created_at), "MMM yyyy", { locale: it });
      monthlyRevenue[month] = (monthlyRevenue[month] ?? 0) + Math.abs(t.amount);
    });

  const recentTransactions = (transactions ?? []).slice(0, 30);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Revenue</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Metriche finanziarie e pagamenti</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="MRR" value={`€${mrr.toLocaleString()}`} sub="piani attivi" icon={TrendingUp} color="text-green-700" />
        <KpiCard label="ARR" value={`€${arr.toLocaleString()}`} sub="annualizzato" icon={DollarSign} color="text-green-600" />
        <KpiCard label="Dunning" value={dunningOrgs.length} sub="pagamento scaduto" icon={AlertTriangle} color={dunningOrgs.length > 0 ? "text-red-600" : "text-muted-foreground"} />
        <KpiCard label="Cancellano" value={churningOrgs.length} sub="cancellazione attiva" icon={TrendingDown} color={churningOrgs.length > 0 ? "text-amber-600" : "text-muted-foreground"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Plan breakdown + dunning */}
        <div className="space-y-6">

          {/* Plan distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Distribuzione piani</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {planBreakdown.map(({ tier, count, revenue }) => {
                const pct = activeOrgs.length > 0 ? Math.round((count / activeOrgs.length) * 100) : 0;
                return (
                  <div key={tier} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize font-medium">{tier}</span>
                      <span className="text-muted-foreground">{count} org · <span className="text-green-700 font-semibold">€{revenue}/mese</span></span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${tier === "business" ? "bg-purple-500" : tier === "growth" ? "bg-blue-500" : "bg-gray-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-right text-muted-foreground">{pct}%</p>
                  </div>
                );
              })}
              <div className="pt-2 border-t text-sm flex justify-between">
                <span className="text-muted-foreground">Cancellate</span>
                <span className="font-medium">{canceledOrgs.length} org</span>
              </div>
            </CardContent>
          </Card>

          {/* Monthly revenue from DB */}
          {Object.keys(monthlyRevenue).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Revenue transazioni (6 mesi)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(monthlyRevenue).slice(0, 6).map(([month, amount]) => (
                  <div key={month} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{month}</span>
                    <span className="font-semibold text-green-700">€{amount.toFixed(0)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Center + Right: Dunning queue + transactions */}
        <div className="lg:col-span-2 space-y-6">

          {/* Dunning queue */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" /> Dunning Queue
                {dunningOrgs.length > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                    {dunningOrgs.length}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dunningOrgs.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">Nessun cliente in dunning</p>
              )}
              {dunningOrgs.length > 0 && (
                <div className="space-y-2">
                  {dunningOrgs.map((org) => (
                    <div key={org.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl">
                      <div>
                        <p className="font-medium text-sm">{org.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {org.billing_tier} · Fine periodo:{" "}
                          {org.stripe_current_period_end
                            ? format(new Date(org.stripe_current_period_end), "dd MMM yyyy", { locale: it })
                            : "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 text-xs">
                          {org.stripe_status}
                        </Badge>
                        <Link href={`/organizations/${org.id}`}>
                          <ArrowRight className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Churning orgs */}
          {churningOrgs.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-amber-500" /> In cancellazione ({churningOrgs.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {churningOrgs.map((org) => (
                  <div key={org.id} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <div>
                      <p className="font-medium text-sm">{org.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Scade il{" "}
                        {org.stripe_current_period_end
                          ? format(new Date(org.stripe_current_period_end), "dd MMM yyyy", { locale: it })
                          : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium capitalize text-amber-700">{org.billing_tier}</span>
                      <Link href={`/organizations/${org.id}`}>
                        <ArrowRight className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </Link>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Failed transactions */}
          {(failedTransactions ?? []).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" /> Transazioni fallite ({failedTransactions!.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(failedTransactions ?? []).map((tx) => {
                  const org = orgMap[tx.organization_id];
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl text-sm">
                      <div>
                        <p className="font-medium">{org?.name ?? "Org sconosciuta"}</p>
                        <p className="text-xs text-muted-foreground">
                          {tx.type} · {format(new Date(tx.created_at), "dd MMM HH:mm", { locale: it })}
                        </p>
                        {tx.description && <p className="text-xs text-muted-foreground truncate max-w-xs">{tx.description}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-red-700">€{Math.abs(tx.amount).toFixed(2)}</span>
                        {org && (
                          <Link href={`/organizations/${tx.organization_id}`}>
                            <ArrowRight className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Recent successful transactions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Transazioni recenti (6 mesi)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0">
                    <span className="text-muted-foreground tabular-nums">
                      {format(new Date(tx.created_at), "dd MMM HH:mm", { locale: it })}
                    </span>
                    <Badge variant="outline" className="text-[10px] capitalize">{tx.type}</Badge>
                    <span className="font-medium tabular-nums">
                      €{Math.abs(tx.amount).toFixed(2)}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      tx.status === "succeeded" ? "bg-green-100 text-green-700"
                      : tx.status === "failed" ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-600"
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
