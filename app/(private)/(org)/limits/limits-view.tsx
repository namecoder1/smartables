'use client'

import React, { useState, useTransition } from 'react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Users, MessageCircle, HardDrive, LayoutGrid, UtensilsCrossed,
  MapPin, ArrowRight, TrendingUp, Plus, BrainCircuit, BarChart3, Settings, CreditCard, Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { AddonConfig, PlanLimits } from '@/types/general'
import type { LimitsUsage } from './page'
import { addAddonToSubscription, createStripePortalSession } from '@/utils/stripe/actions'
import { ADDON_CATALOG, ADDON_COLOR_MAP } from '@/lib/addon-catalog'
import { BASE_KB_CHARS_BY_TIER, DEFAULT_BASE_KB_CHARS } from '@/lib/addons'
import { FaqContent } from '@/components/private/faq-section'
import { SanityFaq } from '@/utils/sanity/queries'

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  usage: LimitsUsage
  addonsConfig: AddonConfig
  planLimits: PlanLimits | null
  billingTier: string
  effectiveWaCap: number
  hasActiveSubscription: boolean
  addonPriceIds: Record<string, string | undefined>
  faqs: SanityFaq[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatStorage(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function pct(used: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.round((used / total) * 100))
}

// ── LimitCard ─────────────────────────────────────────────────────────────────

type LimitCardItem = {
  icon: React.ReactNode
  label: string
  usedLabel: string
  baseLimit: number
  addonExtra: number
  usedPct: number
  addonUnit?: string
  isUnlimited?: boolean
}

type SingleLimitCardProps = {
  variant?: 'default'
  icon: React.ReactNode
  label: string
  usedLabel: string
  baseLimit: number
  addonExtra: number
  usedPct: number
  isUnlimited?: boolean
  addonUnit?: string
}

type DoubleLimitCardProps = {
  variant: 'double'
  icon: React.ReactNode
  label: string
  items: [LimitCardItem, LimitCardItem]
}

type LimitCardProps = SingleLimitCardProps | DoubleLimitCardProps

function LimitCardRow({ item }: { item: LimitCardItem }) {
  const { icon, label, usedLabel, baseLimit, addonExtra, usedPct, addonUnit, isUnlimited } = item
  const total = baseLimit + addonExtra
  const hasAddon = addonExtra > 0
  const isWarning = usedPct >= 80 && usedPct < 100
  const isDanger = usedPct >= 100
  const barColor = isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-primary'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        </div>
        {hasAddon && (
          <Badge className="text-[10px] py-0 px-1.5 bg-violet-100 text-violet-700 border-violet-200 border">
            +{addonExtra} {addonUnit ?? 'extra'}
          </Badge>
        )}
      </div>
      {isUnlimited ? (
        <div>
          <p className="text-lg font-bold">{usedLabel}</p>
          <p className="text-[10px] text-muted-foreground">Illimitato nel tuo piano</p>
        </div>
      ) : (
        <>
          <div className="flex items-end justify-between">
            <p className="text-lg font-bold">{usedLabel}</p>
            <p className="text-[10px] text-muted-foreground">
              su <span className="font-semibold ml-1 text-foreground">{total}</span>
              {hasAddon && (
                <span className="text-violet-600"> ({baseLimit}+{addonExtra})</span>
              )}
            </p>
          </div>
          <div className="relative h-1.5 rounded-full overflow-hidden bg-muted">
            {hasAddon && (
              <div
                className="absolute right-0 top-0 h-full rounded-full bg-violet-200"
                style={{ width: `${(addonExtra / total) * 100}%` }}
              />
            )}
            <div
              className={cn('absolute left-0 top-0 h-full rounded-full transition-all', barColor)}
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{usedPct}% utilizzato</span>
            {isDanger && <span className="text-red-600 font-medium">Limite raggiunto</span>}
            {isWarning && <span className="text-amber-600 font-medium">Quasi esaurito</span>}
          </div>
        </>
      )}
    </div>
  )
}

function LimitCard(props: LimitCardProps) {
  if (props.variant === 'double') {
    const { icon, label, items } = props
    return (
      <Card className="border-2 py-0 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
              {icon}
            </div>
            <span className="font-semibold text-sm">{label}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {items.map((item, i) => (
              <LimitCardRow key={i} item={item} />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const { icon, label, usedLabel, baseLimit, addonExtra, usedPct, isUnlimited, addonUnit } = props
  const total = baseLimit + addonExtra
  const hasAddon = addonExtra > 0
  const isWarning = usedPct >= 80 && usedPct < 100
  const isDanger = usedPct >= 100
  const barColor = isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-primary'

  return (
    <Card className="border-2 py-0 shadow-sm">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
              {icon}
            </div>
            <span className="font-semibold text-sm">{label}</span>
          </div>
          {hasAddon && (
            <Badge className="text-xs bg-violet-100 text-violet-700 border-violet-200 border">
              +{addonExtra} {addonUnit ?? 'extra'}
            </Badge>
          )}
        </div>

        {isUnlimited ? (
          <div>
            <p className="text-2xl font-bold">{usedLabel}</p>
            <p className="text-xs text-muted-foreground">Illimitato nel tuo piano</p>
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold">{usedLabel}</p>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  su <span className="font-semibold text-foreground">{total}</span>
                  {hasAddon && (
                    <span className="text-violet-600"> ({baseLimit} + <span className="font-semibold">{addonExtra}</span>)</span>
                  )}
                </p>
              </div>
            </div>

            {/* Split progress bar: base portion = grey-bg, addon portion = violet-bg */}
            <div className="relative h-2 rounded-full overflow-hidden bg-muted">
              {hasAddon && (
                <div
                  className="absolute right-0 top-0 h-full rounded-full bg-violet-200"
                  style={{ width: `${(addonExtra / total) * 100}%` }}
                />
              )}
              <div
                className={cn('absolute left-0 top-0 h-full rounded-full transition-all', barColor)}
                style={{ width: `${usedPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{usedPct}% utilizzato</span>
              {isDanger && <span className="text-red-600 font-medium">Limite raggiunto</span>}
              {isWarning && <span className="text-amber-600 font-medium">Quasi esaurito</span>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

type UpsellSuggestion = {
  title: string
  description: string
  ctaLabel: string
  ctaHref: string
  type: 'upgrade' | 'addon'
}

function computeUpsells(
  billingTier: string,
  addonsConfig: AddonConfig,
  usage: LimitsUsage,
  planLimits: PlanLimits | null,
): UpsellSuggestion[] {
  const suggestions: UpsellSuggestion[] = []
  if (!planLimits) return suggestions

  const hasAnyAddon =
    addonsConfig.extra_staff > 0 ||
    addonsConfig.extra_contacts_wa > 0 ||
    addonsConfig.extra_storage_mb > 0 ||
    addonsConfig.extra_locations > 0

  const totalStaff = planLimits.max_staff + addonsConfig.extra_staff
  const totalWa = planLimits.wa_contacts + addonsConfig.extra_contacts_wa
  const totalStorage = planLimits.storage_mb + addonsConfig.extra_storage_mb
  const totalLocations = planLimits.max_locations + addonsConfig.extra_locations

  const usageStorageMb = usage.storageBytes / (1024 * 1024)

  const highUsage = [
    pct(usage.staff, totalStaff) >= 80,
    pct(usage.contactsWa, totalWa) >= 80,
    pct(usageStorageMb, totalStorage) >= 80,
    pct(usage.locations, totalLocations) >= 80,
  ].filter(Boolean).length

  // Suggest plan upgrade if paying for addons that would be covered by next plan
  if (billingTier === 'starter') {
    if (hasAnyAddon || highUsage >= 2) {
      suggestions.push({
        type: 'upgrade',
        title: 'Passa al piano Growth',
        description: hasAnyAddon
          ? 'Stai pagando per add-on che sono già inclusi nel piano Growth. Potrebbe convenire fare l\'upgrade.'
          : 'Hai raggiunto il limite su più risorse. Il piano Growth offre capacità molto maggiori.',
        ctaLabel: 'Scopri Growth',
        ctaHref: '/billing',
      })
    }
  } else if (billingTier === 'growth') {
    if ((addonsConfig.extra_locations >= 2 || addonsConfig.extra_staff >= 10) || highUsage >= 2) {
      suggestions.push({
        type: 'upgrade',
        title: 'Passa al piano Business',
        description: 'Con le tue dimensioni attuali, il piano Business offre più sedi, staff illimitato e funzionalità avanzate incluse.',
        ctaLabel: 'Scopri Business',
        ctaHref: '/billing',
      })
    }
  }

  // Single-limit addon suggestions
  if (pct(usage.staff, totalStaff) >= 80 && billingTier !== 'business') {
    suggestions.push({
      type: 'addon',
      title: 'Staff Power Pack',
      description: `Hai utilizzato ${pct(usage.staff, totalStaff)}% degli account staff. Aggiungi un pacchetto per +5 account.`,
      ctaLabel: 'Aggiungi Pack',
      ctaHref: '/billing',
    })
  }
  if (pct(usage.contactsWa, totalWa) >= 80) {
    suggestions.push({
      type: 'addon',
      title: 'Smart Contact Boost',
      description: `Hai utilizzato ${pct(usage.contactsWa, totalWa)}% dei contatti WhatsApp. Aggiungi un pacchetto per +200 contatti/mese.`,
      ctaLabel: 'Aggiungi Pack',
      ctaHref: '/billing',
    })
  }
  if (pct(usageStorageMb, totalStorage) >= 80) {
    suggestions.push({
      type: 'addon',
      title: 'Media Storage Plus',
      description: `Hai utilizzato ${pct(usageStorageMb, totalStorage)}% dello storage. Aggiungi un pacchetto per +500 MB.`,
      ctaLabel: 'Aggiungi Pack',
      ctaHref: '/billing',
    })
  }

  // Deduplicate: if upgrade is suggested, skip individual addon suggestions
  const hasUpgrade = suggestions.some(s => s.type === 'upgrade')
  if (hasUpgrade) return suggestions.filter(s => s.type === 'upgrade').slice(0, 1)

  return suggestions.slice(0, 2)
}

const TIER_LABELS: Record<string, string> = {
  starter: 'Starter',
  growth: 'Growth',
  business: 'Business',
}

type PendingAddon = {
  name: string
  description: string
  priceMonth: number
  priceId: string
  color: string
  Icon: React.ElementType
}

export default function LimitsView({ 
  usage, 
  addonsConfig, 
  planLimits, 
  billingTier, 
  effectiveWaCap, 
  hasActiveSubscription, 
  addonPriceIds,
  faqs
}: Props) {
  const limits = planLimits
  const tier = TIER_LABELS[billingTier] ?? billingTier
  const [pendingAddon, setPendingAddon] = useState<PendingAddon | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    if (!pendingAddon) return
    startTransition(async () => {
      const formData = new FormData()
      formData.set('priceId', pendingAddon.priceId)
      await addAddonToSubscription(formData)
    })
  }

  const storageMbUsed = usage.storageBytes / (1024 * 1024)
  const totalStaff = (limits?.max_staff ?? 5) + addonsConfig.extra_staff
  const totalLocations = (limits?.max_locations ?? 1) + addonsConfig.extra_locations
  const totalStorage = (limits?.storage_mb ?? 300) + addonsConfig.extra_storage_mb
  const totalWa = effectiveWaCap
  const totalMenus = limits?.max_menus ?? 5
  const totalZones = limits?.max_zones ?? 3
  const baseKbChars = BASE_KB_CHARS_BY_TIER[billingTier] ?? DEFAULT_BASE_KB_CHARS
  const totalKbChars = baseKbChars + addonsConfig.extra_kb_chars

  const isUnlimitedStaff = billingTier === 'business'

  const upsells = computeUpsells(billingTier, addonsConfig, usage, planLimits)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex gap-4 flex-col items-start md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Limiti del Piano</h1>
          <p className="text-muted-foreground">Monitora l'utilizzo delle risorse del tuo account</p>
        </div>
        <FaqContent 
          variant='minimized'
          title='Aiuto'
          faqs={faqs}
        />
      </div>

      {/* Legend */}
      {Object.values(addonsConfig).some(v => v > 0) && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span>Utilizzo attuale</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-violet-300" />
            <span>Capacità da add-on</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-muted border" />
            <span>Capacità piano base</span>
          </div>
        </div>
      )}

      {/* Limit cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <LimitCard
          icon={<Users className="h-4 w-4" />}
          label="Account Staff"
          usedLabel={isUnlimitedStaff ? `${usage.staff}` : `${usage.staff} / ${totalStaff}`}
          baseLimit={limits?.max_staff ?? 5}
          addonExtra={addonsConfig.extra_staff}
          usedPct={isUnlimitedStaff ? 0 : pct(usage.staff, totalStaff)}
          isUnlimited={isUnlimitedStaff}
          addonUnit="staff"
        />

        <LimitCard
          icon={<MessageCircle className="h-4 w-4" />}
          label="Contatti Automatizzati AI"
          usedLabel={`${usage.contactsWa} / ${totalWa}`}
          baseLimit={limits?.wa_contacts ?? 400}
          addonExtra={addonsConfig.extra_contacts_wa}
          usedPct={pct(usage.contactsWa, totalWa)}
          addonUnit="contatti"
        />

        <LimitCard
          icon={<HardDrive className="h-4 w-4" />}
          label="Storage Globale"
          usedLabel={`${formatStorage(usage.storageBytes)} / ${totalStorage >= 1024 ? `${(totalStorage / 1024).toFixed(1)} GB` : `${totalStorage} MB`}`}
          baseLimit={limits?.storage_mb ?? 300}
          addonExtra={addonsConfig.extra_storage_mb}
          usedPct={pct(storageMbUsed, totalStorage)}
          addonUnit="MB"
        />

        <LimitCard
          variant="double"
          icon={<LayoutGrid className="h-4 w-4" />}
          label="Layout Ristorante"
          items={[
            {
              icon: <LayoutGrid className="h-3.5 w-3.5" />,
              label: "Mappe Tavoli",
              usedLabel: `${usage.zones} / ${totalZones}`,
              baseLimit: totalZones,
              addonExtra: 0,
              usedPct: pct(usage.zones, totalZones),
            },
            {
              icon: <UtensilsCrossed className="h-3.5 w-3.5" />,
              label: "Menu Digitali",
              usedLabel: `${usage.menus} / ${totalMenus}`,
              baseLimit: totalMenus,
              addonExtra: 0,
              usedPct: pct(usage.menus, totalMenus),
            },
          ]}
        />

        <LimitCard
          icon={<MapPin className="h-4 w-4" />}
          label="Sedi"
          usedLabel={`${usage.locations} / ${totalLocations}`}
          baseLimit={limits?.max_locations ?? 1}
          addonExtra={addonsConfig.extra_locations}
          usedPct={pct(usage.locations, totalLocations)}
          addonUnit="sedi"
        />

        <LimitCard
          icon={<BrainCircuit className="h-4 w-4" />}
          label="Memoria Bot AI"
          usedLabel={`${usage.kbChars.toLocaleString('it-IT')} / ${totalKbChars >= 1000 ? `${(totalKbChars / 1000).toFixed(0)}k` : totalKbChars} car.`}
          baseLimit={baseKbChars}
          addonExtra={addonsConfig.extra_kb_chars}
          usedPct={pct(usage.kbChars, totalKbChars)}
          addonUnit="caratteri"
        />

      </div>
      {/* Analytics Feature Card */}
      {(() => {
        const hasAdvanced = (addonsConfig.extra_analytics ?? 0) > 0 || billingTier === 'growth' || billingTier === 'business'
        const analyticsAddon = ADDON_CATALOG.find(a => a.key === 'extra_analytics')
        const priceId = analyticsAddon ? addonPriceIds[analyticsAddon.priceIdEnv] : undefined
        return (
          <Card className="border-2 py-0 shadow-sm w-full">
            <CardContent className="p-5 space-y-3 justify-between flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-sm">Analitiche</span>
                </div>
                <Badge className={cn(
                  'text-xs border',
                  hasAdvanced
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : 'bg-muted text-muted-foreground border-border'
                )}>
                  {hasAdvanced ? 'Avanzate' : 'Basic'}
                </Badge>
              </div>
              <div className='mt-auto!'>
                <p className="text-2xl font-bold">{hasAdvanced ? 'Avanzate' : 'Basic'}</p>
                <p className="text-xs text-muted-foreground">
                  {hasAdvanced
                    ? 'Confronto periodi, orari di punta e analitiche WhatsApp avanzate'
                    : 'Panoramica base delle prenotazioni e statistiche'}
                </p>
              </div>
              {!hasAdvanced && hasActiveSubscription && billingTier === 'starter' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 w-full"
                  disabled={!priceId}
                  onClick={() => priceId && analyticsAddon && setPendingAddon({
                    name: analyticsAddon.name,
                    description: analyticsAddon.description,
                    priceMonth: analyticsAddon.priceMonth,
                    priceId,
                    color: analyticsAddon.color,
                    Icon: analyticsAddon.icon,
                  })}
                >
                  <Plus className="h-3 w-3" />
                  Sblocca Analitiche Avanzate
                </Button>
              )}
            </CardContent>
          </Card>
        )
      })()}

      {ADDON_CATALOG.some(a => (addonsConfig[a.key] ?? 0) > 0) && (
        <Card className="border-border shadow-sm pt-0">
          <div className="bg-muted/30 border-b px-6 py-4 flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Add-on Attivi</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Pacchetti aggiuntivi inclusi nel tuo abbonamento</p>
            </div>
            <form action={createStripePortalSession}>
              <Button size="sm" variant="ghost" className="gap-2">
                <Settings className="h-4 w-4" />
                Gestisci
              </Button>
            </form>
          </div>
          <CardContent className="px-4 grid sm:grid-cols-2 gap-3">
            {ADDON_CATALOG.filter(a => (addonsConfig[a.key] ?? 0) > 0).map((addon) => {
              const c = ADDON_COLOR_MAP[addon.color]
              const Icon = addon.icon
              const value = addonsConfig[addon.key] ?? 0
              return (
                <div key={addon.key} className={cn('flex items-center gap-3 p-3 rounded-lg border-2', c.bg, c.border)}>
                  <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', c.badge)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{addon.name}</p>
                    <p className={cn('text-xs font-medium', c.text)}>
                      {addon.key === 'extra_analytics'
                        ? 'Avanzate attive'
                        : `+${value} ${addon.key === 'extra_storage_mb' ? 'MB' : addon.key === 'extra_kb_chars' ? 'chars' : 'unità'}`}
                    </p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {hasActiveSubscription && ADDON_CATALOG.some(a => (addonsConfig[a.key] ?? 0) === 0) && (
        <Card className="border-border shadow-sm py-0 gap-0">
          <div className="bg-muted/30 border-b px-6 py-4">
            <CardTitle className="text-base">Espandi il tuo piano</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Aggiungi capacità extra senza cambiare piano</p>
          </div>
          <CardContent className="p-6 grid sm:grid-cols-2 gap-3">
            {ADDON_CATALOG.filter(a => (addonsConfig[a.key] ?? 0) === 0).map((addon) => {
              const c = ADDON_COLOR_MAP[addon.color]
              const Icon = addon.icon
              const priceId = addonPriceIds[addon.priceIdEnv]
              const includedInPlan = addon.starterOnly && billingTier !== 'starter'
              return (
                <div key={addon.key} className={cn('flex items-center gap-3 p-3 rounded-xl border-2 border-border bg-background', includedInPlan && 'opacity-60')}>
                  <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', c.badge)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{addon.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {includedInPlan ? 'Il tuo piano prevede già questa feature' : addon.description}
                    </p>
                    {!includedInPlan && (
                      <p className={cn('text-xs font-semibold mt-0.5', c.text)}>€{addon.priceMonth.toFixed(2).replace('.', ',')}/mese</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 shrink-0"
                    disabled={includedInPlan || !priceId}
                    onClick={() => !includedInPlan && priceId && setPendingAddon({
                      name: addon.name,
                      description: addon.description,
                      priceMonth: addon.priceMonth,
                      priceId,
                      color: addon.color,
                      Icon: addon.icon,
                    })}
                  >
                    {includedInPlan ? 'Incluso' : <><Plus className="h-3 w-3" />Aggiungi</>}
                  </Button>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!pendingAddon} onOpenChange={(open) => { if (!open) setPendingAddon(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma acquisto</DialogTitle>
            <DialogDescription>
              Verrà addebitato immediatamente sulla carta salvata. L'importo sarà proporzionale ai giorni rimanenti del ciclo di fatturazione.
            </DialogDescription>
          </DialogHeader>
          {pendingAddon && (() => {
            const c = ADDON_COLOR_MAP[pendingAddon.color]
            const Icon = pendingAddon.Icon
            return (
              <div className={cn('flex items-center gap-3 p-4 rounded-lg border-2', c.bg, c.border)}>
                <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', c.badge)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{pendingAddon.name}</p>
                  <p className="text-sm text-muted-foreground">{pendingAddon.description}</p>
                  <p className={cn('text-sm font-bold mt-1', c.text)}>€{pendingAddon.priceMonth.toFixed(2).replace('.', ',')}/mese</p>
                </div>
              </div>
            )
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingAddon(null)} disabled={isPending}>
              Annulla
            </Button>
            <Button onClick={handleConfirm} disabled={isPending} className="gap-2">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              {isPending ? 'Elaborazione…' : 'Conferma e paga'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {upsells.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Suggerimenti</h2>
          {upsells.map((u, i) => (
            <Card key={i} className={cn(
              'border-2 py-0 shadow-sm',
              u.type === 'upgrade' ? 'border-violet-200 bg-violet-50/50' : 'border-amber-200 bg-amber-50/50'
            )}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={cn(
                  'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                  u.type === 'upgrade' ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700'
                )}>
                  {u.type === 'upgrade' ? <TrendingUp className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{u.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{u.description}</p>
                </div>
                <Button asChild size="sm" variant={u.type === 'upgrade' ? 'default' : 'outline'} className="shrink-0 gap-1">
                  <Link href={u.ctaHref}>
                    {u.ctaLabel}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
