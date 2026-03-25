import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle, XCircle, FileText, RotateCcw, BadgeCheck,
  Phone, RefreshCw, Users, Building2, TrendingUp, AlertTriangle,
  Lightbulb, Bug, MessageCircle, Heart, Clock, ArrowRight, Zap,
  MessageSquare, Activity, CreditCard, TrendingDown,
} from "lucide-react";
import Link from "next/link";
import {
  approveComplianceRequest,
  rejectComplianceRequest,
  resetComplianceStatusAction,
} from "@/app/actions/admin-compliance";
import {
  manualPurchaseNumber,
  manualMetaRegistration,
  manualVoiceVerification,
  syncTelnyxStatus,
  deleteLocationAction,
} from "@/app/actions/admin-automation";
import {
  simulateTelnyxApproval,
  simulateIncomingCall,
  simulateRecordingSaved,
} from "@/app/actions/admin-simulation";
import { adminUpdateFeedback, adminDeleteFeedback } from "@/app/actions/user-feedback";
import { format, formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import type { UserFeedback, UserFeedbackStatus, UserFeedbackPriority } from "@/types/general";

// ── Constants ────────────────────────────────────────────────────────────────

const FEEDBACK_TYPE_CONFIG = {
  feature_request: { label: "Feature", icon: Lightbulb, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  bug_report:      { label: "Bug",     icon: Bug,       color: "text-red-600",   bg: "bg-red-50 border-red-200" },
  general:         { label: "Generale",icon: MessageCircle, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  praise:          { label: "Elogio",  icon: Heart,     color: "text-pink-600",  bg: "bg-pink-50 border-pink-200" },
} as const;

const FEEDBACK_STATUS_CONFIG: Record<UserFeedbackStatus, { label: string; color: string }> = {
  open:        { label: "Aperto",       color: "bg-gray-100 text-gray-700" },
  reviewing:   { label: "In revisione", color: "bg-blue-100 text-blue-700" },
  planned:     { label: "Pianificato",  color: "bg-purple-100 text-purple-700" },
  in_progress: { label: "In corso",     color: "bg-amber-100 text-amber-700" },
  done:        { label: "Completato",   color: "bg-green-100 text-green-700" },
  wont_fix:    { label: "Non previsto", color: "bg-red-100 text-red-700" },
};

const PRIORITY_CONFIG: Record<UserFeedbackPriority, { label: string; color: string }> = {
  low:      { label: "Bassa",    color: "bg-gray-100 text-gray-600" },
  medium:   { label: "Media",    color: "bg-blue-100 text-blue-600" },
  high:     { label: "Alta",     color: "bg-orange-100 text-orange-600" },
  critical: { label: "Critica",  color: "bg-red-100 text-red-700" },
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const supabase = createAdminClient();
  const supabaseAuth = await createClient();

  // ── Parallel data fetching ───────────────────────────────────────────────
  const [
    { data: allOrgs },
    { data: allLocations },
    { data: feedbackList },
    { data: pendingCompliance },
    { data: recentTransactions },
    { data: dunningOrgs },
  ] = await Promise.all([
    supabase.from("organizations").select("id, name, stripe_status, billing_tier, whatsapp_usage_count, usage_cap_whatsapp, created_at").order("created_at", { ascending: false }),
    supabase.from("locations").select("*, organization:organization_id(name)").order("created_at", { ascending: false }).not("regulatory_status", "is", null).limit(30),
    supabase.from("user_feedback").select("*, organization:organization_id(name), profile:profile_id(full_name, email)").order("created_at", { ascending: false }).limit(100),
    supabase.from("locations").select("*, organization:organization_id(name)").eq("regulatory_status", "pending_review").order("created_at", { ascending: false }),
    supabase.from("transactions").select("id, amount, type, status, created_at").order("created_at", { ascending: false }).limit(10),
    supabase.from("organizations").select("id, name, billing_tier, stripe_status, stripe_current_period_end").in("stripe_status", ["past_due", "unpaid"]),
  ]);

  // ── Business KPIs ────────────────────────────────────────────────────────
  const activeOrgs   = allOrgs?.filter((o) => o.stripe_status === "active") ?? [];
  const canceledOrgs = allOrgs?.filter((o) => o.stripe_status === "canceled") ?? [];
  const thisMonth    = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const newThisMonth = allOrgs?.filter((o) => new Date(o.created_at) >= thisMonth) ?? [];
  const mrrEstimate  = activeOrgs.reduce((sum, o) => {
    const tier = o.billing_tier;
    return sum + (tier === "starter" ? 79 : tier === "growth" ? 99 : tier === "business" ? 199 : 0);
  }, 0);

  // ── Onboarding funnel ────────────────────────────────────────────────────
  const funnelSteps = [
    { label: "Registrati senza piano",    count: allOrgs?.filter((o) => !o.stripe_status).length ?? 0,         color: "bg-gray-300" },
    { label: "Piano attivo",              count: activeOrgs.length,                                              color: "bg-blue-400" },
    { label: "Compliance pending review", count: pendingCompliance?.length ?? 0,                                 color: "bg-amber-400" },
    { label: "Completamente attivi",      count: allLocations?.filter((l) => l.activation_status === "verified").length ?? 0, color: "bg-green-500" },
  ];

  // ── Enhance compliance with signed URLs ─────────────────────────────────
  const requestsWithUrls = await Promise.all(
    (pendingCompliance || []).map(async (req) => {
      const docsData = req.regulatory_documents_data as Record<string, string> | null;
      const [identityRes, addressRes] = await Promise.all([
        docsData?.identity_path
          ? supabaseAuth.storage.from("compliance-docs").createSignedUrl(docsData.identity_path, 3600)
          : Promise.resolve({ data: null }),
        docsData?.address_path
          ? supabaseAuth.storage.from("compliance-docs").createSignedUrl(docsData.address_path, 3600)
          : Promise.resolve({ data: null }),
      ]);
      return {
        ...req,
        identityUrl: identityRes.data?.signedUrl ?? null,
        addressUrl: addressRes.data?.signedUrl ?? null,
        documents_data: docsData,
      };
    })
  );

  // ── Alert generation ─────────────────────────────────────────────────────
  const alerts: { type: "warning" | "error" | "info"; message: string }[] = [];
  if ((pendingCompliance?.length ?? 0) > 0) {
    alerts.push({ type: "warning", message: `${pendingCompliance!.length} richiesta/e compliance in attesa di revisione` });
  }
  const waHeavyUsers = allOrgs?.filter((o) => o.whatsapp_usage_count >= o.usage_cap_whatsapp * 0.9) ?? [];
  if (waHeavyUsers.length > 0) {
    alerts.push({ type: "warning", message: `${waHeavyUsers.length} org. vicina/e al limite WhatsApp (>90%)` });
  }
  const openBugs = feedbackList?.filter((f) => f.type === "bug_report" && f.status === "open") ?? [];
  if (openBugs.length > 0) {
    alerts.push({ type: "error", message: `${openBugs.length} bug report aperti senza risposta` });
  }
  if ((dunningOrgs?.length ?? 0) > 0) {
    alerts.push({ type: "error", message: `${dunningOrgs!.length} cliente/i in dunning (pagamento scaduto) — verificare su Stripe` });
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Controllo operativo Smartables</p>
      </div>

      {/* Alerts bar */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
                alert.type === "error"
                  ? "bg-red-50 border-red-200 text-red-700"
                  : alert.type === "warning"
                  ? "bg-amber-50 border-amber-200 text-amber-700"
                  : "bg-blue-50 border-blue-200 text-blue-700"
              }`}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {alert.message}
            </div>
          ))}
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-4 h-14! w-full max-w-lg">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compliance">
            Compliance
            {(pendingCompliance?.length ?? 0) > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {pendingCompliance!.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="feedback">
            Feedback
            {openBugs.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {openBugs.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="locations">Sedi</TabsTrigger>
        </TabsList>

        {/* ══ TAB 1: OVERVIEW ══════════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard icon={CreditCard} label="MRR stimato" value={`€${mrrEstimate}`} sub="piani attivi" color="text-green-600" />
            <KpiCard icon={Building2} label="Org. attive" value={activeOrgs.length} sub={`${canceledOrgs.length} cancellate`} color="text-blue-600" />
            <KpiCard icon={Users}     label="Nuove questo mese" value={newThisMonth.length} sub="registrazioni" color="text-purple-600" />
            <KpiCard icon={TrendingDown} label="Dunning" value={dunningOrgs?.length ?? 0} sub="pagamento scaduto" color={(dunningOrgs?.length ?? 0) > 0 ? "text-red-600" : "text-muted-foreground"} />
          </div>

          {/* Onboarding funnel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Onboarding Funnel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {funnelSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className={`h-3 w-3 rounded-full ${step.color}`} />
                  <span className="flex-1 text-muted-foreground">{step.label}</span>
                  <span className="font-semibold tabular-nums">{step.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Plan distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Distribuzione Piani (attivi)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                {(["starter", "growth", "business"] as const).map((tier) => {
                  const count = activeOrgs.filter((o) => o.billing_tier === tier).length;
                  return (
                    <div key={tier} className="p-3 bg-muted/40 rounded-xl">
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">{tier}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp usage heavy users */}
          {waHeavyUsers.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-amber-500" /> Clienti vicini al limite WA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {waHeavyUsers.map((o) => (
                  <div key={o.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{o.name}</span>
                    <span className="text-muted-foreground">
                      {o.whatsapp_usage_count} / {o.usage_cap_whatsapp}
                      <span className="ml-2 text-amber-600 font-semibold">
                        {Math.round((o.whatsapp_usage_count / o.usage_cap_whatsapp) * 100)}%
                      </span>
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Dunning queue */}
          {(dunningOrgs?.length ?? 0) > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" /> Dunning Queue
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                    {dunningOrgs!.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dunningOrgs!.map((org) => (
                  <div key={org.id} className="flex items-center justify-between text-sm p-2.5 bg-red-50 border border-red-100 rounded-xl">
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{org.billing_tier} · {org.stripe_status}</p>
                    </div>
                    <Link href={`/organizations/${org.id}`} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
                      Dettagli <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                ))}
                <Link href="/revenue" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 pt-1">
                  Vedi revenue completa <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Recent transactions */}
          {recentTransactions && recentTransactions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Ultime Transazioni</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground text-xs">
                      {format(new Date(tx.created_at), "dd MMM HH:mm", { locale: it })}
                    </span>
                    <Badge variant="outline" className="text-xs capitalize">{tx.type}</Badge>
                    <span className={`font-semibold ${tx.amount < 0 ? "text-green-600" : ""}`}>
                      €{Math.abs(tx.amount).toFixed(2)}
                    </span>
                    <Badge variant="outline" className={`text-xs ${tx.status === "succeeded" ? "text-green-600" : "text-amber-600"}`}>
                      {tx.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ══ TAB 2: COMPLIANCE ════════════════════════════════════════════ */}
        <TabsContent value="compliance" className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold">
            Richieste Compliance Pending ({requestsWithUrls.length})
          </h2>

          {requestsWithUrls.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-500" />
              <p>Nessuna richiesta pendente</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {requestsWithUrls.map((req) => (
              <ComplianceCard key={req.id} request={req} />
            ))}
          </div>
        </TabsContent>

        {/* ══ TAB 3: FEEDBACK ══════════════════════════════════════════════ */}
        <TabsContent value="feedback" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Feedback Clienti ({feedbackList?.length ?? 0})
            </h2>
            <div className="flex gap-2 text-xs">
              {(Object.keys(FEEDBACK_TYPE_CONFIG) as (keyof typeof FEEDBACK_TYPE_CONFIG)[]).map((type) => {
                const count = feedbackList?.filter((f) => f.type === type).length ?? 0;
                const cfg = FEEDBACK_TYPE_CONFIG[type];
                const Icon = cfg.icon;
                return (
                  <div key={type} className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${cfg.bg}`}>
                    <Icon className={`h-3 w-3 ${cfg.color}`} />
                    <span className={cfg.color}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {feedbackList?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Nessun feedback ricevuto ancora</p>
            </div>
          )}

          <div className="space-y-3">
            {feedbackList?.map((feedback) => (
              <FeedbackCard key={feedback.id} feedback={feedback as UserFeedback & { organization: { name: string } | null; profile: { full_name: string; email: string } | null }} />
            ))}
          </div>
        </TabsContent>

        {/* ══ TAB 4: LOCATIONS ═════════════════════════════════════════════ */}
        <TabsContent value="locations" className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold">
            Automation Status Sedi ({allLocations?.length ?? 0})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allLocations?.map((loc) => (
              <AutomationCard key={loc.id} location={loc} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  sub: string;
  color: string;
}) {
  return (
    <Card className="py-0">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color}`} />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

function FeedbackCard({
  feedback,
}: {
  feedback: UserFeedback & {
    organization: { name: string } | null;
    profile: { full_name: string; email: string } | null;
  };
}) {
  const typeCfg = FEEDBACK_TYPE_CONFIG[feedback.type] ?? FEEDBACK_TYPE_CONFIG.general;
  const statusCfg = FEEDBACK_STATUS_CONFIG[feedback.status] ?? FEEDBACK_STATUS_CONFIG.open;
  const priorityCfg = PRIORITY_CONFIG[feedback.priority] ?? PRIORITY_CONFIG.medium;
  const Icon = typeCfg.icon;

  return (
    <Card className={`border ${feedback.type === "bug_report" && feedback.status === "open" ? "border-red-200" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <div className={`rounded-lg p-2 border ${typeCfg.bg} shrink-0`}>
            <Icon className={`h-4 w-4 ${typeCfg.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight">{feedback.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {feedback.organization?.name ?? "—"} · {feedback.profile?.full_name ?? feedback.profile?.email ?? "Anonimo"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant="outline" className={`text-xs ${statusCfg.color}`}>
              {statusCfg.label}
            </Badge>
            <Badge variant="outline" className={`text-xs ${priorityCfg.color}`}>
              {priorityCfg.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      {feedback.description && (
        <CardContent className="pb-2 pt-0">
          <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded-lg">
            {feedback.description}
          </p>
        </CardContent>
      )}

      {feedback.admin_response && (
        <CardContent className="pb-2 pt-0">
          <div className="text-xs bg-blue-50 border border-blue-100 text-blue-800 p-2 rounded-lg">
            <span className="font-semibold">Risposta admin: </span>
            {feedback.admin_response}
          </div>
        </CardContent>
      )}

      <CardFooter className="pt-2 pb-3 flex flex-col gap-2">
        <p className="text-xs text-muted-foreground w-full">
          {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true, locale: it })}
        </p>

        {/* Status update */}
        <form className="flex flex-wrap gap-1 w-full">
          {(Object.keys(FEEDBACK_STATUS_CONFIG) as UserFeedbackStatus[]).map((s) => (
            <button
              key={s}
              formAction={async () => {
                "use server";
                await adminUpdateFeedback(feedback.id, { status: s });
              }}
              className={`text-[10px] px-2 py-1 rounded-lg border transition-colors ${
                feedback.status === s
                  ? FEEDBACK_STATUS_CONFIG[s].color + " font-semibold border-transparent"
                  : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {FEEDBACK_STATUS_CONFIG[s].label}
            </button>
          ))}
        </form>

        {/* Priority update */}
        <form className="flex flex-wrap gap-1 w-full">
          {(Object.keys(PRIORITY_CONFIG) as UserFeedbackPriority[]).map((p) => (
            <button
              key={p}
              formAction={async () => {
                "use server";
                await adminUpdateFeedback(feedback.id, { priority: p });
              }}
              className={`text-[10px] px-2 py-1 rounded-lg border transition-colors ${
                feedback.priority === p
                  ? PRIORITY_CONFIG[p].color + " font-semibold border-transparent"
                  : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {PRIORITY_CONFIG[p].label}
            </button>
          ))}
        </form>

        {/* Admin response */}
        <form className="w-full flex flex-col gap-1">
          <Textarea
            name="response"
            defaultValue={feedback.admin_response ?? ""}
            placeholder="Scrivi una risposta al cliente..."
            className="text-xs min-h-15 resize-none"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              formAction={async (fd: FormData) => {
                "use server";
                const response = fd.get("response") as string;
                await adminUpdateFeedback(feedback.id, { admin_response: response || undefined });
              }}
              className="text-xs bg-foreground text-background px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
            >
              Salva risposta
            </button>
            <button
              formAction={async () => {
                "use server";
                await adminDeleteFeedback(feedback.id);
              }}
              className="text-xs text-red-600 hover:text-red-700 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              Elimina
            </button>
          </div>
        </form>
      </CardFooter>
    </Card>
  );
}

function AutomationCard({ location }: { location: Record<string, any> }) {
  const reqStatus = location.regulatory_status || "none";
  const telnyxReqGroupId = location.telnyx_requirement_group_id;
  const hasTelnyx = !!location.telnyx_phone_number;
  const hasMeta = !!location.meta_phone_id;
  const isVerified = location.activation_status === "verified";

  return (
    <Card className="text-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {location.name}{" "}
          <span className="text-xs font-normal text-muted-foreground">
            ({location.organization?.name})
          </span>
        </CardTitle>
        <CardDescription className="text-xs break-all">{location.id}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pb-3">
        {/* Sync Button */}
        <form action={async () => {
          "use server";
          await syncTelnyxStatus(location.id);
        }}>
          <Button size="sm" variant="outline" className="w-full h-7 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
            <RotateCcw className="w-3 h-3 mr-1" /> Sync Telnyx Status
          </Button>
        </form>

        {/* Regulatory */}
        <div className="flex justify-between items-center">
          <span>Regulatory:</span>
          <Badge variant={reqStatus === "approved" ? "default" : "secondary"} className={reqStatus === "approved" ? "bg-green-100 text-green-800" : ""}>
            {reqStatus}
          </Badge>
        </div>

        {location.regulatory_rejection_reason && (
          <div className="p-2 bg-red-50 border border-red-100 rounded text-[10px] text-red-700">
            <strong>Rifiuto:</strong> {location.regulatory_rejection_reason}
          </div>
        )}

        {reqStatus === "pending" && !telnyxReqGroupId && (
          <form action={async () => {
            "use server";
            await resetComplianceStatusAction(location.id);
          }}>
            <Button size="sm" variant="ghost" className="w-full h-6 mt-1 text-[10px] text-red-600 hover:bg-red-50">
              ⚠️ Stuck? Reset to Pending Review
            </Button>
          </form>
        )}

        {reqStatus !== "approved" && telnyxReqGroupId && (
          <form action={async () => {
            "use server";
            await simulateTelnyxApproval(telnyxReqGroupId, location.telnyx_phone_number);
          }}>
            <Button size="sm" variant="ghost" className="w-full h-6 mt-1 text-[10px] text-orange-600 hover:bg-orange-50">
              ⚡ Simulate Approval
            </Button>
          </form>
        )}

        {/* Telnyx Number */}
        <div className="flex justify-between items-center border-t pt-2">
          <span>Telnyx Number:</span>
          <span className="font-mono text-xs">{location.telnyx_phone_number || "N/A"}</span>
        </div>
        {reqStatus === "approved" && (
          <form action={async () => {
            "use server";
            await manualPurchaseNumber(location.id, location.telnyx_requirement_group_id);
          }}>
            <Button size="sm" variant="outline" className="w-full h-7 mt-1 text-xs">
              <RefreshCw className="w-3 h-3 mr-1" /> Force Purchase
            </Button>
          </form>
        )}

        {/* Meta */}
        <div className="flex justify-between items-center border-t pt-2">
          <span>Meta ID:</span>
          {hasMeta ? (
            <BadgeCheck className="w-4 h-4 text-green-600" />
          ) : (
            <span className="text-xs text-muted-foreground">Missing</span>
          )}
        </div>
        {hasTelnyx && (
          <form action={async () => {
            "use server";
            await manualMetaRegistration(location.id);
          }}>
            <Button size="sm" variant="outline" className="w-full h-7 mt-1 text-xs">
              <Phone className="w-3 h-3 mr-1" /> {hasMeta ? "Re-register on Meta" : "Force Add to Meta"}
            </Button>
          </form>
        )}

        {/* Status */}
        <div className="flex justify-between items-center border-t pt-2">
          <span>Status:</span>
          <Badge variant={isVerified ? "default" : "outline"}>{location.activation_status}</Badge>
        </div>

        {hasMeta && !isVerified && (
          <div className="flex gap-1 mt-1">
            <form action={async () => {
              "use server";
              await simulateIncomingCall(location.telnyx_phone_number);
            }} className="flex-1">
              <Button size="sm" variant="secondary" className="w-full h-7 text-[10px] bg-blue-50 text-blue-700 hover:bg-blue-100">
                ⚡ Sim. Call
              </Button>
            </form>
            <form action={async () => {
              "use server";
              await simulateRecordingSaved(location.telnyx_phone_number);
            }} className="flex-1">
              <Button size="sm" variant="secondary" className="w-full h-7 text-[10px] bg-green-50 text-green-700 hover:bg-green-100">
                ⚡ Sim. Code
              </Button>
            </form>
          </div>
        )}

        {hasMeta && !isVerified && (
          <form action={async () => {
            "use server";
            await manualVoiceVerification(location.id);
          }}>
            <Button size="sm" variant="outline" className="w-full h-7 mt-2 text-xs">
              <RefreshCw className="w-3 h-3 mr-1" /> Re-trigger Real Call
            </Button>
          </form>
        )}

        <div className="pt-2 border-t mt-2 flex flex-col gap-2">
          <div className="p-2 bg-muted rounded text-[10px] font-mono whitespace-pre overflow-x-auto">
            <div className="font-bold border-b mb-1 pb-1">RAW DB DATA:</div>
            ID: {location.id}{"\n"}
            Status: {location.activation_status}{"\n"}
            Number: {location.telnyx_phone_number || "NULL"}{"\n"}
            MetaID: {location.meta_phone_id || "NULL"}{"\n"}
            ReqStatus: {location.regulatory_status || "NULL"}
          </div>

          <form action={async () => {
            "use server";
            await deleteLocationAction(location.id);
          }}>
            <Button size="sm" variant="destructive" className="w-full h-6 text-[10px]">
              Trash Location (Cleanup)
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

async function ComplianceCard({ request }: { request: Record<string, any> }) {
  const docsData = request.documents_data as Record<string, string> | null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending Review
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: it })}
          </div>
        </div>
        <CardTitle className="text-lg mt-2">{request.organization?.name ?? "Unknown Org"}</CardTitle>
        <CardDescription>
          Location: <span className="font-semibold text-foreground">{request.name ?? "—"}</span>
          <br />
          Area Code: <span className="font-mono font-medium text-foreground">{request.area_code}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm space-y-2 pb-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div className="col-span-2 font-semibold border-b pb-1 mt-2 mb-1">Dettagli cliente</div>
          <div>Tipo:</div>
          <div className="font-medium capitalize">{docsData?.customerType?.replace("_", " ")}</div>
          {docsData?.customerType === "legal_entity" && (
            <>
              <div>Ragione sociale:</div>
              <div className="font-medium">{docsData?.businessName}</div>
              <div>P.IVA:</div>
              <div className="font-medium">{docsData?.vatNumber}</div>
            </>
          )}
          <div>Nome:</div>
          <div className="font-medium">{docsData?.firstName} {docsData?.lastName}</div>
          <div>C.F.:</div>
          <div className="font-medium">{docsData?.taxCode}</div>
          <div>Nascita:</div>
          <div className="font-medium">
            {docsData?.dateOfBirth
              ? format(new Date(docsData.dateOfBirth), "dd/MM/yyyy")
              : "—"}
          </div>

          <div className="col-span-2 font-semibold border-b pb-1 mt-2 mb-1">Documento identità</div>
          <div>Tipo:</div>
          <div className="font-medium">{docsData?.idType}</div>
          <div>Numero:</div>
          <div className="font-medium">{docsData?.idNumber}</div>
          <div>Scadenza:</div>
          <div className="font-medium">
            {docsData?.idExpirationDate
              ? format(new Date(docsData.idExpirationDate), "dd/MM/yyyy")
              : "—"}
          </div>

          <div className="col-span-2 font-semibold border-b pb-1 mt-2 mb-1">Indirizzo</div>
          <div className="col-span-2">
            {docsData?.streetAddress}, {docsData?.city}
            <br />
            {docsData?.zipCode} {docsData?.province}
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4 pt-2 border-t">
          {[
            { label: "Identity", url: request.identityUrl, filename: docsData?.identity_filename },
            { label: "Address", url: request.addressUrl, filename: docsData?.address_filename },
          ].map(({ label, url, filename }) => (
            <div key={label} className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500 shrink-0" />
              <span className="text-xs font-semibold w-16">{label}:</span>
              {url ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs truncate max-w-37.5 hover:underline hover:text-blue-600">
                  {filename || "Visualizza file"}
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">Mancante</span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 pt-0">
        <form action={async () => {
          "use server";
          await rejectComplianceRequest(request.id, "Admin Rejected via Dashboard");
        }} className="w-1/2">
          <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
            <XCircle className="w-4 h-4 mr-1" /> Rifiuta
          </Button>
        </form>
        <form action={async () => {
          "use server";
          await approveComplianceRequest(request.id);
        }} className="w-1/2">
          <Button variant="default" type="submit" className="w-full bg-green-600 hover:bg-green-700">
            <CheckCircle className="w-4 h-4 mr-1" /> Approva
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
