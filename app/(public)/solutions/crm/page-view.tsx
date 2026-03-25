'use client'

import { Users, Database, Heart, LineChart, Star, Gift, Search, Check, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Hero from '../hero'
import { motion } from 'motion/react'
import Link from 'next/link'

const E = [0.22, 1, 0.36, 1] as const
const D = 0.65
const fadeUp = { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { duration: D, ease: E } } }
const fadeLeft = { hidden: { opacity: 0, x: -40 }, visible: { opacity: 1, x: 0, transition: { duration: D, ease: E } } }
const fadeRight = { hidden: { opacity: 0, x: 40 }, visible: { opacity: 1, x: 0, transition: { duration: D, ease: E } } }
const scaleUp = { hidden: { opacity: 0, scale: 0.94 }, visible: { opacity: 1, scale: 1, transition: { duration: D, ease: E } } }
const stagger = (c = 0.12) => ({ hidden: {}, visible: { transition: { staggerChildren: c } } })
const VP = { once: true, margin: '-60px' } as const

const PageView = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans selection:bg-[#FF9710] selection:text-white">
      <Hero
        icon={<Users className="w-4 h-4" />}
        title="CRM & Loyalty"
        subtitle="I tuoi clienti migliori valgono oro."
        description="Trasforma ogni prenotazione in una scheda cliente. Conosci le preferenze, celebra i compleanni, recupera chi non torna. Il tutto in automatico."
        ctaText="Attiva il CRM"
        ctaHref="/register"
      />
      <DatabaseSection />
      <MarketingSection />
      <CTASection />
    </div>
  )
}

const DatabaseSection = () => (
  <section className="py-24 bg-white relative">
    <div className="container px-4 md:px-6 mx-auto max-w-7xl">
      <motion.div
        className="grid lg:grid-cols-2 gap-16 items-center"
        variants={stagger()}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
      >
        {/* Left: text */}
        <motion.div variants={fadeLeft} className="space-y-8">
          <div className="p-3 bg-blue-50 w-fit rounded-2xl">
            <Database className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
            Database clienti{' '}
            <span className="text-blue-600">unificato</span>
          </h2>
          <p className="text-xl text-gray-500 leading-relaxed">
            Dimentica i fogli Excel sparsi. Smartables crea automaticamente una scheda per ogni cliente, aggregando tutte le visite — anche se gestisci più sedi.
          </p>
          <ul className="space-y-5">
            {[
              { icon: Search, text: 'Riconoscimento automatico del cliente abituale' },
              { icon: LineChart, text: 'Storico completo di visite, spesa e preferenze' },
              { icon: Users, text: 'Note private condivise tra tutto lo staff' },
              { icon: Star, text: 'Tag intelligente: VIP, Spendaccione, Business, Allergico' },
            ].map((item) => (
              <li key={item.text} className="flex items-center gap-4">
                <div className="bg-blue-600 p-2 rounded-xl shadow-md shadow-blue-100">
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-700 font-medium">{item.text}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Right: customer card mockup */}
        <motion.div variants={fadeRight} className="relative">
          <div className="absolute inset-0 bg-blue-100 rounded-[3rem] rotate-2 translate-x-3 translate-y-3 -z-10 opacity-60" />
          <div className="rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border border-gray-100">
            {/* Header */}
            <div className="bg-linear-to-br from-blue-600 to-blue-800 p-8 text-white">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold">
                  MR
                </div>
                <div>
                  <h3 className="text-xl font-bold">Marco Rossi</h3>
                  <p className="text-blue-200 text-sm">+39 333 456 7890</p>
                  <div className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-xs mt-1 border border-white/10">
                    <Star className="w-3 h-3 fill-current" /> VIP
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { v: '14', l: 'Visite' },
                  { v: '€920', l: 'Spesa tot.' },
                  { v: '4.9★', l: 'Rating' },
                ].map((s) => (
                  <div key={s.l} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                    <div className="text-xl font-bold">{s.v}</div>
                    <div className="text-xs text-blue-200">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="p-6 space-y-3 bg-white">
              {[
                { icon: Gift, bg: 'bg-orange-100 text-orange-600', title: 'Compleanno', detail: '12 Marzo — invia offerta 7gg prima' },
                { icon: Heart, bg: 'bg-red-100 text-red-600', title: 'Preferenze', detail: 'Tavolo finestra · Vino Rosso · Glutine ✓' },
                { icon: MessageCircle, bg: 'bg-green-100 text-green-600', title: 'Ultima visita', detail: '18 Mar · 3 pers. · Antipasto + Dolce' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <div className={`p-2 rounded-lg ${item.bg}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  </section>
)

const campaigns = [
  'Auguri di compleanno con sconto personalizzato',
  'Recupero clienti inattivi da più di 60 giorni',
  'Inviti esclusivi per eventi speciali ai VIP',
  'Feedback automatico post-cena via WhatsApp',
]

const MarketingSection = () => (
  <section className="py-24 bg-gray-50 border-t border-gray-100 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-125 h-125 bg-purple-500/5 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />

    <div className="container px-4 md:px-6 mx-auto max-w-7xl relative z-10">
      <motion.div
        className="grid lg:grid-cols-2 gap-16 items-center"
        variants={stagger()}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
      >
        {/* Left: WhatsApp campaign mockup */}
        <motion.div variants={fadeLeft} className="relative order-2 lg:order-1">
          <div className="absolute -inset-4 bg-linear-to-tr from-purple-200/40 to-pink-200/40 rounded-[3rem] blur-2xl" />
          <div className="relative bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 aspect-square flex items-center justify-center p-8">
            <div className="w-full h-full bg-gray-50 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-8 space-y-5">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl font-bold shadow-xl shadow-green-100">
                🎂
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-2">Campagna automatica</p>
                <h4 className="text-2xl font-bold text-gray-900">Auguri, Marco! 🎉</h4>
                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                  Per il tuo compleanno ti abbiamo riservato uno sconto del 20% sulla tua prossima cena.
                </p>
              </div>
              <Button className="rounded-full bg-[#25D366] hover:bg-[#128c7e] text-white pointer-events-none px-6">
                Prenota ora
              </Button>
              <p className="text-xs text-gray-400">Inviato automaticamente da Smartables</p>
            </div>
          </div>
        </motion.div>

        {/* Right: text */}
        <motion.div variants={fadeRight} className="space-y-8 order-1 lg:order-2">
          <div className="p-3 bg-purple-50 w-fit rounded-2xl">
            <Heart className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
            Marketing & Loyalty
          </h2>
          <p className="text-xl text-gray-500 leading-relaxed">
            Usa i dati per far tornare i tuoi clienti. Campagne mirate basate sulle abitudini di consumo — senza muovere un dito.
          </p>
          <ul className="space-y-3">
            {campaigns.map((c) => (
              <li key={c} className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="bg-purple-100 p-1.5 rounded-full shrink-0">
                  <Check className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-gray-700 font-medium">{c}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </motion.div>
    </div>
  </section>
)

const CTASection = () => (
  <section className="py-32 bg-white overflow-hidden">
    <div className="container max-w-5xl mx-auto px-4">
      <motion.div
        className="bg-gray-950 rounded-[3rem] p-12 md:p-20 relative overflow-hidden shadow-2xl text-center"
        variants={scaleUp}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
      >
        <div className="absolute top-0 right-0 w-100 h-100 bg-primary/15 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-100 h-100 bg-orange-500/20 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2" />

        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">
          Pronto a costruire la tua community?
        </h2>
        <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto relative z-10">
          Ogni prenotazione è un dato. Ogni dato è un'opportunità. Inizia oggi a raccoglierli.
        </p>
        <Button
          asChild
          className="h-16 px-12 text-xl font-bold bg-[#FF9710] hover:bg-[#e0850e] text-white rounded-2xl shadow-xl hover:scale-105 transition-transform relative z-10"
        >
          <Link href="/register">Attiva il CRM gratuitamente</Link>
        </Button>
      </motion.div>
    </div>
  </section>
)

export default PageView