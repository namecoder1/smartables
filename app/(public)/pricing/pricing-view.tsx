'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, Sparkles, Shield, Clock, Users, Star, MessageCircle, ArrowRight, Zap, HeartHandshake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { PLANS } from '@/lib/plans'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

const E = [0.22, 1, 0.36, 1] as const
const D = 0.65
const fadeUp = { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { duration: D, ease: E } } }
const VP = { once: false, margin: '-80px' } as const

const PricingView = () => {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header isAnnual={isAnnual} setIsAnnual={setIsAnnual} />
      <PricingSection isAnnual={isAnnual} />
      <TrustSection />
      <ComparisonSection />
      {/* <TestimonialsSection /> */}
      <FAQSection />
      <CTASection />
    </div>
  )
}

const Header = ({ isAnnual, setIsAnnual }: { isAnnual: boolean, setIsAnnual: (value: boolean) => void }) => {
  return (
    <section className="pt-20 pb-16 md:pt-32 md:pb-12">
      <div className="container px-4 md:px-6 mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-gray-900 mb-6">
            Il prezzo giusto per ogni ristorante
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Che tu gestisca un piccolo bistrot o una catena di ristoranti, abbiamo il piano perfetto per le tue esigenze.
            Nessun costo nascosto, nessuna sorpresa.
          </p>
        </motion.div>

        {/* Money Back Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-8"
        >
          <Sparkles className="h-4 w-4" />
          Soddisfatti o rimborsati entro 14 giorni. Senza domande.
        </motion.div>

        {/* Billing Toggle */}
        <motion.div variants={fadeUp} className='flex items-center gap-4 mx-auto w-fit'>
          <div className='relative bg-muted/50 flex items-center rounded-2xl p-1 border'>
            <button
              onClick={() => setIsAnnual(false)}
              className={cn(
                "relative z-10 px-5 py-1.5 text-sm font-medium transition-colors duration-200 text-black"
              )}
            >
              Mensile
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={cn(
                "relative z-10 px-5 py-1.5 text-sm font-medium transition-colors duration-200 text-black",
              )}
            >
              Annuale
            </button>
            <motion.div
              className="absolute top-1 rounded-xl bottom-1 left-1 bg-background shadow-sm border"
              initial={false}
              animate={{
                x: isAnnual ? "100%" : "0%",
                width: "calc(50% - 4px)"
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
  
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: isAnnual ? 1 : 0, scale: isAnnual ? 1 : 0.8 }}
              className="absolute -top-2.5 -right-6 rounded-full bg-emerald-500 text-white px-2 py-0.5 text-[10px] font-bold whitespace-nowrap pointer-events-none"
            >
              +2 Mesi GRATIS
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

const PricingSection = ({ isAnnual }: { isAnnual: boolean }) => {
  return (
    <section className="pb-20">
      <div className="container px-4 md:px-6 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
        >
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
            >
              <PricingCard plan={plan} isAnnual={isAnnual} />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-600">
            Hai più di 5 sedi o esigenze particolari?{' '}
            <Link href="/contact" className="text-primary font-semibold hover:underline underline-offset-4 transition-colors">
              Contatta il nostro team Enterprise
            </Link>.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

const TrustSection = () => {
  const stats = [
    { icon: Users, value: "500+", label: "Ristoranti attivi" },
    { icon: MessageCircle, value: "50K+", label: "Prenotazioni gestite/mese" },
    { icon: Star, value: "4.9/5", label: "Valutazione media" },
    { icon: Clock, value: "< 2 min", label: "Tempo medio di setup" },
  ]

  return (
    <section className="py-16 bg-gray-50 border-y-2">
      <div className="container px-4 md:px-6 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VP}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Scelto da centinaia di ristoratori italiani</h2>
          <p className="text-gray-600">Unisciti a chi ha già trasformato la gestione del proprio locale</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VP}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

const ComparisonSection = () => {
  const features = [
    { name: "Sedi incluse", starter: "1", growth: "3", business: "10" },
    { name: "Account Staff", starter: "5", growth: "15", business: "Illimitati" },
    { name: "Prenotazioni/mese", starter: "300", growth: "1.000", business: "3.000" },
    { name: "Contatti WA automatizzati/mese", starter: "400", growth: "1.200", business: "3.500" },
    { name: "Storage globale", starter: "300 MB", growth: "1 GB", business: "5 GB" },
    { name: "Bot WhatsApp", starter: true, growth: true, business: true },
    { name: "Gestione tavoli", starter: true, growth: true, business: true },
    { name: "Menu digitali & QR", starter: true, growth: true, business: true },
    { name: "App Mobile", starter: true, growth: true, business: true },
    { name: "AI Assistente", starter: "Basic", growth: "Medium", business: "Pro" },
    { name: "Analytics", starter: "Base", growth: "Avanzati", business: "Business Intelligence" },
    { name: "Supporto prioritario", starter: false, growth: true, business: true },
    { name: "Onboarding dedicato", starter: false, growth: false, business: true },
    { name: "Integrazioni", starter: false, growth: 'TheFork + Quandoo', business: 'TheFork + Quandoo + OpenTable' },
  ]

  return (
    <section className="py-20">
      <div className="container px-4 md:px-6 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VP}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Confronta i piani nel dettaglio</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Ogni piano include tutto ciò di cui hai bisogno per gestire il tuo ristorante in modo efficiente.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VP}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto overflow-x-auto"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-4 font-semibold text-gray-900">Feature</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-900">Starter</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-900">
                  <span className="inline-flex items-center gap-2">
                    Growth
                    <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full">Popolare</span>
                  </span>
                </th>
                <th className="text-center py-4 px-4 font-semibold text-gray-900">Business</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 text-gray-700">{feature.name}</td>
                  <td className="py-4 px-4 text-center">
                    <FeatureValue value={feature.starter} />
                  </td>
                  <td className="py-4 px-4 text-center bg-primary/5">
                    <FeatureValue value={feature.growth} />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <FeatureValue value={feature.business} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  )
}

const FeatureValue = ({ value }: { value: boolean | string }) => {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="h-5 w-5 text-emerald-600 mx-auto" />
    ) : (
      <X className="h-5 w-5 text-gray-300 mx-auto" />
    )
  }
  return <span className="text-gray-700 font-medium">{value}</span>
}

const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "Da quando usiamo Smartables, le prenotazioni sono aumentate del 40% e non perdiamo più nessuna richiesta. Il bot WhatsApp è fantastico!",
      author: "Marco Rossi",
      role: "Proprietario",
      restaurant: "Trattoria Da Marco, Milano",
      rating: 5
    },
    {
      quote: "Finalmente posso gestire 3 locali da un'unica dashboard. Il tempo risparmiato è incredibile. Lo consiglio a tutti i colleghi ristoratori.",
      author: "Giulia Bianchi",
      role: "Manager",
      restaurant: "Gruppo Bianchi Restaurants, Roma",
      rating: 5
    },
    {
      quote: "L'assistente AI ci aiuta a rispondere ai clienti anche quando siamo impegnati in cucina. È come avere un receptionist virtuale 24/7.",
      author: "Antonio Ferrara",
      role: "Chef & Proprietario",
      restaurant: "Osteria del Porto, Napoli",
      rating: 5
    }
  ]

  return (
    <section className="py-20 bg-gray-50 border-y-2">
      <div className="container px-4 md:px-6 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VP}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Cosa dicono i nostri clienti</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Storie di successo da ristoratori che hanno scelto Smartables
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VP}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="h-full border-2 bg-[#f4f4f4]">
                <CardContent>
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="border-t pt-4">
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                    <p className="text-sm text-blue-600 font-medium">{testimonial.restaurant}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

const FAQSection = () => {
  const faqs = [
    {
      question: "Come funziona la garanzia soddisfatti o rimborsati?",
      answer: "Se nei primi 14 giorni il servizio non ti soddisfa, ti rimborsiamo l'intero importo dell'abbonamento. Basta contattare il nostro supporto. Nessuna domanda, nessun problema."
    },
    {
      question: "Posso cambiare piano in qualsiasi momento?",
      answer: "Assolutamente sì. Puoi passare a un piano superiore (Upgrade) o inferiore (Downgrade) in qualsiasi momento dal tuo pannello di controllo. Le modifiche sono immediate e il prezzo viene ricalcolato pro-rata."
    },
    {
      question: "Cosa succede se supero le prenotazioni incluse?",
      answer: "Non blocchiamo mai il servizio. Se superi il limite mensile in modo consistente, il nostro team ti contatterà per valutare l'upgrade al piano successivo più adatto alle tue esigenze, oppure potrai acquistare pacchetti aggiuntivi."
    },
    {
      question: "L'App Mobile è inclusa in tutti i piani?",
      answer: "L'App Mobile è inclusa in tutti i piani, dal Starter al Business. È il canale principale per ricevere le notifiche push dello staff in tempo reale. Nessun costo aggiuntivo."
    },
    {
      question: "Quanto tempo ci vuole per configurare Smartables?",
      answer: "La configurazione base richiede meno di 10 minuti. Il nostro wizard di onboarding ti guida passo dopo passo. Per i piani Business, offriamo anche un onboarding dedicato con un nostro esperto."
    },
    {
      question: "Posso importare i dati dal mio sistema attuale?",
      answer: "Sì, supportiamo l'importazione di dati da tutti i principali software di gestione ristoranti. Il nostro team può assisterti nella migrazione per i piani Growth e Business."
    },
    {
      question: "Il bot WhatsApp funziona 24/7?",
      answer: "Sì, il bot WhatsApp è attivo 24 ore su 24, 7 giorni su 7. Può gestire prenotazioni, rispondere a domande frequenti e inviare conferme automatiche, anche quando il ristorante è chiuso."
    },
    {
      question: "Che tipo di supporto è incluso?",
      answer: "Tutti i piani includono supporto via email e chat. I piani Growth e Business hanno accesso al supporto prioritario con tempi di risposta garantiti entro 4 ore lavorative."
    }
  ]

  return (
    <section className="py-20">
      <div className="container px-4 md:px-6 mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VP}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Domande frequenti</h2>
          <p className="text-gray-600">
            Tutto quello che devi sapere prima di iniziare
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VP}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Accordion type="single" collapsible className="border rounded-3xl border-gray-200 px-4 bg-white">
                <AccordionItem value="item-1" className="border-b-0">
                  <AccordionTrigger className="text-gray-900 font-semibold text-lg hover:no-underline py-5 text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-base pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

const CTASection = () => {
  return (
    <section className="py-20 bg-[#e4870e]">
      <div className="container px-4 md:px-6 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VP}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Inizia in meno di 5 minuti
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto a rivoluzionare la gestione del tuo ristorante?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Unisciti a oltre 500 ristoratori che hanno già scelto Smartables.
            Inizia oggi con la garanzia soddisfatti o rimborsati.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild variant="outline" size="lg" className="text-base px-8 py-6 rounded-full bg-transparent text-white border-white/30 hover:text-white! hover:bg-white/10">
              <Link href="/contact">
                Parla con un esperto
              </Link>
            </Button>
            <Button asChild size="lg" className="text-base px-6! py-6 rounded-full">
              <Link href="/register">
                Inizia gratis
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-8 text-white/90 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>14 giorni soddisfatti o rimborsati</span>
            </div>
            <div className="flex items-center gap-2">
              <HeartHandshake className="h-5 w-5" />
              <span>Nessun contratto a lungo termine</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>Setup in pochi minuti</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

const PricingCard = ({
  plan,
  isAnnual
} : {
  plan: any,
  isAnnual: boolean
}) => {
  const { popular, name, id, priceMonth, priceYear, features, buttonText } = plan
  const price = isAnnual ? priceYear : priceMonth
  const period = isAnnual ? '/anno' : '/mese'
  const showSetupFee = process.env.NEXT_PUBLIC_ENABLE_SETUP_FEE === 'true'

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="h-full"
    >
      <Card className={cn(
        "flex flex-col h-full relative overflow-hidden transition-all duration-300",
          popular
            ? "border-primary shadow-lg shadow-primary/40 bg-primary rounded-3xl"
            : "bg-transparent border-border/10 hover:shadow-lg rounded-3xl"
      )}>
        <CardHeader className="pb-4">
          <div className="space-y-1">
            <h3 className={cn(
              "text-2xl font-bold tracking-tigh text-black"
            )}>
              {name}
            </h3>
            <p className={cn("text-lg", popular ? "text-black" : "text-muted-foreground")}>
              {id === 'starter' && 'Per piccoli ristoranti o bar.'}
              {id === 'growth' && 'Per ristoranti in crescita.'}
              {id === 'business' && 'Per gruppi e catene.'}
            </p>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className={cn(
              "font-extrabold tracking-tight text-4xl text-black"
            )}>
              €{price}
            </span>
            <span className={cn(
              'font-medium text-black'
            )}>{period}</span>
          </div>
          {!showSetupFee && (
            <p className={cn('text-xs mt-2', popular ? 'text-white' : 'text-black')}>
              + €149 setup una tantum
            </p>
          )}
        </CardHeader>

        <CardContent className="flex-1">
          <ul className="space-y-4">
            {features.map((feature: string, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <div className={cn(
                  "mt-0.5 rounded-full p-0.5 shrink-0",
                  popular
                    ?  "bg-black text-white"
                    : "bg-primary/10 text-primary"
                )}>
                  <Check className="h-3 w-3" />
                </div>
                <p className="text-black">
                  {feature}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="pt-4">
          <Button
            className={cn(
              "w-full font-semibold h-11",
              popular ?
                "shadow-md hover:shadow-lg transition-all bg-black hover:bg-black"
                : "bg-neutral-100 border hover:border-primary hover:bg-primary/80 hover:text-white"
            )}
            variant={popular ? 'default' : 'outline'}
            asChild
          >
            <Link href={`/register?plan=${id}&interval=${isAnnual ? 'year' : 'month'}`}>
              Seleziona {showSetupFee && "+ Setup"}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export default PricingView