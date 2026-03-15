import { DonutPie } from '@/components/charts/donut-pie'
import { SimpleLine } from '@/components/charts/simple-line'
import { AreaChart } from '@/components/charts/area-chart'
import { ChartBar } from '@/components/charts/chart-bar'
import { getAnalyticsData } from './actions'
import PageWrapper from '@/components/private/page-wrapper'
import { Metadata } from 'next'
import AnalyticsLiveUpdater from '@/components/analytics/analytics-live-updater'
import { MetricCard } from '@/components/analytics/metric-card'
import { EmptyChartState } from '@/components/analytics/empty-chart-state'
import { WhatsAppUsageBar } from '@/components/analytics/whatsapp-usage-bar'
import { PeriodStatCard } from '@/components/analytics/period-stat-card'
import { ExportMenu } from '@/components/analytics/export-menu'
import { AnalyticsPeriodPicker } from '@/components/analytics/analytics-period-picker'
import { PLAN_LABELS } from '@/lib/analytics/config'
import {
  Users,
  CalendarDays,
  Lock,
  UserCheck,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FaqContent } from '@/components/private/faq-section'
import { getFaqsByTopic } from '@/utils/sanity/queries'
import { ButtonGroup } from '@/components/ui/button-group'

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'Visualizza le statistiche dei tuoi clienti e delle tue prenotazioni.',
}

function LockedSection({ upgradeTarget, andAddon }: { upgradeTarget: string; andAddon?: boolean }) {
  return (
    <div className="relative rounded-3xl border-2 shadow-sm bg-card overflow-hidden">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3">
        <div className="bg-muted rounded-full p-3">
          <Lock className="text-muted-foreground" size={24} />
        </div>
        <p className="text-base font-medium text-center">
          Disponibile nel piano <span className="font-bold">{upgradeTarget}</span>
          {andAddon && <span className="font-normal"> o con l'add-on Analytics Pro</span>}
        </p>
        <div className="flex gap-2 flex-wrap justify-center">
          <Button size="sm" asChild>
            <Link href="/billing">Aggiorna piano</Link>
          </Button>
          {andAddon && (
            <Button size="sm" variant="outline" asChild>
              <Link href="/limits">Acquista Add-on</Link>
            </Button>
          )}
        </div>
      </div>
      <div className="opacity-20 pointer-events-none select-none p-6">
        <div className="h-6 w-40 bg-muted rounded mb-4" />
        <div className="h-48 bg-muted/50 rounded" />
      </div>
    </div>
  )
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const { from, to } = await searchParams
  const data = await getAnalyticsData(from, to)

  if (!data) {
    return (
      <PageWrapper>
        <div>Errore nel caricamento dei dati.</div>
      </PageWrapper>
    )
  }

  const {
    planId,
    features,
    hasAnalyticsAddon,
    sources,
    weeklyTrends,
    totalBookings,
    whatsAppStats,
    periodStats,
    hottestDays,
    hottestHours,
    groupDistribution,
    averageCovers,
    totalCustomers,
    longTermTrends,
    customerMetrics,
  } = data

  console.log(features)

  const planLabel = PLAN_LABELS[planId] ?? 'Starter'
  const isBusiness = features.longTermTrends
  const isGrowthOrBusiness = features.periodComparison
  const effectivePlanForUpgrade = planId === 'starter' && hasAnalyticsAddon ? 'growth' : planId
  const [analyticsFaqs] = await Promise.all([
    getFaqsByTopic('analytics')
  ])

  const formatCurrency = (n: number) =>
    `€ ${n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <PageWrapper>
      <AnalyticsLiveUpdater />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className='flex flex-col gap-1'>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            {isBusiness
              ? 'Statistiche avanzate, metriche clienti ed export completo.'
              : isGrowthOrBusiness
                ? 'Confronto periodi, orari di punta e analitiche WhatsApp.'
                : 'Panoramica delle attività del tuo ristorante.'}
          </p>
        </div>
        <div className="flex justify-start items-center gap-2">
          <FaqContent
            variant='minimized'
            className='w-fit'
            title='Aiuto'
            faqs={analyticsFaqs}
          />
          {isGrowthOrBusiness && (
            <AnalyticsPeriodPicker className='mx-0' />
          )}
          {/* Export — Business */}
          {features.exportCsv && (
            <ExportMenu from={data.from} to={data.to} />
          )}
        </div>
      </div>

      {/* ── SEZIONE 1: KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Prenotazioni Totali"
          value={totalBookings}
          description="All time"
          icon={CalendarDays}
        />

        {features.averageCovers ? (
          <MetricCard
            title="Coperti Medi"
            value={averageCovers ?? '-'}
            description="Per prenotazione (all time)"
            icon={Users}
          />
        ) : (
          <MetricCard
            title="Coperti Medi"
            value="—"
            description="Disponibile nel piano Growth"
            icon={Users}
            className="opacity-60"
          />
        )}

        {features.customerMetrics ? (
          <MetricCard
            title="Clienti Totali"
            value={totalCustomers ?? '-'}
            description="Registrati nel CRM"
            icon={UserCheck}
          />
        ) : (
          <MetricCard
            title="Clienti Totali"
            value="—"
            description="Disponibile nel piano Business"
            icon={UserCheck}
            className="opacity-60"
          />
        )}

        {features.customerMetrics && customerMetrics ? (
          <MetricCard
            title="Clienti Abituali"
            value={`${customerMetrics.returningRate}%`}
            description={`${customerMetrics.returningCustomers} clienti con >1 visita`}
            icon={RotateCcw}
          />
        ) : (
          <MetricCard
            title="Clienti Abituali"
            value="—"
            description="Disponibile nel piano Business"
            icon={RotateCcw}
            className="opacity-60"
          />
        )}
      </div>

      {/* ── SEZIONE 2: Period Comparison (Growth+) ── */}
      {isGrowthOrBusiness && periodStats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <PeriodStatCard
            title="Prenotazioni nel periodo"
            comparison={periodStats.bookings}
          />
          <PeriodStatCard
            title="Coperti nel periodo"
            comparison={periodStats.covers}
          />
          <PeriodStatCard
            title="Revenue nel periodo"
            comparison={periodStats.revenue}
            formatValue={formatCurrency}
          />
        </div>
      ) : !isGrowthOrBusiness ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <LockedSection upgradeTarget="Growth" andAddon={planId === 'starter'} />
          <LockedSection upgradeTarget="Growth" andAddon={planId === 'starter'} />
          <LockedSection upgradeTarget="Growth" andAddon={planId === 'starter'} />
        </div>
      ) : null}

      {/* ── SEZIONE 3: Distribuzione canali + trend settimanale ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className='py-0 gap-0'>
          <CardHeader className="border-b-2 py-5 flex items-center gap-3">
            <CardTitle className="text-lg font-bold tracking-tight">
              Canali di Prenotazione
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex-1 min-h-62.5 relative">
              {sources.length > 0 ? (
                <DonutPie data={sources} />
              ) : (
                <EmptyChartState className="h-full border-none bg-transparent" />
              )}
            </div>
          </CardContent>
        </Card>
        <Card className='gap-0 py-0 lg:col-span-2'>
          <CardHeader className="border-b-2 py-5 flex items-center gap-3">
            <CardTitle className="text-lg font-bold tracking-tight">
              Trend Settimanale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex-1 min-h-62.5 relative">
              {weeklyTrends && weeklyTrends.some(w => w.visitors > 0) ? (
                <SimpleLine data={weeklyTrends} />
              ) : (
                <EmptyChartState className="h-full border-none bg-transparent" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── SEZIONE 4: WhatsApp Usage ── */}
      {whatsAppStats && (
        <WhatsAppUsageBar stats={whatsAppStats} detailed={features.whatsappDetailedAnalytics} />
      )}

      {/* ── SEZIONE 5: Rush Hours & Distribuzione (Growth+) ── */}
      {isGrowthOrBusiness ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col h-full">
            {hottestDays && hottestDays.some(d => d.bookings > 0) ? (
              <ChartBar
                data={hottestDays}
                title="Giorni più popolari"
                dataKeyX="day"
                dataKeyY="bookings"
                config={{ bookings: { label: 'Prenotazioni', color: 'hsl(var(--chart-1))' } }}
              />
            ) : (
              <Card className='py-0 gap-0'>
                <CardHeader className="border-b-2 py-5 flex items-center gap-3">
                  <CardTitle className="text-lg font-bold tracking-tight">
                    Giorni più popolari
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex-1">
                    <EmptyChartState className="h-full border-none bg-transparent" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex flex-col h-full">
            {hottestHours && hottestHours.some(h => h.bookings > 0) ? (
              <ChartBar
                data={hottestHours}
                title="Orari di punta"
                dataKeyX="hour"
                dataKeyY="bookings"
                config={{ bookings: { label: 'Prenotazioni', color: 'hsl(var(--chart-2))' } }}
                fill="hsl(var(--chart-2))"
              />
            ) : (
              <Card className='gap-0 py-0'>
                <CardHeader className="border-b-2 py-5 flex items-center gap-3">
                  <CardTitle className="text-lg font-bold tracking-tight">
                    Orari di punta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex-1">
                    <EmptyChartState className="h-full border-none bg-transparent" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Group size distribution (Growth+) */}
          {groupDistribution && groupDistribution.length > 0 && (
            <Card className='md:col-span-2 py-0 gap-0'>
              <CardHeader className="border-b-2 py-5 flex items-center gap-3">
                <CardTitle className="text-lg font-bold tracking-tight">
                  Dimensione Gruppi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {groupDistribution.map(bucket => (
                    <div key={bucket.name} className="flex flex-col items-center gap-1 bg-muted/30 rounded-lg p-4">
                      <span className="text-2xl font-bold">{bucket.count}</span>
                      <span className="text-sm text-muted-foreground font-medium">{bucket.name} pers.</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LockedSection upgradeTarget="Growth" andAddon={planId === 'starter'} />
          <LockedSection upgradeTarget="Growth" andAddon={planId === 'starter'} />
        </div>
      )}

      {/* ── SEZIONE 6: Long Term Trends (Business) ── */}
      {isBusiness ? (
        <div className="border p-6 rounded-xl bg-card text-card-foreground shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Afflusso (Ultimi 3 mesi)</h2>
            <p className="text-sm text-muted-foreground">Andamento delle visite nel tempo</p>
          </div>
          <div className="min-h-75">
            {longTermTrends && longTermTrends.length > 0 ? (
              <AreaChart data={longTermTrends} />
            ) : (
              <EmptyChartState className="h-75 border-none bg-transparent" />
            )}
          </div>
        </div>
      ) : (
        <LockedSection upgradeTarget="Business" />
      )}

      {/* ── SEZIONE 7: Customer Metrics (Business) ── */}
      {isBusiness && customerMetrics ? (
        <div className="border p-6 rounded-xl bg-card text-card-foreground shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Metriche Clienti</h2>
            <p className="text-sm text-muted-foreground">Frequenza di ritorno e fidelizzazione</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center gap-1 bg-muted/30 rounded-lg p-4">
              <span className="text-2xl font-bold">{customerMetrics.totalCustomers}</span>
              <span className="text-xs text-muted-foreground text-center">Clienti totali</span>
            </div>
            <div className="flex flex-col items-center gap-1 bg-muted/30 rounded-lg p-4">
              <span className="text-2xl font-bold text-green-600">+{customerMetrics.newCustomers}</span>
              <span className="text-xs text-muted-foreground text-center">Nuovi (30gg)</span>
            </div>
            <div className="flex flex-col items-center gap-1 bg-muted/30 rounded-lg p-4">
              <span className="text-2xl font-bold">{customerMetrics.returningRate}%</span>
              <span className="text-xs text-muted-foreground text-center">Clienti abituali</span>
            </div>
            <div className="flex flex-col items-center gap-1 bg-muted/30 rounded-lg p-4">
              <span className="text-2xl font-bold">{customerMetrics.avgVisitsPerCustomer}</span>
              <span className="text-xs text-muted-foreground text-center">Media visite / cliente</span>
            </div>
          </div>
        </div>
      ) : !isBusiness ? (
        <LockedSection upgradeTarget="Business" />
      ) : null}
    </PageWrapper>
  )
}
