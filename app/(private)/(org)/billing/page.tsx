import React, { Suspense } from 'react'
import { createClient } from '@/supabase/server'
import { redirect } from 'next/navigation'
import { createStripePortalSession } from '@/stripe/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Zap, CreditCard, CalendarDays, ShieldCheck } from 'lucide-react'
import { PLANS } from '@/lib/plans'
import { Separator } from '@/components/ui/separator'
import PlansSwitcher from './plans-switcher'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { RefreshOnSuccess } from './refresh-on-success'
import PageWrapper from '@/components/private/page-wrapper'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Fatturazione",
  description: "Gestisci il tuo abbonamento, visualizza i dettagli del piano e scarica le fatture.",
}

// Force dynamic rendering - no caching, always fresh data
export const dynamic = 'force-dynamic'

const faqs = [
  {
    id: 1,
    title: 'Perchè non posso pagare con un metodo di pagamento diverso?',
    text: 'Per motivi di sicurezza, non possiamo accettare pagamenti con metodi di pagamento diversi da quelli supportati da Stripe.'
  },
  {
    id: 2,
    title: 'Il rinnovo automatico è attivo di default?',
    text: 'Il rinnovo automatico è disattivato non appena inizi la tua prova gratuita, una volta che la prova termina e un nuovo piano viene scelto, il rinnovo automatico sarà attivato di default.'
  },
  {
    id: 3,
    title: 'Cosa succede se sforo i limiti di un piano?',
    text: 'Se sfori i tuoi limiti ti consigliamo di passare al piano successivo. Per non incorrere nello spegnimento del servizio puoi fare l\'upgrade al piano successivo pagando la differenza tra i due piani, considerando però che dal mese successivo pagherai il prezzo pieno del nuovo piano.'
  },
  {
    id: 4,
    title: 'Perchè non posso pagare con un metodo di pagamento diverso?',
    text: 'Per motivi di sicurezza, non possiamo accettare pagamenti con metodi di pagamento diversi da quelli supportati da Stripe.'
  },
  {
    id: 5,
    title: 'Perchè non posso pagare con un metodo di pagamento diverso?',
    text: 'Per motivi di sicurezza, non possiamo accettare pagamenti con metodi di pagamento diversi da quelli supportati da Stripe.'
  },
  {
    id: 6,
    title: 'Perchè non posso pagare con un metodo di pagamento diverso?',
    text: 'Per motivi di sicurezza, non possiamo accettare pagamenti con metodi di pagamento diversi da quelli supportati da Stripe.'
  },
]

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
    .select('id, name, stripe_customer_id, stripe_subscription_id, stripe_price_id, stripe_status, stripe_current_period_end, stripe_cancel_at_period_end')
    .eq('id', profile.organization_id)
    .single()

  const sp = await searchParams
  const success = sp.success === 'true'
  const canceled = sp.canceled === 'true'

  // Find active plan
  const currentPlan = PLANS.find(p => p.priceIdMonth === org?.stripe_price_id || p.priceIdYear === org?.stripe_price_id)

  // Determine if active plan is yearly
  const isYearlyActive = currentPlan?.priceIdYear === org?.stripe_price_id
  const currentPrice = isYearlyActive ? currentPlan?.priceYear : currentPlan?.priceMonth
  const currentPeriod = isYearlyActive ? '/anno' : '/mese'

  return (
    <PageWrapper>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fatturazione</h1>
        <p className="text-muted-foreground">Gestisci il tuo abbonamento, visualizza i dettagli del piano e scarica le fatture.</p>
      </div>

      <div className='grid xl:grid-cols-3 gap-4'>
        <div className='col-span-2'>
          <div className="space-y-4">
            {success && (
              <div className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 p-4  flex items-center gap-3 border border-emerald-200 dark:border-emerald-800 shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-full">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Abbonamento attivato!</p>
                  <p className="text-sm opacity-90">Grazie per aver scelto il piano {currentPlan?.name}.</p>
                </div>
                <Suspense fallback={null}>
                  <RefreshOnSuccess />
                </Suspense>
              </div>
            )}

            {canceled && (
              <div className="bg-amber-50 text-amber-800 p-4 rounded-xl flex items-center gap-3 border border-amber-200 shadow-sm animate-in fade-in slide-in-from-top-2">
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
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Piano Attuale</p>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">{currentPlan?.name || 'Free / Nessuno'}</h2>
                    {org?.stripe_status && (
                      <Badge variant={org.stripe_status === 'active' ? 'default' : 'secondary'} className="capitalize">
                        {org.stripe_status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <form action={createStripePortalSession}>
                <Button size="lg" className="shadow-sm">
                  <CreditCard className="h-4 w-4" />
                  Gestisci
                </Button>
              </form>
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
                  <div className="flex items-center gap-2 text-sm bg-muted/50 p-3 rounded-md w-fit text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    {org.stripe_cancel_at_period_end ? (
                      <span>L'abbonamento scade il <span className="font-medium text-foreground">{new Date(org.stripe_current_period_end).toLocaleDateString()}</span> e non verrà rinnovato.</span>
                    ) : (
                      <span>Rinnovo automatico il <span className="font-medium text-foreground">{new Date(org.stripe_current_period_end).toLocaleDateString()}</span></span>
                    )}
                  </div>
                )}

                <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
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
                      <div className="mt-0.5 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <Separator />
          <PlansSwitcher plans={PLANS} />
        </div>
        <BillingFAQ />
      </div>

    </PageWrapper>
  )
}

const BillingFAQ = () => {
  return (
    <Card className="h-fit gap-2">
      <CardHeader>
        <CardTitle className="text-lg">Domande Frequenti</CardTitle>
      </CardHeader>
      <CardContent>
        {faqs.map((faq) => (
          <Accordion key={faq.id} type="single" collapsible className="w-full">
            <AccordionItem value={`item-${faq.id}`}>
              <AccordionTrigger>{faq.title}</AccordionTrigger>
              <AccordionContent>
                {faq.text}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </CardContent>
    </Card>
  )
}