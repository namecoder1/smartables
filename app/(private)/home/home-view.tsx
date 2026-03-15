'use client'

import React, { useMemo } from 'react'
import { subDays, format } from 'date-fns'
import { LineChart, Line } from 'recharts'
import { DonutPie } from '@/components/charts/donut-pie'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowUp, ArrowDown, Minus, Users, Check, UtensilsCrossed, Map as MapIcon, LayoutGrid,
  Smartphone, BrainCog, Plus,
  ExternalLink,
  Mail,
  MessageSquare,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { DEFAULT_ADDON_CONFIG, ADDON_UNIT_VALUE } from '@/lib/addons'
import { ADDON_CATALOG } from '@/lib/addon-catalog'
import type { AddonConfig } from '@/types/general'
import type { FeatureStatus } from '@/actions/get-feature-status'

type BookingEntry = {
  booking_time: string
  guests_count: number
  source: string
}

type OrderEntry = {
  created_at: string
  total_amount: number
}

export type HomeViewProps = {
  firstName: string
  org: {
    slug: string
    whatsapp_usage_count: number
    usage_cap_whatsapp: number
    addons_config: AddonConfig | null
    billing_tier: string
  }
  bookings: BookingEntry[]
  orders: OrderEntry[]
  featureStatus: FeatureStatus
  resourcesSection: React.ReactNode
}

// ── Main component ───────────────────────────────────────────────────────────

export default function HomeView({
  firstName, org, bookings, orders, featureStatus, resourcesSection,
}: HomeViewProps) {
  const now = new Date()
  const currentWeekStart = subDays(now, 7)
  const previousWeekStart = subDays(now, 14)

  const stats = useMemo(() => {
    // Build daily series for last 30 days
    const buildSeries = (entries: { d: string; v: number }[]) => {
      const map = new Map<string, number>()
      for (let i = 29; i >= 0; i--) map.set(format(subDays(now, i), 'yyyy-MM-dd'), 0)
      entries.forEach(({ d, v }) => { if (map.has(d)) map.set(d, map.get(d)! + v) })
      return Array.from(map.entries()).map(([x, y]) => ({ x, y }))
    }

    const calcTrend = (entries: { d: string; v: number }[]) => {
      const curr = entries.filter(e => new Date(e.d) >= currentWeekStart).reduce((s, e) => s + e.v, 0)
      const prev = entries.filter(e => {
        const dt = new Date(e.d)
        return dt >= previousWeekStart && dt < currentWeekStart
      }).reduce((s, e) => s + e.v, 0)
      if (prev === 0) return curr > 0 ? 100 : 0
      return ((curr - prev) / prev) * 100
    }

    const bookingEntries = bookings.map(b => ({ d: format(new Date(b.booking_time), 'yyyy-MM-dd'), v: 1 }))
    const coverEntries = bookings.map(b => ({ d: format(new Date(b.booking_time), 'yyyy-MM-dd'), v: b.guests_count }))
    const revenueEntries = orders.map(o => ({ d: format(new Date(o.created_at), 'yyyy-MM-dd'), v: o.total_amount || 0 }))

    const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0)
    const waPercent = org.usage_cap_whatsapp > 0
      ? Math.min(100, Math.round((org.whatsapp_usage_count / org.usage_cap_whatsapp) * 100))
      : 0

    return {
      bookings: { total: bookings.length, trend: calcTrend(bookingEntries), series: buildSeries(bookingEntries) },
      covers: { total: bookings.reduce((s, b) => s + b.guests_count, 0), trend: calcTrend(coverEntries), series: buildSeries(coverEntries) },
      revenue: { total: totalRevenue, trend: calcTrend(revenueEntries), series: buildSeries(revenueEntries) },
      waUsage: { count: org.whatsapp_usage_count, cap: org.usage_cap_whatsapp, percent: waPercent },
    }
  }, [bookings, orders, org])

  const addons: AddonConfig = { ...DEFAULT_ADDON_CONFIG, ...(org.addons_config ?? {}) }

  const setupDone = Math.round(
    ((featureStatus.hasMenu ? 1 : 0) + (featureStatus.hasFloors ? 1 : 0) + (featureStatus.hasTables ? 1 : 0)) / 3 * 100
  )

  return (
    <div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ciao, {firstName}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Panoramica di tutti i tuoi ristoranti — ultimi 30 giorni</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 my-6">
        <StatCard
          title="Prenotazioni"
          value={stats.bookings.total}
          trend={stats.bookings.trend}
          series={stats.bookings.series}
        />
        <StatCard
          title="Coperti"
          value={stats.covers.total}
          trend={stats.covers.trend}
          series={stats.covers.series}
        />
        <StatCard
          title="Revenue"
          value={`€${stats.revenue.total.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`}
          trend={stats.revenue.trend}
          series={stats.revenue.series}
        />
        <WaStatCard
          count={stats.waUsage.count}
          cap={stats.waUsage.cap}
          percent={stats.waUsage.percent}
        />
      </div>

      <div className='grid lg:grid-cols-3 gap-6'>
        <div className='space-y-6 lg:col-span-2'>
          <div className="grid max-[882px]:grid-cols-1 max-[1024px]:grid-cols-2 min-[1470px]:grid-cols-1 2xl:grid-cols-12 gap-6">
            <Card className='py-0 gap-0 min-[1470px]:w-full 2xl:col-span-5 '>
              <CardHeader className="border-b-2 py-5 flex items-center gap-3">
                <CardTitle className="text-lg font-bold tracking-tight">
                  Canale prenotazioni
                </CardTitle>
              </CardHeader>
              <CardContent className='mt-auto pb-4'>
                <div className="w-full max-w-64 mx-auto">
                  <DonutPie data={bookings} />
                </div>
              </CardContent>
            </Card>

            <div className="min-[1470px]:w-full 2xl:col-span-7">
              <AddonsSection addons={addons} billingTier={org.billing_tier} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 shadow-sm py-0 gap-0">
              <CardHeader className="border-b-2 bg-muted/20 py-5 flex justify-between items-center gap-3">
                <CardTitle className="text-lg font-bold tracking-tight">Checklist Setup</CardTitle>
                <span className="text-xs font-bold text-muted-foreground bg-muted/70 border-2 px-3 py-1 rounded-full">
                  {setupDone}%
                </span>
              </CardHeader>
              <div className="grid gap-2 p-2">
                <FeatureTaskCard
                  completed={featureStatus.hasMenu}
                  label="Crea il tuo Menu"
                  description="Aggiungi piatti per l'AI"
                  link="/menus-management"
                  icon={<UtensilsCrossed className="w-5 h-5" />}
                />
                <FeatureTaskCard
                  completed={featureStatus.hasFloors}
                  label="Configura Sale"
                  description="Definisci le aree del ristorante"
                  link="/areas-management"
                  icon={<MapIcon className="w-5 h-5" />}
                />
                <FeatureTaskCard
                  completed={featureStatus.hasTables}
                  label="Aggiungi Tavoli"
                  description="Posiziona i tavoli sulle mappe"
                  link="/areas-management"
                  icon={<LayoutGrid className="w-5 h-5" />}
                />
              </div>
            </Card>

            <Card className="border-2 shadow-sm py-0 gap-0">
              <CardHeader className="border-b-2 py-5 flex items-center gap-3">
                <CardTitle className="text-lg font-bold tracking-tight">Prossimi Passi</CardTitle>
              </CardHeader>
              <div className="grid gap-2 p-2">
                {!featureStatus.hasTeam && (
                  <ActionCard
                    title="Invita il tuo Team"
                    description="Collabora con i tuoi colleghi"
                    link="/collaborators-management"
                    icon={<Users className="w-5 h-5" />}
                  />
                )}
                <ActionCard
                  title="Configura WhatsApp"
                  description="Gestisci i flussi e i messaggi automatici"
                  link="/bot-settings"
                  icon={<Smartphone className="w-5 h-5" />}
                />
                <ActionCard
                  title="Memoria del Bot"
                  description="Istruzioni AI personalizzate per sede"
                  link="/bot-memory"
                  icon={<BrainCog className="w-5 h-5" />}
                />
              </div>
            </Card>

          </div>
        </div>
        <div className="space-y-6">
          {resourcesSection}
          <SupportSection />
        </div>
      </div>
    </div>
  )
}

const SupportSection = () => (
  <Card className="border-2 shadow-sm py-0 gap-0">
    <CardHeader className="border-b-2 bg-muted/20 py-5 flex items-center gap-3">
      <CardTitle className="text-lg font-bold tracking-tight">
        Supporto Tecnico
      </CardTitle>
    </CardHeader>
    <CardContent className="p-5 space-y-4">
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="bg-blue-50 border-blue-200 hover:bg-blue-100 w-full justify-start h-auto py-3 px-4 gap-3 border-2"
          asChild
        >
          <Link href="#">
            <MessageSquare className="h-4 w-4 text-blue-600 shrink-0" />
            <div className="text-left">
              <div className="font-semibold text-sm">Live Chat</div>
              <div className="text-xs text-muted-foreground">Parla con un esperto</div>
            </div>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="bg-purple-50 border-purple-200 hover:bg-purple-100 w-full justify-start h-auto py-3 px-4 gap-3 border-2"
          asChild
        >
          <Link href="mailto:support@smartables.app">
            <Mail className="h-4 w-4 text-purple-600 shrink-0" />
            <div className="text-left">
              <div className="font-semibold text-sm">Supporto Email</div>
              <div className="text-xs text-muted-foreground">Risposta in 24h</div>
            </div>
          </Link>
        </Button>
      </div>
      <div className="pt-1">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Domande Frequenti
        </h4>
        <ul className="space-y-1">
          {[
            'Come reimpostare la password?',
            "Guida alla verifica dell'account",
            'Gestione dei metodi di pagamento',
          ].map((item) => (
            <li key={item}>
              <Link
                href="#"
                className="flex items-center justify-between text-sm text-foreground/80 hover:text-primary transition-colors py-1.5"
              >
                <span>{item}</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </CardContent>
  </Card>
)

// ── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  title, value, trend, series,
}: {
  title: string
  value: string | number
  trend: number
  series: { x: string; y: number }[]
}) {
  const trendType = trend > 1 ? 'positive' : trend < -1 ? 'negative' : 'neutral'
  const lineColor = trendType === 'positive' ? '#287907' : trendType === 'negative' ? '#E53935' : '#A3A3A3'
  const colorClass = {
    positive: 'bg-[#cdf1bf] text-[#287907]',
    negative: 'bg-red-100 text-red-800',
    neutral: 'bg-gray-100 text-gray-800',
  }[trendType]
  const TrendIcon = trendType === 'positive' ? ArrowUp : trendType === 'negative' ? ArrowDown : Minus

  return (
    <div className="bg-card text-card-foreground rounded-3xl flex items-start gap-2 border-2 py-5 px-4 shadow-sm min-h-35">
      <div className="flex flex-col justify-between h-full flex-1">
        <h2 className="text-md sm:text-lg text-muted-foreground font-semibold tracking-tight">{title}</h2>
        <div>
          <p className="text-xl sm:text-2xl font-bold tracking-tight">{value}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className={cn('flex items-center gap-1 w-fit py-1 px-2 rounded-xl', colorClass)}>
              <p className="text-[10px] font-bold">{trend > 0 ? '+' : ''}{trend.toFixed(1)}%</p>
              <TrendIcon size={12} />
            </div>
            <p className="text-xs text-muted-foreground font-medium">vs sett. scorsa</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end shrink-0">
        <LineChart width={72} height={44} data={series}>
          <Line type="monotone" dataKey="y" stroke={lineColor} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </div>
    </div>
  )
}

// ── WA stat card ─────────────────────────────────────────────────────────────

function WaStatCard({ count, cap, percent }: { count: number; cap: number; percent: number }) {
  const barColor = percent >= 80 ? 'bg-red-500' : percent >= 50 ? 'bg-amber-500' : 'bg-primary'

  return (
    <div className="bg-card text-card-foreground rounded-3xl flex flex-col justify-between gap-3 border-2 py-5 px-4 shadow-sm min-h-35">
      <h2 className="text-sm sm:text-base text-muted-foreground font-semibold tracking-tight">WA AI</h2>
      <div>
        <p className="text-xl sm:text-2xl font-bold tracking-tight">
          {count}
          <span className="text-sm font-normal text-muted-foreground ml-1">/ {cap}</span>
        </p>
        <div className="mt-2 w-full bg-muted rounded-full h-1.5">
          <div className={cn('h-1.5 rounded-full transition-all', barColor)} style={{ width: `${percent}%` }} />
        </div>
        <p className="text-xs text-muted-foreground font-medium mt-1.5">Contatti questo ciclo</p>
      </div>
    </div>
  )
}

// ── AddonsSection ─────────────────────────────────────────────────────────────

function AddonsSection({ addons, billingTier }: { addons: AddonConfig; billingTier: string }) {
  const active = ADDON_CATALOG.filter(a => addons[a.key] > 0)
  const available = ADDON_CATALOG.filter(a => addons[a.key] === 0)

  return (
    <Card className="border-2 shadow-sm h-full py-0 gap-0">
      <CardHeader className="border-b-2 bg-muted/20 py-5 flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-bold tracking-tight">Add-ons</CardTitle>
        <Button variant="outline" size="icon" className="h-7 text-xs rounded-lg" asChild>
          <Link href="/billing"><Settings /></Link>
        </Button>
      </CardHeader>

      <CardContent className="p-3 space-y-3">

        {/* Active add-ons */}
        {active.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">Attivi</p>
            {active.map((addon) => {
              const Icon = addon.icon
              return (
                <div key={addon.key} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold leading-tight">{addon.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {addon.key === 'extra_analytics' ? 'Analitiche avanzate attive' : `+${addons[addon.key]} ${addon.unitLabel}`}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">Attivo</Badge>
                </div>
              )
            })}
          </div>
        )}

        {/* Available add-ons */}
        {available.length > 0 && (
          <div className="space-y-1">
            {active.length > 0 && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 pt-1">Disponibili</p>
            )}
            {available.map((addon) => {
              const Icon = addon.icon
              const price = `€${addon.priceMonth.toFixed(2).replace('.', ',')}/mese`
              const includedInPlan = addon.starterOnly && billingTier !== 'starter'
              return (
                <div
                  key={addon.key}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-xl border transition-colors',
                    includedInPlan
                      ? 'border-transparent opacity-60'
                      : 'hover:bg-muted/40 border-transparent hover:border-border'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium leading-tight">{addon.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {includedInPlan
                          ? 'Il tuo piano prevede già questa feature'
                          : `+${ADDON_UNIT_VALUE[addon.key]} ${addon.unitLabel} · ${price}`}
                      </div>
                    </div>
                  </div>
                  <Button size={includedInPlan ? "sm" : "icon"} variant={includedInPlan ? "default" : "outline"} className="h-7 text-xs rounded-lg shrink-0" disabled={includedInPlan} asChild={!includedInPlan}>
                    {includedInPlan ? (
                      <span>Incluso</span>
                    ) : (
                      <Link href="/billing">
                        <Plus className="w-3 h-3" />
                      </Link>
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        )}

      </CardContent>
    </Card>
  )
}

// ── FeatureTaskCard ───────────────────────────────────────────────────────────

function FeatureTaskCard({
  completed, label, description, link, icon,
}: {
  completed: boolean
  label: string
  description: string
  link: string
  icon: React.ReactNode
}) {
  return (
    <div className={cn(
      'group relative flex items-center justify-between p-3 rounded-2xl border-2 transition-all duration-300',
      completed
        ? 'bg-card shadow-sm'
        : 'bg-card border-card-foreground/5 shadow-xs hover:border-primary/30 hover:shadow-md'
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300',
          completed ? 'bg-green-100 text-green-600 border-2 border-green-500' : 'bg-primary/5 text-primary group-hover:scale-110'
        )}>
          {completed ? <Check className="h-5 w-5" /> : icon}
        </div>
        <div>
          <div className={cn('font-bold text-sm leading-tight', completed && 'text-muted-foreground line-through')}>
            {label}
          </div>
          <p className="text-xs text-muted-foreground font-medium leading-tight mt-0.5">{description}</p>
        </div>
      </div>
      {!completed && (
        <Button size="sm" className="rounded-xl font-bold shadow-sm text-xs h-8" asChild>
          <Link href={link}>Configura</Link>
        </Button>
      )}
    </div>
  )
}

// ── ActionCard ───────────────────────────────────────────────────────────────

function ActionCard({
  title, description, link, icon,
}: {
  title: string
  description: string
  link: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border-2 hover:bg-muted transition-colors">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-white border shadow-sm flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
        <div>
          <div className="font-bold text-sm leading-none mb-0.5">{title}</div>
          <div className="text-xs text-muted-foreground font-medium">{description}</div>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="font-bold hover:bg-card rounded-xl text-xs" asChild>
        <Link href={link}>Vai</Link>
      </Button>
    </div>
  )
}
