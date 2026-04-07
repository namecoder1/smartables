import { createAdminClient } from "@/utils/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity, CheckCircle2, XCircle, AlertTriangle, MessageSquare,
  Phone, Zap, Clock, ArrowRight, BugPlay, ShieldAlert,
  Bot, Plug2, Smartphone,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, subHours, subDays } from "date-fns";
import { it } from "date-fns/locale";
import GlitchTipWidget from "@/components/admin/glitchtip-widget";

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${ok ? "bg-green-500" : "bg-red-500"}`} />
  );
}

function HealthRow({
  label, ok, detail,
}: { label: string; ok: boolean; detail?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
      <div className="flex items-center gap-2">
        <StatusDot ok={ok} />
        <span>{label}</span>
      </div>
      <span className={`text-xs ${ok ? "text-muted-foreground" : "text-red-600 font-medium"}`}>
        {detail ?? (ok ? "OK" : "ERRORE")}
      </span>
    </div>
  );
}

// ── Trigger.dev types ─────────────────────────────────────────────────────────

type TriggerRun = {
  id: string;
  status: string;
  taskIdentifier: string;
  createdAt: string;
  finishedAt?: string | null;
  error?: { message?: string } | null;
};

async function fetchTriggerRuns(): Promise<TriggerRun[]> {
  const token = process.env.TRIGGER_SECRET_KEY;
  if (!token) return [];
  try {
    const res = await fetch(
      "https://api.trigger.dev/api/v1/runs?filter[status]=FAILED,CRASHED&page[size]=10",
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 60 },
      },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data ?? []) as TriggerRun[];
  } catch {
    return [];
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HealthPage() {
  const supabase = createAdminClient();
  const last24h = subHours(new Date(), 24).toISOString();
  const last7d = subDays(new Date(), 7).toISOString();
  const last48h = subHours(new Date(), 48).toISOString();

  const [
    { data: recentWaMsgs, error: waError },
    { data: recentBookings, error: bookingError },
    { data: pendingCompliance },
    { data: failedTx },
    { data: openBugs },
    { data: waHeavyOrgs },
    { data: stuckLocations },
    { data: recentTransactions },
    triggerFailedRuns,
    { data: waMsgs7d },
    { data: waBotBookings },
    { data: lastTheforkBooking },
    { data: lastTelnyxWebhook },
    { data: lastStripeTransaction },
  ] = await Promise.all([
    // WA messages in last 24h
    supabase
      .from("whatsapp_messages")
      .select("id, created_at, status, direction")
      .gte("created_at", last24h)
      .order("created_at", { ascending: false })
      .limit(200),
    // Bookings in last 24h
    supabase
      .from("bookings")
      .select("id, created_at, source")
      .gte("created_at", last24h)
      .order("created_at", { ascending: false })
      .limit(100),
    // Pending compliance > 48h (stuck)
    supabase
      .from("locations")
      .select("id, name, organization_id, created_at, organization:organization_id(name)")
      .eq("regulatory_status", "pending_review")
      .lte("created_at", last48h),
    // Failed transactions in last 7 days
    supabase
      .from("transactions")
      .select("id, organization_id, amount, type, created_at")
      .eq("status", "failed")
      .gte("created_at", last7d)
      .order("created_at", { ascending: false }),
    // Open bug reports
    supabase
      .from("user_feedback")
      .select("id, title, priority, created_at")
      .eq("type", "bug_report")
      .eq("status", "open")
      .order("created_at", { ascending: false }),
    // Orgs near WA limit (>90%)
    supabase
      .from("organizations")
      .select("id, name, whatsapp_usage_count, usage_cap_whatsapp")
      .not("usage_cap_whatsapp", "is", null),
    // Stuck locations: has Telnyx but not verified (> 7 days old)
    supabase
      .from("locations")
      .select("id, organization_id, name, activation_status, regulatory_status, created_at, telnyx_phone_number, meta_phone_id, organization:organization_id(name)")
      .neq("activation_status", "verified")
      .not("telnyx_phone_number", "is", null)
      .lte("created_at", last7d)
      .limit(20),
    // Recent transactions for activity
    supabase
      .from("transactions")
      .select("id, type, status, amount, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    // Trigger.dev failed runs
    fetchTriggerRuns(),
    // Bot performance: WA messages last 7d
    supabase
      .from("whatsapp_messages")
      .select("id, direction, status, created_at")
      .gte("created_at", last7d),
    // WA bookings (source=whatsapp_auto) last 7d — proxy for bot conversions
    supabase
      .from("bookings")
      .select("id, source, created_at")
      .eq("source", "whatsapp_auto")
      .gte("created_at", last7d),
    // Integration liveness: last TheFork booking
    supabase
      .from("bookings")
      .select("id, created_at")
      .eq("source", "thefork")
      .order("created_at", { ascending: false })
      .limit(1),
    // Integration liveness: last Telnyx webhook
    supabase
      .from("telnyx_webhook_logs")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(1),
    // Integration liveness: last Stripe transaction
    supabase
      .from("transactions")
      .select("id, created_at, status")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  // Compute WA stats
  const waMsgTotal = recentWaMsgs?.length ?? 0;
  const waMsgFailed = (recentWaMsgs ?? []).filter((m) => m.status === "failed").length;
  const waMsgDeliveryRate = waMsgTotal > 0 ? Math.round(((waMsgTotal - waMsgFailed) / waMsgTotal) * 100) : 100;
  const waInbound = (recentWaMsgs ?? []).filter((m) => m.direction === "inbound").length;
  const waOutbound = (recentWaMsgs ?? []).filter((m) => m.direction === "outbound").length;

  // WA heavy users
  const waHeavy = (waHeavyOrgs ?? []).filter((o) => o.usage_cap_whatsapp && o.whatsapp_usage_count >= o.usage_cap_whatsapp * 0.9);

  // Compliance stuck > 48h
  const stuckCompliance = pendingCompliance ?? [];

  // Failed tx last 7d
  const failedCount = failedTx?.length ?? 0;

  // Booking sources
  const bookingsBySource: Record<string, number> = {};
  (recentBookings ?? []).forEach((b) => {
    bookingsBySource[b.source] = (bookingsBySource[b.source] ?? 0) + 1;
  });

  // ── Bot performance (7d) ────────────────────────────────────────────────
  const botInbound  = (waMsgs7d ?? []).filter((m) => m.direction === "inbound").length;
  const botReplies  = (waMsgs7d ?? []).filter((m) => m.direction === "outbound_bot").length;
  const botCoverage = botInbound > 0 ? Math.round((botReplies / botInbound) * 100) : 100;
  const botConversions = waBotBookings?.length ?? 0;

  // ── Integration liveness ─────────────────────────────────────────────────
  const lastWaMsg      = recentWaMsgs?.[0]?.created_at ?? null;
  const lastTelnyxEvt  = lastTelnyxWebhook?.[0]?.created_at ?? null;
  const lastTheforkEvt = lastTheforkBooking?.[0]?.created_at ?? null;
  const lastStripeEvt  = lastStripeTransaction?.[0]?.created_at ?? null;
  const hoursAgo = (iso: string | null) => {
    if (!iso) return null;
    return Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);
  };

  // Overall health
  const criticalIssues = [
    waError != null,
    waMsgDeliveryRate < 80,
    failedCount > 5,
    (openBugs?.filter((b) => b.priority === "critical").length ?? 0) > 0,
  ].filter(Boolean).length;

  const warnings = [
    stuckCompliance.length > 0,
    waHeavy.length > 0,
    (stuckLocations?.length ?? 0) > 0,
    (openBugs?.length ?? 0) > 0,
  ].filter(Boolean).length;

  const overallOk = criticalIssues === 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Monitoraggio operativo in tempo reale</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
          overallOk ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {overallOk
            ? <><CheckCircle2 className="h-4 w-4" /> Sistemi operativi</>
            : <><XCircle className="h-4 w-4" /> {criticalIssues} problema/i critico/i</>
          }
        </div>
      </div>

      {/* Critical alerts */}
      {criticalIssues > 0 && (
        <div className="space-y-2">
          {waError && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Errore query WhatsApp messages — possibile problema DB
            </div>
          )}
          {waMsgDeliveryRate < 80 && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Delivery rate WA anomalo: {waMsgDeliveryRate}% (ultimi 24h)
            </div>
          )}
          {failedCount > 5 && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {failedCount} transazioni fallite negli ultimi 7 giorni
            </div>
          )}
          {(openBugs?.filter((b) => b.priority === "critical").length ?? 0) > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {openBugs!.filter((b) => b.priority === "critical").length} bug CRITICO/I aperti senza risposta
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* WhatsApp Health */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> WhatsApp (24h)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <HealthRow
              label="Delivery rate"
              ok={waMsgDeliveryRate >= 90}
              detail={`${waMsgDeliveryRate}%`}
            />
            <HealthRow
              label="Messaggi totali"
              ok={true}
              detail={`${waMsgTotal} (↓${waInbound} ↑${waOutbound})`}
            />
            <HealthRow
              label="Falliti"
              ok={waMsgFailed === 0}
              detail={waMsgFailed === 0 ? "Nessuno" : `${waMsgFailed} falliti`}
            />
            {waHeavy.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-amber-700 font-medium mb-1">Vicini al limite (&gt;90%):</p>
                {waHeavy.map((o) => (
                  <div key={o.id} className="flex items-center justify-between text-xs py-0.5">
                    <Link href={`/organizations/${o.id}`} className="hover:underline">{o.name}</Link>
                    <span className="text-amber-700 font-medium">
                      {Math.round((o.whatsapp_usage_count / o.usage_cap_whatsapp!) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bookings Health */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" /> Prenotazioni (24h)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <HealthRow label="Totale create" ok={true} detail={`${recentBookings?.length ?? 0}`} />
            {Object.entries(bookingsBySource).map(([source, count]) => (
              <HealthRow key={source} label={source} ok={true} detail={`${count}`} />
            ))}
            {(recentBookings?.length ?? 0) === 0 && (
              <p className="text-xs text-amber-600 py-2">Nessuna prenotazione nelle ultime 24h — normale fuori orario</p>
            )}
          </CardContent>
        </Card>

        {/* Billing Health */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" /> Billing (7 giorni)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <HealthRow
              label="Transazioni fallite"
              ok={failedCount === 0}
              detail={failedCount === 0 ? "Nessuna" : `${failedCount} fallite`}
            />
            <HealthRow
              label="Ultima transazione"
              ok={true}
              detail={recentTransactions?.[0]
                ? formatDistanceToNow(new Date(recentTransactions[0].created_at), { addSuffix: true, locale: it })
                : "—"}
            />
          </CardContent>
        </Card>

        {/* Compliance health */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Compliance SLA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <HealthRow
              label="In attesa da >48h"
              ok={stuckCompliance.length === 0}
              detail={stuckCompliance.length === 0 ? "Tutto a posto" : `${stuckCompliance.length} richieste`}
            />
            {stuckCompliance.map((req) => (
              <div key={req.id} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                <div>
                  <p className="font-medium">{(req.organization as any)?.name ?? "—"}</p>
                  <p className="text-muted-foreground">
                    {formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: it })}
                  </p>
                </div>
                <Link href="/manage?tab=compliance" className="text-blue-600 hover:underline">
                  Rivedi
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Stuck locations */}
        {(stuckLocations?.length ?? 0) > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-4 w-4 text-amber-500" /> Sedi bloccate (&gt;7gg)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(stuckLocations ?? []).map((loc) => (
                <div key={loc.id} className="text-xs border-b last:border-0 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{loc.name}</span>
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                      {loc.activation_status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{(loc.organization as any)?.name}</p>
                  <p className="text-muted-foreground">
                    Reg: {loc.regulatory_status ?? "—"} · {!loc.meta_phone_id ? "No Meta" : "Meta OK"}
                  </p>
                  <Link
                    href={`/organizations/${loc.organization_id}`}
                    className="text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    Vai all'org <ArrowRight className="h-2.5 w-2.5" />
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Bug reports */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" /> Bug aperti ({openBugs?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(openBugs?.length ?? 0) === 0 && (
              <div className="flex items-center gap-2 text-green-700 text-sm py-2">
                <CheckCircle2 className="h-4 w-4" /> Nessun bug aperto
              </div>
            )}
            {(openBugs ?? []).map((bug) => (
              <div key={bug.id} className="flex items-start justify-between text-xs border-b last:border-0 pb-2">
                <div>
                  <p className="font-medium leading-tight">{bug.title}</p>
                  <p className="text-muted-foreground">
                    {formatDistanceToNow(new Date(bug.created_at), { addSuffix: true, locale: it })}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] shrink-0 ${
                    bug.priority === "critical" ? "bg-red-100 text-red-700"
                    : bug.priority === "high" ? "bg-orange-100 text-orange-700"
                    : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {bug.priority}
                </Badge>
              </div>
            ))}
            {(openBugs?.length ?? 0) > 0 && (
              <Link href="/manage" className="text-xs text-blue-600 hover:underline flex items-center gap-1 pt-1">
                Gestisci feedback <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Trigger.dev — failed runs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BugPlay className="h-4 w-4 text-purple-500" />
              Trigger.dev — run falliti ({triggerFailedRuns.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {triggerFailedRuns.length === 0 ? (
              <div className="flex items-center gap-2 text-green-700 text-sm py-2">
                <CheckCircle2 className="h-4 w-4" /> Nessun job fallito
              </div>
            ) : (
              triggerFailedRuns.map((run) => (
                <div key={run.id} className="flex items-start justify-between text-xs border-b last:border-0 pb-2 gap-2">
                  <div className="min-w-0">
                    <p className="font-medium font-mono">{run.taskIdentifier}</p>
                    {run.error?.message && (
                      <p className="text-muted-foreground line-clamp-1 mt-0.5">{run.error.message}</p>
                    )}
                    <p className="text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true, locale: it })}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${
                    run.status === "CRASHED" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                  }`}>
                    {run.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* GlitchTip — unresolved errors */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-500" /> GlitchTip — errori irrisolti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GlitchTipWidget />
          </CardContent>
        </Card>

        {/* Bot AI performance (7d) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4 text-violet-500" /> Bot AI (7 giorni)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <HealthRow
              label="Messaggi inbound"
              ok={true}
              detail={`${botInbound}`}
            />
            <HealthRow
              label="Risposte bot"
              ok={botCoverage >= 80}
              detail={`${botReplies} (${botCoverage}% coverage)`}
            />
            <HealthRow
              label="Prenotazioni via WA bot"
              ok={true}
              detail={`${botConversions} conversioni`}
            />
            {botCoverage < 80 && botInbound > 0 && (
              <p className="text-xs text-amber-600 pt-1">
                Coverage &lt;80%: il bot potrebbe non rispondere a tutti i messaggi
              </p>
            )}
          </CardContent>
        </Card>

        {/* Integration liveness */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plug2 className="h-4 w-4 text-cyan-500" /> Integration liveness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {(
              [
                { label: "WhatsApp (ultimo msg)",    hours: hoursAgo(lastWaMsg),      threshold: 48 },
                { label: "Telnyx (ultimo webhook)",  hours: hoursAgo(lastTelnyxEvt),  threshold: 72 },
                { label: "TheFork (ultima booking)", hours: hoursAgo(lastTheforkEvt), threshold: 168 },
                { label: "Stripe (ultima tx)",       hours: hoursAgo(lastStripeEvt),  threshold: 168 },
              ] as const
            ).map(({ label, hours, threshold }) => (
              <HealthRow
                key={label}
                label={label}
                ok={hours === null || hours <= threshold}
                detail={
                  hours === null
                    ? "Nessun evento registrato"
                    : hours < 1
                    ? "< 1h fa"
                    : hours < 24
                    ? `${hours}h fa`
                    : `${Math.floor(hours / 24)}g fa`
                }
              />
            ))}
          </CardContent>
        </Card>

        {/* Mobile App Monitor — placeholder */}
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
              <Smartphone className="h-4 w-4" /> App Mobile — In sviluppo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground text-sm">Monitor pianificato (Expo + React Native):</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>DAU / MAU (utenti attivi giornalieri / mensili)</li>
              <li>Distribuzione versione app installata</li>
              <li>Push notification delivery rate</li>
              <li>Crash reports via GlitchTip (React Native Sentry SDK)</li>
              <li>Latenza API da client mobile (p50 / p95)</li>
              <li>Sessioni per piano (Starter / Growth / Business)</li>
            </ul>
            <p className="pt-1 italic">Attivare quando l&apos;app Expo viene rilasciata.</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
