import React from 'react'
import { createClient } from '@/supabase/server'
import { redirect } from 'next/navigation'
import { createStripeCheckoutSession, createStripePortalSession } from '@/stripe/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wallet, CreditCard, ExternalLink, Euro, CheckCircle2, AlertCircle } from 'lucide-react'

import { BalanceUpdater } from '@/components/private/balance-updater'

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return <div>No organization found.</div>
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('id, credits, name, stripe_customer_id')
    .eq('id', profile.organization_id)
    .single()

  const sp = await searchParams
  const success = sp.success === 'true'
  const canceled = sp.canceled === 'true'

  return (
    <div className="space-y-6 p-6">
      {org && <BalanceUpdater organization={org} />}
      <div className="flex flex-col items-start">
        <h1 className="text-2xl font-bold tracking-tight">Billing & Crediti</h1>
        <div className="text-muted-foreground">
          Non dimenticarti di ricaricare i crediti per continuare ad utilizzare i servizi.
        </div>
      </div>

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-3 border border-green-200">
          <CheckCircle2 className="h-5 w-5" />
          <p>Il pagamento è andato a buon fine! I tuoi crediti sono stati aggiornati.</p>
        </div>
      )}

      {canceled && (
        <div className="bg-amber-50 text-amber-700 p-4 rounded-lg flex items-center gap-3 border border-amber-200">
          <AlertCircle className="h-5 w-5" />
          <p>Il pagamento è stato annullato. Nessun addebito è stato effettuato.</p>
        </div>
      )}

      <div className='grid grid-cols-3 gap-6'>
        <div className="grid gap-6 md:grid-cols-2 col-span-2">
          <Card className="md:col-span-1 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Wallet className="h-5 w-5" />
                Saldo Attuale
              </CardTitle>
              <CardDescription>
                Credito disponibile per l'utilizzo dei servizi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {Number(org?.credits || 0).toFixed(2)} <span className="text-lg text-muted-foreground font-normal">EUR</span>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1 justify-between pb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Metodi di Pagamento
              </CardTitle>
              <CardDescription>
                Gestisci le tue carte e visualizza le fatture.
              </CardDescription>
            </CardHeader>
            <CardContent className=" flex items-center">
              <form action={createStripePortalSession} className="w-full">
                <Button variant="outline" className="w-full h-12 gap-2 text-base">
                  Gestisci su Stripe
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Ricarica Credito
              </CardTitle>
              <CardDescription>
                Aggiungi fondi al tuo account per continuare ad utilizzare i servizi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TopUpForm />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Come funziona?</CardTitle>
            <CardDescription>
              Una breve panoramica su come funziona il sistema di crediti.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-rows-3 gap-4">
              <div className="flex flex-col items-start">
                <div className='flex items-center gap-2 mb-1'>
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    1
                  </div>
                  <p className="font-semibold">Ricarica crediti</p>
                </div>
                <p className='text-muted-foreground'>Per poter utilizzare i servizi devi avere un saldo positivo superiore ai 5€.</p>
              </div>
              <div className="flex flex-col items-start">
                <div className='flex items-center gap-2 mb-1'>
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    2
                  </div>
                  <p className="font-semibold">Utilizza i servizi</p>
                </div>
                <p className='text-muted-foreground'>Ogni servizio ha un costo in crediti. Controlla il costo del servizio prima di utilizzarlo.</p>
              </div>
              <div className="flex flex-col items-start">
                <div className='flex items-center gap-2 mb-1'>
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    3
                  </div>
                  <p className="font-semibold">Ricarica crediti</p>
                </div>
                <p className='text-muted-foreground'>Quando il tuo saldo si avvicina allo zero, riceverai una notifica per ricaricare i crediti.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Ultime transazioni</CardTitle>
          </CardHeader>
          <CardContent>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TopUpForm() {
  return (
    <form action={async (formData) => {
      'use server'
      const amount = Number(formData.get('amount'))
      if (amount && amount >= 5) {
        await createStripeCheckoutSession(amount)
      }
    }} className="flex flex-col sm:flex-row gap-4 items-end">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="amount">Importo da ricaricare (Min. 5€)</Label>
        <div className="relative w-40">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">€</span>
          </div>
          <Input
            type="number"
            id="amount"
            name="amount"
            placeholder="0.00"
            min="5"
            step="5"
            defaultValue="25"
            className="pl-7"
            required
          />
        </div>
      </div>
      <Button type="submit" size="lg" className="flex-1">
        Ricarica
      </Button>
    </form>
  )
}