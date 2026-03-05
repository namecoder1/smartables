import { DonutPie } from '@/components/charts/donut-pie';
import { SimpleLine } from '@/components/charts/simple-line'
import { AreaChart } from '@/components/charts/area-chart';
import { ChartBar } from '@/components/charts/chart-bar';
import { getAnalyticsData } from './actions';
import PageWrapper from '@/components/private/page-wrapper';
import { Metadata } from 'next';
import AnalyticsLiveUpdater from '@/components/analytics/analytics-live-updater';
import { createClient } from '@/utils/supabase/server';
import { PLANS } from '@/lib/plans';
import { redirect } from 'next/navigation';
import { MetricCard } from '@/components/analytics/metric-card';
import { Users, CalendarDays, TrendingUp, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { EmptyChartState } from '@/components/analytics/empty-chart-state';

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'Visualizza le statistiche dei tuoi clienti e delle tue prenotazioni.',
}

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return <div>Organizzazione non trovata.</div>

  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_price_id')
    .eq('id', profile.organization_id)
    .single()

  // Find active plan
  const currentPlan = PLANS.find(p => p.priceIdMonth === org?.stripe_price_id || p.priceIdYear === org?.stripe_price_id)
  const isBusiness = currentPlan?.id === 'business';

  const analyticsData = await getAnalyticsData()

  if (!analyticsData) {
    return (
      <PageWrapper>
        <div>Errore nel caricamento dei dati.</div>
      </PageWrapper>
    )
  }

  const {
    sources,
    hottestDays,
    hottestHours,
    weeklyTrends,
    longTermTrends,
    totalBookings,
    averageCovers
  } = analyticsData

  return (
    <PageWrapper>
      <AnalyticsLiveUpdater />
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            {isBusiness
              ? "Statistiche avanzate per il tuo business."
              : "Panoramica delle attività del tuo ristorante."}
          </p>
        </div>
        {!isBusiness && (
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Passa a Business per analitiche avanzate</span>
            <Button size="sm" variant="default" asChild className='ml-2'>
              <Link href="/billing">Upgrade</Link>
            </Button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Prenotazioni Totali"
          value={totalBookings}
          description="All time"
          icon={CalendarDays}
        />
        {isBusiness ? (
          <MetricCard
            title="Coperti Medi"
            value={averageCovers}
            description="Per prenotazione"
            icon={Users}
          />
        ) : (
          <MetricCard
            title="Coperti Medi"
            value="-"
            description="Disponibile nel piano Business"
            icon={Users}
            className="opacity-60"
          />
        )}
        {/* Placeholder for future metrics or simplified views */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="col-span-1 border p-4 rounded-xl bg-card text-card-foreground shadow-sm flex flex-col">
          <h2 className="text-lg font-semibold mb-2">Canali di Prenotazione</h2>
          <div className="flex-1 min-h-[250px] relative">
            {sources.length > 0 ? (
              <DonutPie data={sources} />
            ) : (
              <EmptyChartState className="h-full border-none bg-transparent" />
            )}
          </div>
        </div>
        <div className="col-span-1 lg:col-span-2 border p-4 rounded-xl bg-card text-card-foreground shadow-sm flex flex-col">
          <h2 className="text-lg font-semibold mb-2">Trend Settimanale</h2>
          <div className="flex-1 min-h-[250px] relative">
            {weeklyTrends && weeklyTrends.some(w => w.visitors > 0) ? (
              <SimpleLine data={weeklyTrends} />
            ) : (
              <EmptyChartState className="h-full border-none bg-transparent" />
            )}
          </div>
        </div>
      </div>

      {isBusiness && (
        <>
          <div className="border p-6 rounded-xl bg-card text-card-foreground shadow-sm">
            <div className='mb-4'>
              <h2 className="text-lg font-semibold">Afflusso (Ultimi 3 mesi)</h2>
              <p className="text-sm text-muted-foreground">Andamento delle visite nel tempo</p>
            </div>
            <div className="min-h-[300px]">
              {longTermTrends && longTermTrends.length > 0 ? (
                <AreaChart data={longTermTrends} />
              ) : (
                <EmptyChartState className="h-[300px] border-none bg-transparent" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hottest Days */}
            <div className="flex flex-col h-full">
              {hottestDays && hottestDays.some(d => d.bookings > 0) ? (
                <ChartBar
                  data={hottestDays}
                  title="Giorni più popolari"
                  description="Prenotazioni totali per giorno della settimana"
                  dataKeyX="day"
                  dataKeyY="bookings"
                  config={{
                    bookings: {
                      label: "Prenotazioni",
                      color: "hsl(var(--chart-1))"
                    }
                  }}
                />
              ) : (
                <div className="border p-6 rounded-xl bg-card text-card-foreground shadow-sm h-full flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">Giorni più popolari</h3>
                    <p className="text-sm text-muted-foreground">Prenotazioni totali per giorno della settimana</p>
                  </div>
                  <div className="flex-1">
                    <EmptyChartState className="h-full border-none bg-transparent" />
                  </div>
                </div>
              )}
            </div>

            {/* Hottest Hours */}
            <div className="flex flex-col h-full">
              {hottestHours && hottestHours.some(h => h.bookings > 0) ? (
                <ChartBar
                  data={hottestHours}
                  title="Orari di punta"
                  description="Prenotazioni totali per fascia oraria"
                  dataKeyX="hour"
                  dataKeyY="bookings"
                  config={{
                    bookings: {
                      label: "Prenotazioni",
                      color: "hsl(var(--chart-2))"
                    }
                  }}
                  fill="hsl(var(--chart-2))"
                />
              ) : (
                <div className="border p-6 rounded-xl bg-card text-card-foreground shadow-sm h-full flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">Orari di punta</h3>
                    <p className="text-sm text-muted-foreground">Prenotazioni totali per fascia oraria</p>
                  </div>
                  <div className="flex-1">
                    <EmptyChartState className="h-full border-none bg-transparent" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!isBusiness && (
        <div className="opacity-50 pointer-events-none filter blur-[2px] select-none relative overflow-hidden">
          {/* Blurred Preview of Advanced Analytics */}
          <div className="border p-6 rounded-xl bg-card text-card-foreground shadow-sm mb-4">
            <div className='mb-4'>
              <h2 className="text-lg font-semibold">Afflusso (Ultimi 3 mesi)</h2>
            </div>
            <div className="h-[300px] bg-muted/20 animate-pulse rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-[300px] bg-muted/20 animate-pulse rounded border"></div>
            <div className="h-[300px] bg-muted/20 animate-pulse rounded border"></div>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-background/50 backdrop-blur-[1px]">
            {/* This overlay shouldn't be blocked by pointer-events-none but current structure wraps it. 
                       Actually, making the container pointer-events-none prevents clicking the upgrade button if it was inside.
                       Since the Upgrade CTA is at the top, this is just for visual effect.
                   */}
          </div>
        </div>
      )}
    </PageWrapper>
  )
}