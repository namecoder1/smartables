import { createAdminClient } from "@/utils/supabase/admin";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2, Users, CreditCard, MessageSquare, HardDrive,
  Calendar, CheckCircle2, XCircle, AlertTriangle, Phone,
  BadgeCheck, Clock, ArrowLeft, RotateCcw, Zap,
} from "lucide-react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { adminResetWhatsappUsage, adminSetBillingTier } from "@/app/actions/admin-orgs";
import { deleteLocationAction, syncTelnyxStatus } from "@/app/actions/admin-automation";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TIER_PRICES: Record<string, number> = { starter: 79, growth: 99, business: 199 };

const STRIPE_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Attivo", color: "text-green-700", bg: "bg-green-100" },
  past_due: { label: "Scaduto", color: "text-red-700", bg: "bg-red-100" },
  canceled: { label: "Cancellato", color: "text-gray-600", bg: "bg-gray-100" },
  trialing: { label: "Trial", color: "text-amber-700", bg: "bg-amber-100" },
  unpaid: { label: "Non pagato", color: "text-red-700", bg: "bg-red-100" },
  incomplete: { label: "Incompleto", color: "text-orange-700", bg: "bg-orange-100" },
};

function UsageBar({ label, current, limit, unit = "" }: { label: string; current: number; limit: number; unit?: string }) {
  const pct = limit > 0 ? Math.min(100, Math.round((current / limit) * 100)) : 0;
  const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-400" : "bg-blue-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {current}{unit} / {limit}{unit}
          <span className={`ml-1.5 ${pct >= 90 ? "text-red-600" : "text-muted-foreground"}`}>({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function OrgDrilldownPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [
    { data: org },
    { data: locations },
    { data: profiles },
    { data: transactions },
    { data: plan },
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("*")
      .eq("id", id)
      .single(),
    supabase
      .from("locations")
      .select("*")
      .eq("organization_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at, accessible_locations")
      .eq("organization_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("transactions")
      .select("id, amount, type, status, description, created_at, currency")
      .eq("organization_id", id)
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("subscription_plans")
      .select("limits, name")
      .eq("stripe_price_id", (await supabase.from("organizations").select("stripe_price_id").eq("id", id).single()).data?.stripe_price_id ?? "")
      .maybeSingle(),
  ]);

  if (!org) notFound();

  const limits = (plan?.limits ?? {}) as Record<string, number>;
  const addons = org.addons_config ?? {};

  // Usage calculations
  const { count: staffCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", id);

  const cycleStart = org.current_billing_cycle_start;
  let bookingQuery = supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", id);
  if (cycleStart) bookingQuery = bookingQuery.gte("created_at", cycleStart);
  const { count: bookingCount } = await bookingQuery;

  const storageLimitBytes = ((limits.storage_mb ?? 300) + (addons.extra_storage_mb ?? 0)) * 1024 * 1024;
  const storageMbUsed = Math.round((org.total_storage_used ?? 0) / (1024 * 1024));
  const storageMbLimit = Math.round(storageLimitBytes / (1024 * 1024));

  const stripeConf = STRIPE_STATUS_CONFIG[org.stripe_status ?? ""] ?? { label: org.stripe_status ?? "—", color: "text-gray-600", bg: "bg-gray-100" };
  const monthlyValue = TIER_PRICES[org.billing_tier ?? ""] ?? 0;

  const failedTransactions = (transactions ?? []).filter((t) => t.status === "failed");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/organizations" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{org.name}</h1>
            <p className="text-xs text-muted-foreground font-mono">{org.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${stripeConf.bg} ${stripeConf.color}`}>
            {stripeConf.label}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize
            ${org.billing_tier === "business" ? "bg-purple-100 text-purple-700"
            : org.billing_tier === "growth" ? "bg-blue-100 text-blue-700"
            : "bg-gray-100 text-gray-700"}`}
          >
            {org.billing_tier ?? "—"}
          </span>
        </div>
      </div>

      {/* Risk alerts */}
      {(org.stripe_status === "past_due" || org.stripe_status === "unpaid" || org.stripe_cancel_at_period_end || failedTransactions.length > 0) && (
        <div className="space-y-2">
          {(org.stripe_status === "past_due" || org.stripe_status === "unpaid") && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Pagamento scaduto — cliente in dunning. Verificare su Stripe.
            </div>
          )}
          {org.stripe_cancel_at_period_end && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Il cliente ha cancellato — il piano scade il{" "}
              {org.stripe_current_period_end
                ? format(new Date(org.stripe_current_period_end), "dd MMM yyyy", { locale: it })
                : "—"}
            </div>
          )}
          {failedTransactions.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {failedTransactions.length} transazione/i fallita/e negli ultimi record
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Billing info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Fatturazione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <span className="text-muted-foreground">Email fatturazione</span>
                <span className="font-medium">{org.billing_email ?? "—"}</span>
                <span className="text-muted-foreground">Stripe Customer ID</span>
                <span className="font-mono text-xs truncate">{org.stripe_customer_id ?? "—"}</span>
                <span className="text-muted-foreground">Subscription ID</span>
                <span className="font-mono text-xs truncate">{org.stripe_subscription_id ?? "—"}</span>
                <span className="text-muted-foreground">Fine periodo</span>
                <span className="font-medium">
                  {org.stripe_current_period_end
                    ? format(new Date(org.stripe_current_period_end), "dd MMM yyyy", { locale: it })
                    : "—"}
                </span>
                <span className="text-muted-foreground">Valore mensile</span>
                <span className="font-bold text-green-700">€{monthlyValue}/mese</span>
                <span className="text-muted-foreground">Ciclo iniziato</span>
                <span>{org.current_billing_cycle_start
                  ? format(new Date(org.current_billing_cycle_start), "dd MMM yyyy", { locale: it })
                  : "—"}</span>
              </div>

              {/* Plan override */}
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Override piano (solo DB — non Stripe)</p>
                <div className="flex gap-2">
                  {(["starter", "growth", "business"] as const).map((tier) => (
                    <form key={tier} action={async () => {
                      "use server";
                      await adminSetBillingTier(id, tier);
                    }}>
                      <Button
                        size="sm"
                        variant={org.billing_tier === tier ? "default" : "outline"}
                        className="h-7 text-xs capitalize"
                      >
                        {tier}
                      </Button>
                    </form>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage bars */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <HardDrive className="h-4 w-4" /> Utilizzo risorse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <UsageBar
                label="Prenotazioni (ciclo corrente)"
                current={bookingCount ?? 0}
                limit={(limits.max_bookings ?? 300) + (addons.extra_bookings ?? 0)}
              />
              <UsageBar
                label="Contatti WhatsApp (mensile)"
                current={org.whatsapp_usage_count ?? 0}
                limit={org.usage_cap_whatsapp ?? 400}
              />
              <UsageBar
                label="Staff"
                current={staffCount ?? 0}
                limit={(limits.max_staff ?? 5) + (addons.extra_staff ?? 0)}
              />
              <UsageBar
                label="Sedi"
                current={locations?.length ?? 0}
                limit={(limits.max_locations ?? 1) + (addons.extra_locations ?? 0)}
              />
              <UsageBar
                label="Storage"
                current={storageMbUsed}
                limit={storageMbLimit}
                unit=" MB"
              />

              {/* Reset WA usage */}
              <div className="pt-2 border-t">
                <form action={async () => {
                  "use server";
                  await adminResetWhatsappUsage(id);
                }}>
                  <Button size="sm" variant="outline" className="h-7 text-xs text-amber-700 border-amber-200 hover:bg-amber-50">
                    <RotateCcw className="h-3 w-3 mr-1" /> Reset contatore WhatsApp
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Locations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Sedi ({locations?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(locations ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">Nessuna sede creata</p>
              )}
              {(locations ?? []).map((loc) => (
                <div key={loc.id} className="border rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{loc.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{loc.id}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={loc.activation_status === "verified"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-amber-100 text-amber-700 border-amber-200"}
                    >
                      {loc.activation_status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className={loc.telnyx_phone_number ? "text-foreground" : "text-muted-foreground"}>
                        {loc.telnyx_phone_number ?? "No Telnyx"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                      {loc.meta_phone_id
                        ? <BadgeCheck className="h-3.5 w-3.5 text-green-600" />
                        : <span className="text-muted-foreground">No Meta</span>}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <span>Reg: {loc.regulatory_status ?? "—"}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <form action={async () => {
                      "use server";
                      await syncTelnyxStatus(loc.id);
                    }}>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] text-blue-700 border-blue-200 hover:bg-blue-50">
                        <RotateCcw className="h-2.5 w-2.5 mr-1" /> Sync Telnyx
                      </Button>
                    </form>
                    <form action={async () => {
                      "use server";
                      await deleteLocationAction(loc.id);
                    }}>
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] text-red-600 hover:bg-red-50">
                        Elimina sede
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Org meta */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Dettagli</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slug</span>
                <span className="font-mono text-xs">{org.slug}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creata</span>
                <span>{format(new Date(org.created_at), "dd MMM yyyy", { locale: it })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telnyx Acc.</span>
                <span className="font-mono text-xs truncate max-w-28">{org.telnyx_managed_account_id ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Addons</span>
                <span className="text-xs">
                  {addons.extra_staff ? `+${addons.extra_staff} staff` : ""}
                  {addons.extra_contacts_wa ? ` +${addons.extra_contacts_wa} WA` : ""}
                  {addons.extra_storage_mb ? ` +${addons.extra_storage_mb}MB` : ""}
                  {!addons.extra_staff && !addons.extra_contacts_wa && !addons.extra_storage_mb ? "Nessuno" : ""}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Staff */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" /> Staff ({profiles?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(profiles ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">Nessun profilo</p>
              )}
              {(profiles ?? []).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-medium">{p.full_name ?? p.email}</p>
                    <p className="text-muted-foreground">{p.email}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">{p.role}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Transactions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Ultime transazioni
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(transactions ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">Nessuna transazione</p>
              )}
              {(transactions ?? []).map((tx) => (
                <div key={tx.id} className={`flex items-start justify-between text-xs p-2 rounded-lg ${tx.status === "failed" ? "bg-red-50 border border-red-100" : "bg-muted/30"}`}>
                  <div>
                    <p className="font-medium capitalize">{tx.type}</p>
                    <p className="text-muted-foreground">{format(new Date(tx.created_at), "dd MMM HH:mm", { locale: it })}</p>
                    {tx.description && <p className="text-muted-foreground truncate max-w-32">{tx.description}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold">€{Math.abs(tx.amount).toFixed(2)}</p>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${tx.status === "succeeded" ? "bg-green-100 text-green-700" : tx.status === "failed" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
