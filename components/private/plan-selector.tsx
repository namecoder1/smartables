'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Info } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { createStripeSubscriptionCheckout } from '@/utils/stripe/actions'
import { PLANS } from '@/lib/plans'

export function PlanSelector() {
  const [isAnnual, setIsAnnual] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (priceId: string) => {
    setLoading(priceId)
    // await createStripeSubscriptionCheckout(priceId)
    await createStripeSubscriptionCheckout(priceId)
    setLoading(null)
  }

  return (
    <div className="space-y-8">

      {/* Interval Toggle */}
      <div className="flex items-center justify-center space-x-4">
        <Label htmlFor="billing-qs" className={`text-sm ${!isAnnual ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>Mensile</Label>
        <Switch
          id="billing-qs"
          checked={isAnnual}
          onCheckedChange={setIsAnnual}
        />
        <Label htmlFor="billing-qs" className={`text-sm ${isAnnual ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
          Annuale <span className="ml-1.5 inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">2 Mesi Gratis</span>
        </Label>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {PLANS.map((plan) => {
          const price = isAnnual ? plan.priceYear : plan.priceMonth
          const priceId = isAnnual ? plan.priceIdYear : plan.priceIdMonth
          const period = isAnnual ? '/anno' : '/mese'

          return (
            <Card key={plan.id} className={`flex flex-col ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
              <CardHeader>
                {plan.popular && <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Più Popolare</div>}
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">€{price}</span>
                  <span className="text-muted-foreground">{period}</span>
                </CardDescription>
                {isAnnual && (
                  <p className="text-xs text-green-600 font-medium mt-1">Risparmi €{(plan.priceMonth * 12) - plan.priceYear}</p>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className={`flex items-center gap-2 text-sm ${feature.startsWith('No') ? 'text-muted-foreground/70' : ''}`}>
                      <Check className={`h-4 w-4 shrink-0 ${feature.startsWith('No') ? 'text-muted-foreground/50' : 'text-primary'}`} />
                      <span className={feature.startsWith('No') ? 'line-through decoration-muted-foreground/50' : ''}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(priceId as string)}
                  disabled={!!loading}
                >
                  {loading === priceId ? 'Caricamento...' : isAnnual ? 'Scegli Annuale' : 'Scegli Mensile'}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
