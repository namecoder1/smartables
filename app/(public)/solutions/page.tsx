'use client'

import Link from 'next/link'
import { ArrowRight, Bot, Calendar, LayoutDashboard, Users, BarChart3, QrCode, Zap, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'motion/react'

const E = [0.22, 1, 0.36, 1] as const
const D = 0.65
const fadeUp = { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { duration: D, ease: E } } }
const scaleUp = { hidden: { opacity: 0, scale: 0.94 }, visible: { opacity: 1, scale: 1, transition: { duration: D, ease: E } } }
const stagger = (c = 0.1, d = 0) => ({ hidden: {}, visible: { transition: { staggerChildren: c, delayChildren: d } } })
const VP = { once: true, margin: '-60px' } as const

const solutions = [
  {
    href: '/solutions/integrazione-ai',
    Icon: Bot,
    bg: 'bg-indigo-600',
    light: 'bg-indigo-50',
    text: 'text-indigo-600',
    blob: 'bg-indigo-400',
    badge: 'Più richiesto',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    title: 'Recupero Chiamate AI',
    desc: 'Ogni chiamata senza risposta diventa un messaggio WhatsApp. Il cliente prenota da solo, tu non perdi più nulla.',
    tags: ['Chiamate Perse', 'WhatsApp Bot', '24/7'],
    stat: '+25%',
    statLabel: 'prenotazioni recuperate',
  },
  {
    href: '/solutions/gestione-prenotazioni',
    Icon: Calendar,
    bg: 'bg-green-600',
    light: 'bg-green-50',
    text: 'text-green-600',
    blob: 'bg-green-400',
    badge: null,
    badgeColor: '',
    title: 'Gestione Prenotazioni',
    desc: 'Conferme via WhatsApp, reminder automatici, carta a garanzia anti no-show. Il tuo tavolo è sempre occupato.',
    tags: ['No-Show Protection', 'Carta a Garanzia', 'Reminder'],
    stat: '-80%',
    statLabel: 'no-show',
  },
  {
    href: '/solutions/gestione-sala',
    Icon: LayoutDashboard,
    bg: 'bg-[#FF9710]',
    light: 'bg-orange-50',
    text: 'text-[#FF9710]',
    blob: 'bg-orange-400',
    badge: null,
    badgeColor: '',
    title: 'Gestione Sala',
    desc: 'Mappa interattiva drag & drop, timer per tavolo, turni multipli. Massima rotazione dei coperti, zero stress.',
    tags: ['Mappa Interattiva', 'Turni Multipli', 'Timer Tavolo'],
    stat: '+40%',
    statLabel: 'rotazione tavoli',
  },
  {
    href: '/solutions/crm',
    Icon: Users,
    bg: 'bg-blue-600',
    light: 'bg-blue-50',
    text: 'text-blue-600',
    blob: 'bg-blue-400',
    badge: null,
    badgeColor: '',
    title: 'CRM & Loyalty',
    desc: 'Schede cliente automatiche, campagne WhatsApp per compleanni e clienti inattivi. Fai tornare chi non c\'è da un po\'.',
    tags: ['Database Clienti', 'Marketing Auto', 'Tag VIP'],
    stat: '3×',
    statLabel: 'ritorno cliente medio',
  },
  {
    href: '/solutions/menu-digitale',
    Icon: QrCode,
    bg: 'bg-violet-600',
    light: 'bg-violet-50',
    text: 'text-violet-600',
    blob: 'bg-violet-400',
    badge: 'Nuovo',
    badgeColor: 'bg-violet-100 text-violet-700',
    title: 'Menu Digitale & Ordini',
    desc: 'QR code sul tavolo: il cliente sfoglia il menu, ordina e paga senza aspettare il cameriere. Sempre aggiornato in tempo reale.',
    tags: ['QR Code', 'Ordini al Tavolo', 'No App Richiesta'],
    stat: '0',
    statLabel: 'minuti di attesa',
  },
  {
    href: '/solutions/analytics',
    Icon: BarChart3,
    bg: 'bg-teal-600',
    light: 'bg-teal-50',
    text: 'text-teal-600',
    blob: 'bg-teal-400',
    badge: 'Nuovo',
    badgeColor: 'bg-teal-100 text-teal-700',
    title: 'Analytics & Report',
    desc: 'Coperti per fascia oraria, fatturato recuperato, piatti più ordinati. Capisci il tuo ristorante in un colpo d\'occhio.',
    tags: ['Dashboard Live', 'Export CSV', 'Insights Clienti'],
    stat: '1 click',
    statLabel: 'per ogni report',
  },
]

export default function SolutionsIndexPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans selection:bg-[#FF9710] selection:text-white overflow-x-hidden">
      <Hero />
      <SolutionsGrid />
      <IntegrationStrip />
      <BottomCTA />
    </div>
  )
}

const Hero = () => (
  <section className="relative pt-32 pb-16 md:pt-48 md:pb-24 overflow-hidden">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-[-15%] right-[-5%] w-[700px] h-[700px] bg-[#FF9710]/8 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-orange-100/50 rounded-full blur-[100px]" />
    </div>

    <motion.div
      className="container px-4 md:px-6 mx-auto text-center relative z-10"
      variants={stagger(0.1)}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        variants={fadeUp}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-[#FF9710] font-semibold text-sm mb-6"
      >
        <span className="p-1 bg-[#FF9710]/20 rounded-full">
          <Zap className="w-3 h-3 fill-current" />
        </span>
        La Suite Completa per Ristoranti
      </motion.div>

      <motion.h1
        variants={fadeUp}
        className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6 max-w-4xl mx-auto leading-[1.05]"
      >
        Tutto ciò che serve per{' '}
        <span className="text-transparent bg-clip-text bg-linear-to-r from-[#FF9710] to-[#FF6B00]">
          riempire la sala.
        </span>
      </motion.h1>

      <motion.p
        variants={fadeUp}
        className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed"
      >
        Smartables non è solo un gestionale. È un ecosistema di strumenti che lavorano insieme per automatizzare ogni aspetto del tuo ristorante.
      </motion.p>

      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          asChild
          className="h-14 px-10 text-lg font-bold bg-[#FF9710] hover:bg-[#ff8906] text-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(255,151,16,0.5)] transition-all hover:scale-105"
        >
          <Link href="/register">Inizia gratis</Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          className="h-14 px-10 text-lg font-bold text-gray-600 hover:text-[#FF9710] hover:bg-orange-50 rounded-2xl transition-all"
        >
          <Link href="/contact">Parla con noi</Link>
        </Button>
      </motion.div>
    </motion.div>
  </section>
)

const SolutionsGrid = () => (
  <section className="pb-24 bg-white">
    <div className="container px-4 md:px-6 mx-auto max-w-7xl">
      <motion.div
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={stagger(0.08)}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
      >
        {solutions.map((s) => (
          <motion.div key={s.href} variants={scaleUp}>
            <Link
              href={s.href}
              className="group relative bg-white border border-gray-100 rounded-[2rem] p-8 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-1 flex flex-col overflow-hidden h-full"
            >
              {/* Blob */}
              <div className={`absolute top-0 right-0 w-48 h-48 ${s.blob} opacity-[0.04] rounded-full blur-[60px] -translate-y-1/3 translate-x-1/3 group-hover:opacity-[0.1] transition-opacity`} />

              <div className="relative z-10 flex flex-col flex-1">
                {/* Badge */}
                {s.badge && (
                  <span className={`self-start text-xs font-bold px-3 py-1 rounded-full mb-4 ${s.badgeColor}`}>
                    {s.badge}
                  </span>
                )}

                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl ${s.bg} flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <s.Icon className="w-7 h-7 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#FF9710] transition-colors flex items-center gap-2">
                  {s.title}
                  <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#FF9710]" />
                </h3>

                <p className="text-gray-500 leading-relaxed mb-6 flex-1">
                  {s.desc}
                </p>

                {/* Stat */}
                <div className={`${s.light} rounded-xl p-4 mb-6`}>
                  <span className={`text-3xl font-bold ${s.text}`}>{s.stat}</span>
                  <span className="text-sm text-gray-500 ml-2">{s.statLabel}</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {s.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-gray-50 text-gray-500 text-xs font-semibold rounded-full border border-gray-100">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
)

const integrationPoints = [
  'Tutte le prenotazioni in un unico calendario',
  'CRM aggiornato ad ogni visita, automaticamente',
  'Analytics che aggregano tutti i canali',
  'Un solo account per gestire più sedi',
]

const IntegrationStrip = () => (
  <section className="py-20 bg-gray-950 relative overflow-hidden">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:32px_32px]" />
    <div className="container px-4 md:px-6 mx-auto max-w-6xl relative z-10">
      <motion.div
        className="grid lg:grid-cols-2 gap-12 items-center"
        variants={stagger(0.15)}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
      >
        <motion.div variants={fadeUp}>
          <span className="text-[#FF9710] font-bold uppercase tracking-widest text-sm mb-4 block">
            Ecosistema integrato
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
            Non sono moduli separati.{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#FF9710] to-[#FF6B00]">
              Sono un sistema.
            </span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Ogni strumento alimenta gli altri. Una prenotazione alimenta il CRM. Il CRM attiva le campagne marketing. Le campagne generano nuove prenotazioni.
          </p>
        </motion.div>

        <motion.ul variants={stagger(0.1)} className="space-y-4">
          {integrationPoints.map((point) => (
            <motion.li
              key={point}
              variants={fadeUp}
              className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-4"
            >
              <CheckCircle2 className="w-5 h-5 text-[#FF9710] shrink-0" />
              <span className="text-white font-medium">{point}</span>
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>
    </div>
  </section>
)

const BottomCTA = () => (
  <section className="py-24 bg-white">
    <motion.div
      className="container px-4 md:px-6 mx-auto max-w-4xl text-center"
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={VP}
    >
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        Non sai da dove iniziare?
      </h2>
      <p className="text-gray-500 text-lg mb-8">
        Prenota una demo gratuita di 20 minuti. Ti mostriamo esattamente cosa fa al caso tuo.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          asChild
          className="h-14 px-8 text-lg font-bold bg-gray-900 hover:bg-black text-white rounded-2xl shadow-lg transition-all hover:scale-105"
        >
          <Link href="/contact">Parla con un esperto</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-14 px-8 text-lg font-bold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-2xl"
        >
          <Link href="/pricing">Vedi i prezzi</Link>
        </Button>
      </div>
    </motion.div>
  </section>
)
