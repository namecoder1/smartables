import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AccordionContent } from '@radix-ui/react-accordion'
import { Accordion, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const PricingPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <section className="pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="container px-4 md:px-6 mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            Piani semplici e trasparenti
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Scegli il piano perfetto per il tuo ristorante. Nessun costo nascosto, nessuna sorpresa.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Basic Plan */}
            <Card className="flex flex-col border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900">Basic</CardTitle>
                <CardDescription className="text-gray-500">Per piccoli ristoranti o bar.</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">€49</span>
                  <span className="text-gray-500">/mese</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 shrink-0" />
                    <span className="text-gray-600">Gestione prenotazioni illimitata</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 shrink-0" />
                    <span className="text-gray-600">Widget sito web</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 shrink-0" />
                    <span className="text-gray-600">Supporto via email</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full font-semibold" variant="outline">Inizia con Basic</Button>
              </CardFooter>
            </Card>

            {/* Pro Plan */}
            <Card className="flex flex-col border-blue-200 shadow-xl ring-2 ring-blue-600 relative bg-blue-50/10">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1">
                POPOLARE
              </div>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900">Pro</CardTitle>
                <CardDescription className="text-gray-500">Per ristoranti in crescita.</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">€99</span>
                  <span className="text-gray-500">/mese</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-blue-600 shrink-0" />
                    <span className="text-gray-900 font-medium">Tutto incluso in Basic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-blue-600 shrink-0" />
                    <span className="text-gray-600">Gestione tavoli e sale</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-blue-600 shrink-0" />
                    <span className="text-gray-600">SMS di conferma automatici</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-blue-600 shrink-0" />
                    <span className="text-gray-600">Analisi e report avanzati</span>
                  </li>
                   <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-blue-600 shrink-0" />
                    <span className="text-gray-600">Supporto prioritario</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md" size="lg">Inizia con Pro</Button>
              </CardFooter>
            </Card>

            {/* Premium Plan */}
            <Card className="flex flex-col border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900">Premium</CardTitle>
                <CardDescription className="text-gray-500">Per gruppi e catene.</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">€199</span>
                  <span className="text-gray-500">/mese</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                   <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 shrink-0" />
                    <span className="text-gray-600 font-medium">Tutto incluso in Pro</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 shrink-0" />
                    <span className="text-gray-600">Multi-location</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 shrink-0" />
                    <span className="text-gray-600">API Access & Integrazioni</span>
                  </li>
                   <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 shrink-0" />
                    <span className="text-gray-600">Account Manager dedicato</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full font-semibold" variant="outline">Contatta le vendite</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>
      
      <Separator />

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container px-4 md:px-6 mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Domande frequenti</h2>
          <div className="space-y-4">
            {/* Q1 */}
            <FaqCard
              question="Posso cambiare piano in qualsiasi momento?"
              answer="Assolutamente sì. Puoi passare a un piano superiore o inferiore in qualsiasi momento direttamente dal tuo pannello di controllo. Le modifiche avranno effetto immediato."
            />

            {/* Q2 */}
            <FaqCard
              question="C'è un costo di attivazione?"
              answer="No, non ci sono costi di attivazione nascosti. Paghi solo il canone mensile del piano che hai scelto."
            />

              {/* Q3 */}
            <FaqCard
              question="Offrite una prova gratuita?"
              answer="Sì, offriamo una prova gratuita di 14 giorni su tutti i piani. Non è richiesta la carta di credito per iniziare."
            />
          </div>
        </div>
      </section>
    </div>
  )
}

const FaqCard = ({
  question,
  answer
}: {
  question: string;
  answer: string;
}) => {
  return (
    <Accordion type="single" collapsible className='border px-4'>
      <AccordionItem value="item-1">
        <AccordionTrigger className='text-foreground font-semibold text-lg'>{question}</AccordionTrigger>
        <AccordionContent className='text-muted-foreground data-[state=open]:mb-4'>
          {answer}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export default PricingPage