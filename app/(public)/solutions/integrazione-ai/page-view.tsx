'use client'

import { Bot, PhoneMissed, MessageCircle, BarChart3, Radio, CheckCircle2 } from 'lucide-react'
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
const VP = { once: false, margin: '-80px' } as const

const PageView = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans selection:bg-[#FF9710] selection:text-white">
      <Hero
        icon={<Bot className="w-4 h-4" />}
        title="Recupero Chiamate AI"
        subtitle="Ogni chiamata persa è un tavolo vuoto."
        description="La nostra AI intercetta le chiamate senza risposta e invia subito un WhatsApp al cliente con il link per prenotare. Zero sforzo da parte tua."
        ctaText="Attiva il recupero chiamate"
        ctaHref="/register"
        secondaryCtaText="Vedi come funziona"
        secondaryCtaHref="#come-funziona"
      />
      <ProblemSection />
      <HowItWorks />
      <StatsSection />
      <CTASection />
    </div>
  )
}

const ProblemSection = () => (
  <section className="py-24 bg-white relative overflow-hidden">
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
            Il telefono squilla.{' '}
            <span className="text-red-400">Nessuno risponde.</span>
          </h2>
          <p className="text-xl text-gray-500 leading-relaxed">
            È sabato sera. Il locale è pieno, i camerieri corrono. Il telefono continua a suonare, ma non c'è nessuno libero per rispondere.
          </p>
          <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-100 p-2 rounded-full">
                <PhoneMissed className="text-red-500 w-5 h-5" />
              </div>
              <span className="font-bold text-gray-900 text-lg">Il costo nascosto</span>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Ogni chiamata persa vale in media <strong className="text-red-600 bg-red-100 px-1.5 py-0.5 rounded-lg">€45–90</strong> in fatturato. Un ristorante medio ne perde decine a settimana senza nemmeno saperlo.
            </p>
          </div>
        </motion.div>

        {/* Right: terminal mockup */}
        <motion.div variants={fadeRight} className="relative">
          <div className="absolute -inset-6 bg-linear-to-tr from-indigo-500/20 to-purple-500/20 rounded-[3rem] blur-2xl" />
          <div className="relative bg-gray-950 rounded-[2.5rem] p-8 shadow-2xl border border-gray-800 overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-size-[24px_24px]" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span className="font-mono text-xs tracking-widest uppercase">Chiamata in entrata</span>
                </div>
                <span className="text-sm text-gray-600 font-mono">20:14:32</span>
              </div>

              <div className="space-y-5">
                <div className="flex gap-4 opacity-50">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className="w-3 h-3 rounded-full bg-red-500 mt-1" />
                    <div className="w-px flex-1 bg-gray-800" />
                  </div>
                  <div className="pb-6">
                    <p className="text-xs text-gray-500 mb-1 font-mono">STATUS: NO_ANSWER</p>
                    <p className="text-white font-semibold">Chiamata non risposta</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className="p-1 bg-indigo-500/20 rounded-full border border-indigo-500">
                      <div className="w-3 h-3 rounded-full bg-indigo-500 animate-ping" />
                    </div>
                    <div className="w-px flex-1 bg-indigo-500/30" />
                  </div>
                  <div className="pb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs py-0.5 px-2 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                        AI TRIGGER — 0.2s
                      </span>
                    </div>
                    <p className="text-white font-semibold">Workflow &quot;Recupero&quot; attivato</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0">
                    <div className="w-3 h-3 rounded-full bg-green-500 mt-1" />
                  </div>
                  <div>
                    <p className="text-xs text-green-400 mb-2 font-mono">ACTION: SEND_WHATSAPP</p>
                    <div className="bg-white/10 p-4 rounded-xl border border-white/5">
                      <p className="text-sm text-gray-300 italic">
                        &quot;Ciao! Non siamo riusciti a risponderti. Prenota il tuo tavolo qui 👇&quot;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  </section>
)

const steps = [
  {
    icon: PhoneMissed,
    color: 'bg-red-100 text-red-600',
    num: '01',
    title: 'Intercettazione',
    desc: 'Devii le chiamate senza risposta verso il nostro sistema. Funziona su occupato, nessuna risposta o fuori orario.',
  },
  {
    icon: MessageCircle,
    color: 'bg-green-100 text-green-600',
    num: '02',
    title: 'WhatsApp automatico',
    desc: 'Entro 30 secondi il cliente riceve un messaggio personalizzato con il link diretto per prenotare il tavolo.',
  },
  {
    icon: BarChart3,
    color: 'bg-indigo-100 text-indigo-600',
    num: '03',
    title: 'Prenotazione confermata',
    desc: 'Il cliente prenota autonomamente. Tu trovi la prenotazione già nel sistema, senza aver alzato la cornetta.',
  },
]

const HowItWorks = () => (
  <section id="come-funziona" className="py-24 bg-gray-50 border-t border-gray-100">
    <div className="container px-4 md:px-6 mx-auto max-w-6xl">
      <motion.div
        className="text-center mb-16"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Come funziona</h2>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Nessuna app da installare per il cliente. Nessun hardware costoso per te.
        </p>
      </motion.div>

      <motion.div
        className="grid md:grid-cols-3 gap-8"
        variants={stagger(0.15)}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
      >
        {steps.map((step) => (
          <motion.div
            key={step.num}
            variants={scaleUp}
            className="bg-white relative rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className={`p-3 rounded-2xl ${step.color}`}>
                <step.icon className="w-6 h-6" />
              </div>
              <span className="text-7xl absolute top-0 right-2 font-bold text-gray-50 leading-none mt-1">{step.num}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
            <p className="text-gray-500 leading-relaxed">{step.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
)

const stats = [
  { value: '+25%', label: 'Prenotazioni recuperate' },
  { value: '0', label: 'Chiamate perse per sempre' },
  { value: '30s', label: 'Tempo di risposta AI' },
  { value: '24/7', label: 'Operatività garantita' },
]

const StatsSection = () => (
  <section className="py-20 bg-[#FF9710] relative overflow-hidden">
    <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[url('/noise.png')]" />
    <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-[100px]" />
    <motion.div
      className="container px-4 md:px-6 mx-auto max-w-5xl relative z-10"
      variants={stagger(0.1)}
      initial="hidden"
      whileInView="visible"
      viewport={VP}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s) => (
          <motion.div key={s.value} variants={fadeUp}>
            <div className="text-5xl md:text-6xl font-bold text-white mb-2 tracking-tight">{s.value}</div>
            <div className="text-white/80 font-medium">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  </section>
)

const benefits = [
  'Nessuna app da scaricare per i tuoi clienti',
  'Funziona anche fuori dall\'orario di apertura',
  'Configurazione in meno di 10 minuti',
  'Compatibile con qualsiasi operatore telefonico',
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
        <div className="absolute top-0 right-0 w-100 h-100 bg-primary/20 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-100 h-100 bg-[#FF9710]/20 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2" />

        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">
          Smetti di perdere clienti.<br />Inizia oggi.
        </h2>

        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-10 relative z-10">
          {benefits.map((b) => (
            <li key={b} className="flex items-center gap-2 text-gray-400 text-sm">
              <CheckCircle2 className="w-4 h-4 text-[#FF9710] shrink-0" />
              {b}
            </li>
          ))}
        </ul>

        <Button
          asChild
          className="h-16 px-12 text-xl font-bold bg-[#FF9710] hover:bg-[#e0850e] text-white rounded-2xl shadow-xl hover:scale-105 transition-transform relative z-10"
        >
          <Link href="/register">Attiva il recupero chiamate</Link>
        </Button>
      </motion.div>
    </div>
  </section>
)

export default PageView