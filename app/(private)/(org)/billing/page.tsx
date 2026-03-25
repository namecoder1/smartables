import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { createStripePortalSession } from '@/utils/stripe/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import {
  Check, Zap, CreditCard, CalendarDays,
  Receipt, ExternalLink, ArrowDownLeft, AlertCircle,
} from 'lucide-react'
import { PLANS } from '@/lib/plans'
import PlansSwitcher from './plans-switcher'
import { Badge } from '@/components/ui/badge'
import PageWrapper from '@/components/private/page-wrapper'
import { Metadata } from 'next'
import { BillingSuccessCheck } from './billing-success-check'
import { FeedbackForm } from './feedback-form'
import { getFaqsByTopic } from '@/utils/sanity/queries'
import type { AddonConfig } from '@/types/general'
import AddonsSection from './addons-section'
import { FaqContent } from '@/components/private/faq-section'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: "Fatturazione",
  description: "Gestisci il tuo abbonamento, visualizza i dettagli del piano e scarica le fatture.",
}

export const dynamic = 'force-dynamic'

const TIER_BADGE: Record<string, { label: string; className: string }> = {
  starter: { label: 'Starter',  className: 'bg-slate-100 text-slate-700 border-slate-200 border' },
  growth:  { label: 'Growth',   className: 'bg-violet-100 text-violet-700 border-violet-200 border' },
  business:{ label: 'Business', className: 'bg-amber-100 text-amber-700 border-amber-200 border' },
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return <div>No organization found.</div>

  const [{ data: org }, { data: transactions }, [billingFaqs]] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, stripe_customer_id, stripe_subscription_id, stripe_price_id, stripe_status, stripe_current_period_end, stripe_cancel_at_period_end, current_billing_cycle_start, addons_config, billing_tier')
      .eq('id', profile.organization_id)
      .single(),
    supabase
      .from('transactions')
      .select('id, amount, currency, status, type, description, stripe_invoice_id, invoice_pdf, created_at')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })
      .limit(30),
    getFaqsByTopic('billing').then(r => [r]),
  ])

  const sp = await searchParams
  const success = sp.success === 'true'
  const event: ('cancel' | 'purchase') | null = sp.event && (sp.event === 'cancel' || sp.event === 'purchase') ? sp.event : null
  const canceled = sp.canceled === 'true'

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

  const currentPlan = PLANS.find(p => p.priceIdMonth === org?.stripe_price_id || p.priceIdYear === org?.stripe_price_id)
  const isYearlyActive = currentPlan?.priceIdYear === org?.stripe_price_id
  const currentPrice = isYearlyActive ? currentPlan?.priceYear : currentPlan?.priceMonth
  const currentPeriod = isYearlyActive ? '/anno' : '/mese'
  const hasActiveSubscription = !!org?.stripe_subscription_id && org.stripe_status === 'active'
  const isCanceling = org?.stripe_status === 'active' && org?.stripe_cancel_at_period_end

  const tierBadge = TIER_BADGE[org?.billing_tier ?? 'starter'] ?? TIER_BADGE.starter

  const addonsConfig: AddonConfig = org?.addons_config ?? {
    extra_staff: 0, extra_contacts_wa: 0, extra_storage_mb: 0, extra_locations: 0, extra_kb_chars: 0, extra_analytics: 0,
  }

  return (
    <PageWrapper>
      {/* ── Header ── */}
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
        <div className='flex flex-col gap-1'>
          <h1 className="text-3xl font-bold tracking-tight">Fatturazione</h1>
          <p className="text-muted-foreground">Gestisci il tuo abbonamento, visualizza i dettagli del piano e scarica le fatture.</p>
        </div>
        <FaqContent
          variant='minimized'
          title='Aiuto'
          faqs={billingFaqs}
          className='lg:hidden'
        />
      </div>

      <div className='space-y-6'>
        {/* ── Banners ── */}
        {success && (
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 border-2 border-emerald-200 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <Check className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">Operazione completata!</p>
              <p className="text-sm opacity-90">Le modifiche al tuo abbonamento sono state applicate.</p>
            </div>
            <Suspense fallback={null}>
              <BillingSuccessCheck
                title={event === 'cancel' ? "Iscrizione annullata" : "Verificando iscrizione..."}
                description={event === 'cancel'
                  ? "Il tuo abbonamento è stato annullato. Attendi qualche secondo mentre aggiorniamo lo stato del tuo account."
                  : "Stiamo verificando lo stato del tuo abbonamento. Potrebbe richiedere qualche secondo."}
                initialPriceId={org?.stripe_price_id} />
            </Suspense>
          </div>
        )}
        {canceled && (
          <div className="bg-amber-50 text-amber-800 p-4 rounded-2xl flex items-center gap-3 border-2 border-amber-200 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold">Checkout annullato</p>
              <p className="text-sm opacity-90">Nessun addebito è stato effettuato sul tuo metodo di pagamento.</p>
            </div>
          </div>
        )}

        {/* ── Main content grid ── */}
        <div className='grid lg:grid-cols-3 gap-6'>

          {/* Plan card — takes 2/3 */}
          <div className='lg:col-span-2'>
            <Card className="border-2 shadow-sm py-0 gap-0 overflow-hidden">
              {/* Card header */}
              <div className="bg-muted/20 border-b-2 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Piano Attuale</p>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold tracking-tight">{currentPlan?.name || 'Free'}</h2>
                      <Badge className={cn('text-xs', tierBadge.className)}>
                        {tierBadge.label}
                      </Badge>
                      {isCanceling && (
                        <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200 border gap-1">
                          <AlertCircle className="h-3 w-3" />
                          In scadenza
                        </Badge>
                      )}
                      {hasActiveSubscription && !isCanceling && (
                        <Badge className="text-xs bg-green-100 text-green-700 border-green-200 border">
                          Attivo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <form action={createStripePortalSession}>
                  <Button size="sm" variant="outline" className="shadow-sm gap-2 shrink-0">
                    <CreditCard className="h-4 w-4" />
                    Gestisci
                  </Button>
                </form>
              </div>

              <CardContent className="px-6 pb-6 pt-5 grid md:grid-cols-2 gap-8">
                {/* Left: pricing + billing info */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Costo Ricorrente</p>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold tracking-tight">€{currentPrice || '0'}</span>
                      <span className="text-muted-foreground mb-1 font-medium text-sm">{currentPeriod}</span>
                    </div>
                  </div>

                  {org?.stripe_current_period_end && (
                    <div className={cn(
                      'flex items-start gap-2.5 text-sm p-3 rounded-xl w-fit',
                      isCanceling
                        ? 'bg-amber-50 text-amber-700 border-2 border-amber-200'
                        : 'bg-muted/50 text-muted-foreground border-2 border-transparent',
                    )}>
                      <CalendarDays className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        {org.stripe_cancel_at_period_end ? (
                          <>Scade il <span className="font-semibold text-amber-800">{new Date(org.stripe_current_period_end).toLocaleDateString('it-IT')}</span> senza rinnovo</>
                        ) : (
                          <>Rinnovo il <span className="font-semibold text-foreground">{new Date(org.stripe_current_period_end).toLocaleDateString('it-IT')}</span></>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: features */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Incluso nel piano</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentPlan?.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2 text-sm">
                        <div className="mt-0.5 h-5 w-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Addons — takes 1/3 */}
          {hasActiveSubscription && (
            <AddonsSection
              addonsConfig={addonsConfig}
              addonPriceIds={{
                STRIPE_PRICE_ADDON_STAFF: process.env.STRIPE_PRICE_ADDON_STAFF,
                STRIPE_PRICE_ADDON_CONTACTS_WA: process.env.STRIPE_PRICE_ADDON_CONTACTS_WA,
                STRIPE_PRICE_ADDON_STORAGE: process.env.STRIPE_PRICE_ADDON_STORAGE,
                STRIPE_PRICE_ADDON_LOCATION: process.env.STRIPE_PRICE_ADDON_LOCATION,
                STRIPE_PRICE_ADDON_KB: process.env.STRIPE_PRICE_ADDON_KB,
                STRIPE_PRICE_ADDON_ANALYTICS: process.env.STRIPE_PRICE_ADDON_ANALYTICS,
              }}
              billingTier={org?.billing_tier ?? 'starter'}
              variant='billing'
            />
          )}
        </div>

        {/* ── Plan switcher ── */}
        <PlansSwitcher plans={PLANS} currentPriceId={org?.stripe_price_id} stripeStatus={org?.stripe_status} />

        {/* ── Transaction history ── */}
        {transactions && transactions.length > 0 && (
          <Card className="border-2 shadow-sm py-0 gap-0">
            <div className="bg-muted/20 border-b-2 px-6 py-5 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base font-bold tracking-tight">Storico transazioni</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">Tutti i pagamenti e gli accrediti del tuo account</p>
              </div>
            </div>
            <CardContent className="px-0 pb-0">
              <div className="divide-y">
                {transactions.map((tx) => {
                  const isRefund = tx.amount < 0 || tx.type === 'refund'
                  const date = tx.created_at
                    ? new Date(tx.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—'
                  const amountFormatted = `€${Math.abs(tx.amount).toFixed(2).replace('.', ',')}`

                  return (
                    <div key={tx.id} className="flex items-center gap-4 px-6 py-4">
                      <div className={cn(
                        'h-9 w-9 rounded-xl flex items-center justify-center shrink-0',
                        isRefund ? 'bg-green-100' : 'bg-muted',
                      )}>
                        {isRefund
                          ? <ArrowDownLeft className="h-4 w-4 text-green-600" />
                          : <CreditCard className="h-4 w-4 text-muted-foreground" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tx.description || 'Pagamento abbonamento'}</p>
                        <p className="text-xs text-muted-foreground">{date}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn('text-sm font-semibold', isRefund && 'text-green-600')}>
                          {isRefund ? `+${amountFormatted}` : amountFormatted}
                        </p>
                        <Badge
                          className={cn(
                            'text-xs mt-0.5 border',
                            tx.status === 'succeeded'
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-amber-100 text-amber-700 border-amber-200',
                          )}
                        >
                          {tx.status === 'succeeded' ? 'Pagato' : tx.status}
                        </Badge>
                      </div>
                      {tx.invoice_pdf && (
                        <a
                          href={tx.invoice_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </PageWrapper>
  )
}
