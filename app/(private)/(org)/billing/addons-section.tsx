'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Plus, CreditCard, Loader2, Trash2, Check, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { addAddonToSubscription, removeAddonFromSubscription } from '@/utils/stripe/actions'
import type { AddonConfig } from '@/types/general'
import { ADDON_CATALOG, ADDON_COLOR_MAP } from '@/lib/addon-catalog'
import { ScrollArea } from '@/components/ui/scroll-area'

type PendingPurchase = {
  name: string; description: string; priceMonth: number
  priceId: string; color: string; Icon: React.ElementType
}
type PendingRemoval = {
  name: string; priceId: string; color: string; Icon: React.ElementType
}

type Props = {
  addonsConfig: AddonConfig
  addonPriceIds: Record<string, string | undefined>
  billingTier: string
  variant: 'billing' | 'limits'
  /** When false, inactive addons are hidden (e.g. no active subscription) */
  canPurchase?: boolean
}

export default function AddonsSection({
  addonsConfig,
  addonPriceIds,
  billingTier,
  variant,
  canPurchase = true,
}: Props) {
  const [pendingPurchase, setPendingPurchase] = useState<PendingPurchase | null>(null)
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(null)
  const [isPurchasing, startPurchaseTransition] = useTransition()
  const [isRemoving, startRemoveTransition] = useTransition()

  const handlePurchase = () => {
    if (!pendingPurchase) return
    startPurchaseTransition(async () => {
      const fd = new FormData()
      fd.set('priceId', pendingPurchase.priceId)
      await addAddonToSubscription(fd)
    })
  }

  const handleRemove = () => {
    if (!pendingRemoval) return
    startRemoveTransition(async () => {
      await removeAddonFromSubscription(pendingRemoval.priceId, true)
    })
  }

  const activeAddons = ADDON_CATALOG.filter(a => (addonsConfig[a.key] ?? 0) > 0)
  const inactiveAddons = ADDON_CATALOG.filter(a => (addonsConfig[a.key] ?? 0) === 0)

  return (
    <>
      <Card className="border-2 shadow-sm py-0 gap-0">
        <div className="bg-muted/20 border-b-2 px-6 py-5 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-bold tracking-tight">Add-on</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Pacchetti extra per espandere il piano</p>
          </div>
          {activeAddons.length > 0 && (
            <Badge className="bg-green-100 text-green-700 border-green-200 border text-xs shrink-0">
              {activeAddons.length} {activeAddons.length === 1 ? 'attivo' : 'attivi'}
            </Badge>
          )}
        </div>

        {variant === 'billing' ? (
          <ScrollArea className='max-h-100 h-full'>
            <CardContent className={cn(
              'p-5', 'grid grid-cols-1 gap-3'
            )}>
              {/* Active addons */}
              {activeAddons.map((addon) => {
                const c = ADDON_COLOR_MAP[addon.color]
                const Icon = addon.icon
                const value = addonsConfig[addon.key] ?? 0
                const priceId = addonPriceIds[addon.priceIdEnv]

                return (
                  <div
                    key={addon.key}
                    className={cn('flex items-center gap-3 p-3 rounded-xl border-2', c.bg, c.border)}
                  >
                    <div className="relative shrink-0">
                      <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', c.badge)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{addon.name}</p>
                      <p className={cn('text-xs font-medium', c.text)}>
                        {addon.key === 'extra_analytics'
                          ? 'Avanzate attive'
                          : `+${value} ${addon.key === 'extra_storage_mb' ? 'MB' : addon.key === 'extra_kb_chars' ? 'chars' : 'unità'}`}
                      </p>
                    </div>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => priceId && setPendingRemoval({ name: addon.name, priceId, color: addon.color, Icon: addon.icon })}
                      disabled={!priceId}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )
              })}

              {/* Inactive addons — shown only when canPurchase */}
              {canPurchase && inactiveAddons.map((addon) => {
                const c = ADDON_COLOR_MAP[addon.color]
                const Icon = addon.icon
                const priceId = addonPriceIds[addon.priceIdEnv]
                const includedInPlan = addon.starterOnly && billingTier !== 'starter'

                return (
                  <div
                    key={addon.key}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border-2 border-border bg-background',
                      includedInPlan && 'opacity-60',
                    )}
                  >
                    <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', c.badge)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{addon.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {includedInPlan ? 'Incluso nel tuo piano' : addon.description}
                      </p>
                      {!includedInPlan && (
                        <p className={cn('text-xs font-bold mt-0.5', c.text)}>
                          €{addon.priceMonth.toFixed(2).replace('.', ',')}/mese
                        </p>
                      )}
                    </div>
                    <Button
                      size={includedInPlan ? 'sm' : 'icon-sm'}
                      variant="outline"
                      className="shrink-0"
                      disabled={includedInPlan || !priceId}
                      onClick={() =>
                        !includedInPlan && priceId &&
                        setPendingPurchase({
                          name: addon.name,
                          description: addon.description,
                          priceMonth: addon.priceMonth,
                          priceId,
                          color: addon.color,
                          Icon: addon.icon,
                        })
                      }
                    >
                      {includedInPlan ? 'Incluso' : <Plus className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                )
              })}

              {/* Empty state */}
              {activeAddons.length === 0 && !canPurchase && (
                <div className="col-span-full py-6 text-center text-sm text-muted-foreground">
                  Nessun add-on attivo
                </div>
              )}
            </CardContent>
          </ScrollArea>
        ) : (
          <CardContent className={cn(
            'p-5', 'grid sm:grid-cols-2 xl:grid-cols-3 gap-3'
          )}>
            {/* Active addons */}
            {activeAddons.map((addon) => {
              const c = ADDON_COLOR_MAP[addon.color]
              const Icon = addon.icon
              const value = addonsConfig[addon.key] ?? 0
              const priceId = addonPriceIds[addon.priceIdEnv]

              return (
                <div
                  key={addon.key}
                  className={cn('flex items-center gap-3 p-3 rounded-xl border-2', c.bg, c.border)}
                >
                  <div className="relative shrink-0">
                    <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', c.badge)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{addon.name}</p>
                    <p className={cn('text-xs font-medium', c.text)}>
                      {addon.key === 'extra_analytics'
                        ? 'Avanzate attive'
                        : `+${value} ${addon.key === 'extra_storage_mb' ? 'MB' : addon.key === 'extra_kb_chars' ? 'chars' : 'unità'}`}
                    </p>
                  </div>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => priceId && setPendingRemoval({ name: addon.name, priceId, color: addon.color, Icon: addon.icon })}
                    disabled={!priceId}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )
            })}

            {/* Inactive addons — shown only when canPurchase */}
            {canPurchase && inactiveAddons.map((addon) => {
              const c = ADDON_COLOR_MAP[addon.color]
              const Icon = addon.icon
              const priceId = addonPriceIds[addon.priceIdEnv]
              const includedInPlan = addon.starterOnly && billingTier !== 'starter'

              return (
                <div
                  key={addon.key}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border-2 border-border bg-background',
                    includedInPlan && 'opacity-60',
                  )}
                >
                  <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', c.badge)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{addon.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {includedInPlan ? 'Incluso nel tuo piano' : addon.description}
                    </p>
                    {!includedInPlan && (
                      <p className={cn('text-xs font-bold mt-0.5', c.text)}>
                        €{addon.priceMonth.toFixed(2).replace('.', ',')}/mese
                      </p>
                    )}
                  </div>
                  <Button
                    size={includedInPlan ? 'sm' : 'icon-sm'}
                    variant="outline"
                    className="shrink-0"
                    disabled={includedInPlan || !priceId}
                    onClick={() =>
                      !includedInPlan && priceId &&
                      setPendingPurchase({
                        name: addon.name,
                        description: addon.description,
                        priceMonth: addon.priceMonth,
                        priceId,
                        color: addon.color,
                        Icon: addon.icon,
                      })
                    }
                  >
                    {includedInPlan ? 'Incluso' : <Plus className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              )
            })}

            {/* Empty state */}
            {activeAddons.length === 0 && !canPurchase && (
              <div className="col-span-full py-6 text-center text-sm text-muted-foreground">
                Nessun add-on attivo
              </div>
            )}
          </CardContent>
        )}
        
      </Card>

      {/* ── Purchase dialog ── */}
      <Dialog open={!!pendingPurchase} onOpenChange={(open) => { if (!open) setPendingPurchase(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma acquisto</DialogTitle>
            <DialogDescription>
              Verrà addebitato immediatamente sulla carta salvata. L&apos;importo sarà proporzionale ai giorni rimanenti del ciclo di fatturazione.
            </DialogDescription>
          </DialogHeader>
          {pendingPurchase && (() => {
            const c = ADDON_COLOR_MAP[pendingPurchase.color]
            const Icon = pendingPurchase.Icon
            return (
              <div className={cn('flex items-center gap-3 p-4 rounded-xl border-2', c.bg, c.border)}>
                <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', c.badge)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{pendingPurchase.name}</p>
                  <p className="text-sm text-muted-foreground">{pendingPurchase.description}</p>
                  <p className={cn('text-sm font-bold mt-1', c.text)}>
                    €{pendingPurchase.priceMonth.toFixed(2).replace('.', ',')}/mese
                  </p>
                </div>
              </div>
            )
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingPurchase(null)} disabled={isPurchasing}>
              Annulla
            </Button>
            <Button onClick={handlePurchase} disabled={isPurchasing} className="gap-2">
              {isPurchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              {isPurchasing ? 'Elaborazione…' : 'Conferma e paga'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Removal dialog ── */}
      <Dialog open={!!pendingRemoval} onOpenChange={(open) => { if (!open && !isRemoving) setPendingRemoval(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rimuovi add-on</DialogTitle>
            <DialogDescription>
              L&apos;add-on verrà rimosso immediatamente. Riceverai un accredito proporzionale ai giorni rimanenti del ciclo, scalato dalla prossima fattura.
            </DialogDescription>
          </DialogHeader>
          {pendingRemoval && (() => {
            const c = ADDON_COLOR_MAP[pendingRemoval.color]
            const Icon = pendingRemoval.Icon
            return (
              <div className={cn('flex items-center gap-3 p-4 rounded-xl border-2', c.bg, c.border)}>
                <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', c.badge)}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-semibold">{pendingRemoval.name}</p>
              </div>
            )
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingRemoval(null)} disabled={isRemoving}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={isRemoving} className="gap-2">
              {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {isRemoving ? 'Rimozione…' : 'Rimuovi add-on'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
