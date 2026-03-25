'use client'

import { QrCode, Smartphone, Pencil, ShoppingCart, CheckCircle2, Zap, Utensils, CreditCard } from 'lucide-react'
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
        icon={<QrCode className="w-4 h-4" />}
        title="Menu Digitale & Ordini"
        subtitle="Il menu che ordina al posto tuo."
        description="Un QR code sul tavolo. Il cliente scansiona, sfoglia il menu con foto e descrizioni, ordina e paga — senza aspettare il cameriere. Zero app da scaricare."
        ctaText="Crea il tuo menu digitale"
        ctaHref="/register"
        secondaryCtaText="Vedi un esempio"
        secondaryCtaHref="#demo"
      />
      <FlowSection />
      <FeaturesSection />
      <CTASection />
    </div>
  )
}

const FlowSection = () => (
  <section id="demo" className="py-24 bg-white relative overflow-hidden">
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
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
            Dalla scansione{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#FF9710] to-[#FF6B00]">
              all'ordine
            </span>{' '}
            in 30 secondi.
          </h2>
          <p className="text-xl text-gray-500 leading-relaxed">
            I tuoi clienti non devono aspettare il cameriere per ordinare. Scansionano, scelgono e inviano — l'ordine arriva direttamente in cucina.
          </p>

          <div className="space-y-4">
            {[
              { icon: QrCode, num: '01', title: 'Scansiona', desc: 'Il cliente inquadra il QR sul tavolo. Si apre il menu sul browser, senza app.' },
              { icon: Utensils, num: '02', title: 'Sfoglia e ordina', desc: 'Menu con foto, descrizioni, allergeni e varianti. Aggiunge al carrello in un tap.' },
              { icon: ShoppingCart, num: '03', title: 'Ordine in cucina', desc: 'L\'ordine appare in dashboard e in cucina in tempo reale. Il cameriere viene avvisato.' },
            ].map((step) => (
              <div key={step.num} className="flex gap-5 items-start">
                <div className="bg-[#FF9710] text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-orange-200">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: phone mockup */}
        <motion.div variants={fadeRight} className="relative flex justify-center">
          <div className="absolute -inset-6 bg-linear-to-tr from-violet-500/10 to-orange-500/10 rounded-[3rem] blur-2xl" />
          <div className="relative w-72 bg-white rounded-[2.5rem] shadow-2xl border border-gray-200 overflow-hidden">
            {/* Phone top bar */}
            <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#FF9710] rounded-lg flex items-center justify-center">
                  <Utensils className="w-3 h-3 text-white" />
                </div>
                <span className="text-white font-bold text-sm">Pizzeria Italia</span>
              </div>
              <span className="text-gray-400 text-xs">T. 12</span>
            </div>

            {/* Menu items */}
            <div className="p-4 space-y-3 bg-gray-50">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Antipasti</p>

              {[
                { name: 'Bruschetta al pomodoro', price: '€7', img: '🍅', added: true },
                { name: 'Tagliere misto', price: '€14', img: '🧀', added: false },
              ].map((item) => (
                <div key={item.name} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl shrink-0">
                    {item.img}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                    <p className="text-[#FF9710] font-bold text-sm">{item.price}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold shrink-0 transition-colors ${item.added ? 'bg-[#FF9710] text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {item.added ? '✓' : '+'}
                  </div>
                </div>
              ))}

              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 pt-2">Pizze</p>

              {[
                { name: 'Margherita classica', price: '€10', img: '🍕', added: false },
                { name: 'Diavola piccante', price: '€12', img: '🌶️', added: true },
              ].map((item) => (
                <div key={item.name} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-2xl shrink-0">
                    {item.img}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                    <p className="text-[#FF9710] font-bold text-sm">{item.price}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${item.added ? 'bg-[#FF9710] text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {item.added ? '✓' : '+'}
                  </div>
                </div>
              ))}
            </div>

            {/* Cart button */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="bg-[#FF9710] rounded-2xl py-3 flex items-center justify-center gap-2 shadow-md shadow-orange-200">
                <ShoppingCart className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-sm">Invia ordine · 2 articoli · €19</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  </section>
)

const features = [
  {
    icon: Pencil,
    color: 'bg-violet-500',
    title: 'Aggiornamento in tempo reale',
    desc: 'Cambia prezzi, aggiungi piatti del giorno, segna esaurito — dal pannello admin in un click. Il menu è istantaneamente aggiornato su tutti i tavoli.',
  },
  {
    icon: Smartphone,
    color: 'bg-[#FF9710]',
    title: 'Zero app per il cliente',
    desc: 'Il menu si apre nel browser del telefono. Nessun download, nessun account. Funziona su qualsiasi smartphone iOS o Android.',
  },
  {
    icon: CreditCard,
    color: 'bg-green-600',
    title: 'Pagamento al tavolo',
    desc: 'Il cliente può pagare direttamente dal telefono. Meno attesa per il conto, più rotazione, più mance digitali.',
  },
  {
    icon: Zap,
    color: 'bg-blue-600',
    title: 'Ordini diretti in cucina',
    desc: 'Gli ordini arrivano in real time sul tuo sistema di cassa e al display in cucina. Nessun errore di trascrizione del cameriere.',
  },
]

const FeaturesSection = () => (
  <section className="py-24 bg-gray-50 border-t border-gray-100">
    <div className="container px-4 md:px-6 mx-auto max-w-7xl">
      <motion.div
        className="text-center max-w-3xl mx-auto mb-16"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Tutto quello che un menu cartaceo non può fare
        </h2>
        <p className="text-gray-500 text-lg">
          Niente più menu consumati, prezzi barrati o piatti indisponibili non aggiornati.
        </p>
      </motion.div>

      <motion.div
        className="grid md:grid-cols-2 gap-6"
        variants={stagger(0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
      >
        {features.map((f) => (
          <motion.div
            key={f.title}
            variants={scaleUp}
            className="bg-white rounded-4xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 flex gap-6 items-start"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${f.color}`}>
              <f.icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
)

const perks = [
  'Nessun costo di stampa aggiornamenti menu',
  'Foto dei piatti per aumentare lo scontrino medio',
  'Filtri per allergeni e diete (vegan, gluten free)',
  'Multilingua: il menu si adatta alla lingua del telefono',
]

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
        <div className="absolute top-0 right-0 w-100 h-100 bg-orange-400/20 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-100 h-100 bg-[#FF9710]/15 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2" />

        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">
          Il tuo menu digitale è pronto in 10 minuti.
        </h2>

        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-10 relative z-10">
          {perks.map((p) => (
            <li key={p} className="flex items-center gap-2 text-gray-400 text-sm">
              <CheckCircle2 className="w-4 h-4 text-[#FF9710] shrink-0" />
              {p}
            </li>
          ))}
        </ul>

        <Button
          asChild
          className="h-16 px-12 text-xl font-bold bg-[#FF9710] hover:bg-[#e0850e] text-white rounded-2xl shadow-xl hover:scale-105 transition-transform relative z-10"
        >
          <Link href="/register">Crea il tuo menu digitale</Link>
        </Button>
      </motion.div>
    </div>
  </section>
)

export default PageView