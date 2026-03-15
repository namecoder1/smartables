'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Plus, CreditCard, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { addAddonToSubscription } from '@/utils/stripe/actions'
import type { AddonConfig } from '@/types/general'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ADDON_CATALOG, ADDON_COLOR_MAP } from '@/lib/addon-catalog'

type PendingAddon = { name: string; description: string; priceMonth: number; priceId: string; color: string; Icon: React.ElementType }

type Props = {
  addonsConfig: AddonConfig
  addonPriceIds: Record<string, string | undefined>
  billingTier: string
  variant?: 'default' | 'minimal'
}

export default function AddonPurchaseSection({ addonsConfig, addonPriceIds, billingTier, variant = 'default' }: Props) {
  const [pendingAddon, setPendingAddon] = useState<PendingAddon | null>(null)
  const [isPending, startTransition] = useTransition()

  const availableAddons = ADDON_CATALOG.filter(a => (addonsConfig[a.key] ?? 0) === 0)
  if (availableAddons.length === 0) return null

  const handleConfirm = () => {
    if (!pendingAddon) return
    startTransition(async () => {
      const formData = new FormData()
      formData.set('priceId', pendingAddon.priceId)
      await addAddonToSubscription(formData)
    })
  }

  if (variant === 'minimal') {
    return (
      <>
        <Card className="border-border h-fit shadow-sm py-0 gap-0">
          <div className="bg-muted/30 border-b px-6 py-4">
            <CardTitle className="text-base">Espandi il tuo piano</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Aggiungi capacità extra senza cambiare piano</p>
          </div>
          <CardContent className="px-4">
            <ScrollArea className='h-80 flex flex-row xl:flex-col gap-3'>
              {availableAddons.map((addon) => {
                const c = ADDON_COLOR_MAP[addon.color]
                const Icon = addon.icon
                const priceId = addonPriceIds[addon.priceIdEnv]
                const includedInPlan = addon.starterOnly && billingTier !== 'starter'
                return (
                  <div key={addon.key} className={cn('flex items-center gap-3 my-3 p-2 rounded-xl border-2 border-border bg-background', includedInPlan && 'opacity-60')}>
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
                      onClick={() => !includedInPlan && priceId && setPendingAddon({ name: addon.name, description: addon.description, priceMonth: addon.priceMonth, priceId, color: addon.color, Icon: addon.icon })}
                    >
                      {includedInPlan ? 'Incluso' : <><Plus className="h-3 w-3" />Aggiungi</>}
                    </Button>
                  </div>
                )
              })}
            </ScrollArea>
          </CardContent>
        </Card>

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
      </>
    )
  }

  return (
    <>
      <Card className="border-border shadow-sm py-0">
        <div className="bg-muted/30 border-b px-6 py-4">
          <CardTitle className="text-base">Espandi il tuo piano</CardTitle>
          <p className="text-sm text-muted-foreground mt-0.5">Aggiungi capacità extra senza cambiare piano</p>
        </div>
        <CardContent className="p-6 grid sm:grid-cols-2 gap-3">
          {availableAddons.map((addon) => {
            const c = ADDON_COLOR_MAP[addon.color]
            const Icon = addon.icon
            const priceId = addonPriceIds[addon.priceIdEnv]
            const includedInPlan = addon.starterOnly && billingTier !== 'starter'
            return (
              <div key={addon.key} className={cn('flex items-center gap-3 p-3 rounded-lg border-2 border-border bg-background', includedInPlan && 'opacity-60')}>
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
                  onClick={() => !includedInPlan && priceId && setPendingAddon({ name: addon.name, description: addon.description, priceMonth: addon.priceMonth, priceId, color: addon.color, Icon: addon.icon })}
                >
                  {includedInPlan ? 'Incluso' : <><Plus className="h-3 w-3" />Aggiungi</>}
                </Button>
              </div>
            )
          })}
        </CardContent>
      </Card>

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
    </>
  )
}
