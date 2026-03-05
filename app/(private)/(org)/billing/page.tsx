import React, { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { createStripePortalSession } from '@/utils/stripe/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Zap, CreditCard, CalendarDays, ShieldCheck } from 'lucide-react'
import { PLANS } from '@/lib/plans'
import { Separator } from '@/components/ui/separator'
import PlansSwitcher from './plans-switcher'
import { Badge } from '@/components/ui/badge'

import PageWrapper from '@/components/private/page-wrapper'
import { Metadata } from 'next'
import { BillingSuccessCheck } from './billing-success-check'
import { FeedbackForm } from './feedback-form'
import FaqSection from '@/components/private/faq-section'

export const metadata: Metadata = {
  title: "Fatturazione",
  description: "Gestisci il tuo abbonamento, visualizza i dettagli del piano e scarica le fatture.",
}

// Force dynamic rendering - no caching, always fresh data
export const dynamic = 'force-dynamic'

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return <div>No organization found.</div>

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, stripe_customer_id, stripe_subscription_id, stripe_price_id, stripe_status, stripe_current_period_end, stripe_cancel_at_period_end, current_billing_cycle_start')
    .eq('id', profile.organization_id)
    .single()

  const sp = await searchParams
  const success = sp.success === 'true'
  const canceled = sp.canceled === 'true'

  // If subscription is canceled (refunded), show only plans
  const isCanceled = org?.stripe_status === 'canceled'

  if (isCanceled) {
    return (
      <PageWrapper>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Riattiva il tuo abbonamento</h1>
          <p className="text-muted-foreground">
            Il tuo abbonamento è stato cancellato. I tuoi dati sono ancora al sicuro — scegli un piano per riprendere da dove hai lasciato.
          </p>
        </div>
        <PlansSwitcher plans={PLANS} currentPriceId={null} stripeStatus={org?.stripe_status} />
        <FeedbackForm />
      </PageWrapper>
    )
  }

  // Find active plan
  const currentPlan = PLANS.find(p => p.priceIdMonth === org?.stripe_price_id || p.priceIdYear === org?.stripe_price_id)

  // Determine if active plan is yearly
  const isYearlyActive = currentPlan?.priceIdYear === org?.stripe_price_id
  const currentPrice = isYearlyActive ? currentPlan?.priceYear : currentPlan?.priceMonth
  const currentPeriod = isYearlyActive ? '/anno' : '/mese'



  return (
    <PageWrapper>
      <div className='flex flex-col'>
        <h1 className="text-3xl font-bold tracking-tight">Fatturazione</h1>
        <p className="text-muted-foreground">Gestisci il tuo abbonamento, visualizza i dettagli del piano e scarica le fatture.</p>
      </div>

      <div className='grid xl:grid-cols-3 gap-4'>
        <div className='col-span-2'>
          <div className="space-y-4">
            {success && (
              <div className="bg-emerald-50 mb-4 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 p-4 rounded-xl flex items-center gap-3 border border-emerald-200 dark:border-emerald-800 shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-full">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Abbonamento attivato!</p>
                  <p className="text-sm opacity-90">Grazie per aver scelto il piano {currentPlan?.name}.</p>
                </div>
                <Suspense fallback={null}>
                  <BillingSuccessCheck initialPriceId={org?.stripe_price_id} />
                </Suspense>
              </div>
            )}

            {canceled && (
              <div className="bg-amber-50 mb-4 text-amber-800 p-4 rounded-xl flex items-center gap-3 border border-amber-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="bg-amber-100 p-2 rounded-full">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Checkout annullato</p>
                  <p className="text-sm opacity-90">Nessun addebito è stato effettuato sul tuo metodo di pagamento.</p>
                </div>
              </div>
            )}
          </div>
          <Card className="border-border shadow-sm overflow-hidden py-0">
            <div className="bg-muted/30 border-b p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Piano Attuale</p>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">{currentPlan?.name || 'Free / Nessuno'}</h2>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <form action={createStripePortalSession}>
                  <Button size="sm" variant="outline" className="shadow-sm">
                    <CreditCard className="h-4 w-4" />
                    Gestisci
                  </Button>
                </form>

              </div>
            </div>

            <CardContent className="px-6 pb-6 grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Costo Ricorrente</p>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold">€{currentPrice || '0'}</span>
                    <span className="text-muted-foreground mb-1 font-medium">{currentPeriod}</span>
                  </div>
                </div>

                {org?.stripe_current_period_end && (
                  <div className="flex items-start gap-2 text-sm bg-muted/50 p-3 rounded-md w-fit text-muted-foreground">
                    <CalendarDays className="h-4 w-4 mt-1" />
                    {org.stripe_cancel_at_period_end ? (
                      <span>L'abbonamento scade il <span className="font-medium text-foreground">{new Date(org.stripe_current_period_end).toLocaleDateString()}</span> e non verrà rinnovato.</span>
                    ) : (
                      <span>Rinnovo automatico il <span className="font-medium text-foreground">{new Date(org.stripe_current_period_end).toLocaleDateString()}</span></span>
                    )}
                  </div>
                )}

                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold block mb-1">Nota importante:</span>
                    I limiti delle risorse (es. messaggi) sono vincolati al piano. Non è possibile acquistare pacchetti extra singolarmente.
                  </p>
                </div>


              </div>

              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  Incluso nel tuo piano
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentPlan?.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm group">
                      <div className="mt-0.5 h-5 w-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 group-hover:bg-green-200 transition-colors">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <Separator />
          <PlansSwitcher plans={PLANS} currentPriceId={org?.stripe_price_id} stripeStatus={org?.stripe_status} />
        </div>
        <FaqSection topic="billing" />
      </div>

    </PageWrapper>
  )
}