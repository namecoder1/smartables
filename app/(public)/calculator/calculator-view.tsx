'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import {
  Phone, TrendingDown, ArrowRight, Calculator, MessageSquare,
  CalendarCheck, BarChart3, Bot, Sparkles, ChevronRight,
  Users, Euro, PhoneMissed, UserX
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
}
const VP = { once: false, margin: '-80px' } as const

const formatEur = (n: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

// ─── Slider ────────────────────────────────────────────────────────────────

type SliderProps = {
  label: string
  sublabel?: string
  icon: React.ElementType
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
  hint?: string
}

const SliderField = ({ label, sublabel, icon: Icon, value, min, max, step, format, onChange, hint }: SliderProps) => {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-50">
            <Icon className="h-3.5 w-3.5 text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800 leading-tight">{label}</p>
            {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
          </div>
        </div>
        <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap shrink-0">
          {format(value)}
        </span>
      </div>
      <div className="relative h-5 flex items-center">
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-gray-200 overflow-hidden pointer-events-none">
          <div className="h-full rounded-full bg-[#FF9710] transition-all duration-150" style={{ width: `${pct}%` }} />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative w-full h-2 appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FF9710]
            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
            [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-[#FF9710] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white
            [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-solid"
        />
      </div>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

// ─── Loss stat card ─────────────────────────────────────────────────────────

const LossStat = ({
  label, value, sub, color
}: { label: string; value: string; sub: string; color: string }) => (
  <div className="text-center p-4 rounded-2xl bg-orange-100/70">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className={cn("text-xl font-bold", color)}>{value}</p>
    <p className="text-xs text-gray-400">{sub}</p>
  </div>
)

// ─── Feature cards ──────────────────────────────────────────────────────────

type Feature = {
  icon: React.ElementType
  title: string
  description: string
  badge: string
  href: string
  color: string
  bg: string
}

const ALL_FEATURES: Feature[] = [
  {
    icon: Bot,
    title: 'Bot WhatsApp AI',
    description: 'Risponde in automatico alle richieste su WhatsApp anche fuori orario. Zero chiamate perse.',
    badge: '#1 Consigliato',
    href: '/solutions/integrazione-ai',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-100',
  },
  {
    icon: CalendarCheck,
    title: 'Conferme & Reminder',
    description: 'Conferma e reminder 24h prima via WhatsApp. Riduce i no-show fino all\'80%.',
    badge: 'Anti no-show',
    href: '/solutions/gestione-prenotazioni',
    color: 'text-orange-700',
    bg: 'bg-orange-50 border-orange-100',
  },
  {
    icon: MessageSquare,
    title: 'Prenotazione online 24/7',
    description: 'Pagina pubblica sempre attiva. I clienti prenotano da soli, anche di notte.',
    badge: 'Sempre aperto',
    href: '/solutions/gestione-prenotazioni',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-100',
  },
  {
    icon: BarChart3,
    title: 'Analytics avanzati',
    description: 'Monitora coperti, revenue e performance in tempo reale. Previeni i problemi prima che accadano.',
    badge: 'Business Intelligence',
    href: '/solutions/analytics',
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-100',
  },
]

function getFeatures(percPerse: number, noShowPct: number, richiesteSettimana: number): Feature[] {
  const picks: Feature[] = []
  if (percPerse > 10) picks.push(ALL_FEATURES[0])           // Bot WhatsApp
  if (noShowPct > 5) picks.push(ALL_FEATURES[1])            // Reminder
  if (richiesteSettimana >= 20) picks.push(ALL_FEATURES[2]) // Online booking
  if (richiesteSettimana >= 30) picks.push(ALL_FEATURES[3]) // Analytics
  // Always at least 2
  if (picks.length === 0) picks.push(ALL_FEATURES[0], ALL_FEATURES[1])
  if (picks.length === 1) picks.push(ALL_FEATURES[1])
  return [...new Map(picks.map(f => [f.title, f])).values()].slice(0, 3)
}

// ─── Main component ─────────────────────────────────────────────────────────

const CalculatorView = () => {
  // Inputs
  const [richiesteSettimana, setRichiesteSettimana] = useState(25)   // booking requests/week
  const [percPerse, setPercPerse] = useState(20)                     // % unanswered
  const [gruppoPax, setGruppoPax] = useState(2)                      // avg party size
  const [scontrino, setScontrino] = useState(30)                     // avg spend/cover
  const [noShowPct, setNoShowPct] = useState(12)                     // % no-show

  const results = useMemo(() => {
    // Missed calls loss
    const perseSett = (richiesteSettimana * percPerse) / 100
    const copertiPersiSett = perseSett * gruppoPax
    const perditeChiamateSett = copertiPersiSett * scontrino
    const perditeChiamateAnno = perditeChiamateSett * 52

    // No-show loss (on confirmed bookings)
    const confermatiSett = richiesteSettimana - perseSett
    const noShowCopertiSett = confermatiSett * (noShowPct / 100) * gruppoPax
    const perditeNoShowSett = noShowCopertiSett * scontrino
    const perditeNoShowAnno = perditeNoShowSett * 52

    const totaleAnno = perditeChiamateAnno + perditeNoShowAnno
    const totaleSett = perditeChiamateSett + perditeNoShowSett

    return {
      perseSett,
      copertiPersiSett,
      perditeChiamateAnno,
      noShowCopertiSett,
      perditeNoShowAnno,
      totaleAnno,
      totaleSett,
    }
  }, [richiesteSettimana, percPerse, gruppoPax, scontrino, noShowPct])

  const severity = results.totaleAnno > 15000 ? 'high' : results.totaleAnno > 5000 ? 'medium' : 'low'
  const features = getFeatures(percPerse, noShowPct, richiesteSettimana)

  const severityClasses = {
    high: { bg: 'bg-red-50', cardBg: 'bg-red-100', border: 'border-red-200', text: 'text-red-500', badge: 'bg-red-100 text-red-600', alert: 'bg-red-50 border-red-100 text-red-700' },
    medium: { bg: 'bg-orange-50', cardBg: 'bg-orange-100', border: 'border-orange-200', text: 'text-orange-500', badge: 'bg-orange-100 text-orange-600', alert: 'bg-orange-50 border-orange-100 text-orange-700' },
    low: { bg: 'bg-emerald-50', cardBg: 'bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-600', alert: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
  }[severity]

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* Hero */}
      <section className="pt-20 pb-12 md:pt-32 md:pb-16">
        <div className="container px-4 md:px-6 mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Calculator className="h-4 w-4" />
              Calcolatore gratuito
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-gray-900 mb-6">
              Quanto stai perdendo{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#FF9710] to-[#FF6B00]">ogni settimana?</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Inserisci i dati del tuo locale: in 30 secondi scopri quanti coperti stai perdendo
              tra chiamate senza risposta e no-show, e quanto vale quella perdita in euro.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Calculator */}
      <section className="pb-24">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-8 items-start">

            {/* ── Inputs ── */}
            <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
              <Card className="border-2 rounded-3xl overflow-hidden py-0">
                <CardContent className="p-8 space-y-8">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Il tuo ristorante</h2>
                    <p className="text-sm text-gray-500">Sposta i cursori per adattarli alla tua realtà</p>
                  </div>

                  <SliderField
                    label="Richieste di prenotazione a settimana"
                    sublabel="chiamate + messaggi WhatsApp ricevuti"
                    icon={Phone}
                    value={richiesteSettimana}
                    min={5} max={150} step={5}
                    format={(v) => `${v} richieste`}
                    onChange={setRichiesteSettimana}
                  />

                  <SliderField
                    label="Richieste senza risposta"
                    sublabel="chiamate perse, messaggi ignorati, fuori orario"
                    icon={PhoneMissed}
                    value={percPerse}
                    min={0} max={70} step={5}
                    format={(v) => `${v}%`}
                    onChange={setPercPerse}
                    hint="La media italiana è ~20–30% durante i servizi"
                  />

                  <SliderField
                    label="Coperti medi per prenotazione"
                    sublabel="quante persone prenota tipicamente un gruppo"
                    icon={Users}
                    value={gruppoPax}
                    min={1} max={8} step={0.5}
                    format={(v) => `${v} persone`}
                    onChange={setGruppoPax}
                  />

                  <SliderField
                    label="Scontrino medio per coperto"
                    sublabel="bevande incluse"
                    icon={Euro}
                    value={scontrino}
                    min={10} max={150} step={5}
                    format={(v) => `€${v}`}
                    onChange={setScontrino}
                  />

                  <div className="border-t pt-6">
                    <div className="flex items-center gap-2 mb-6">
                      <UserX className="h-4 w-4 text-gray-400" />
                      <p className="text-sm font-semibold text-gray-700">No-show (disdette mancate)</p>
                    </div>
                    <SliderField
                      label="No-show settimanali stimati"
                      sublabel="prenotazioni confermate ma non presentate"
                      icon={UserX}
                      value={noShowPct}
                      min={0} max={40} step={1}
                      format={(v) => `${v}%`}
                      onChange={setNoShowPct}
                      hint="Senza reminder automatici la media è ~10–15%"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── Results ── */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="space-y-5"
            >
              {/* Main loss card */}
              <Card className={cn("border-2 py-0 rounded-3xl overflow-hidden", severityClasses.border, severityClasses.bg)}>
                <CardContent className={cn("p-6", severityClasses.border)}>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-lg font-semibold text-gray-700">Stima delle perdite</span>
                    <span className={cn("ml-auto text-xs font-bold px-2.5 py-1 rounded-full", severityClasses.badge)}>
                      {severity === 'high' ? 'Critico' : severity === 'medium' ? 'Attenzione' : 'Contenuto'}
                    </span>
                  </div>

                  {/* Total */}
                  <div className={cn('text-center py-6 rounded-2xl border-2 mb-6', severityClasses.border, severityClasses.cardBg)}>
                    <p className="text-sm text-black mb-2">Perdi ogni anno circa</p>
                    <p className={cn("text-5xl font-extrabold tracking-tight transition-all duration-300", severityClasses.text)}>
                      {formatEur(results.totaleAnno)}
                    </p>
                    <p className="text-xs text-black/70 mt-2">di fatturato non incassato</p>
                  </div>

                  {/* Breakdown: missed calls vs no-show */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className={cn('p-4 rounded-2xl border-2 border-dashed', severityClasses.cardBg, severityClasses.border)}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-xs font-medium text-black">Chiamate perse</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 transition-all duration-300">
                        {formatEur(results.perditeChiamateAnno)}
                      </p>
                      <p className="text-xs text-black/70 mt-0.5">
                        ~{Math.round(results.perseSett)} richieste perse/sett · {Math.round(results.copertiPersiSett)} coperti
                      </p>
                    </div>
                    <div className={cn('p-4 rounded-2xl border-2 border-dashed', severityClasses.cardBg, severityClasses.border)}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-xs font-medium text-black">No-show</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 transition-all duration-300">
                        {formatEur(results.perditeNoShowAnno)}
                      </p>
                      <p className="text-xs text-black/70 mt-0.5">
                        ~{Math.round(results.noShowCopertiSett)} coperti non presentati/sett
                      </p>
                    </div>
                  </div>

                  {/* Per week */}
                  <div className="text-center text-sm text-gray-500">
                    Equivale a{' '}
                    <span className="font-semibold text-gray-800">{formatEur(results.totaleSett)}</span>
                    {' '}ogni settimana
                  </div>
                </CardContent>
              </Card>

              {/* Contextual insight */}
              <div className={cn("flex items-start gap-3 p-4 rounded-2xl border text-sm", severityClasses.alert)}>
                <TrendingDown className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  {severity === 'high' &&
                    `Con questi numeri stai lasciando sul tavolo una cifra rilevante. Il Bot WhatsApp e i reminder automatici di Smartables possono recuperarne una parte significativa già nel primo mese.`}
                  {severity === 'medium' &&
                    `La perdita è contenibile con pochi strumenti automatici. Rispondere a tutte le richieste e ridurre i no-show può fare una differenza concreta sul bilancio mensile.`}
                  {severity === 'low' &&
                    `La situazione è gestibile, ma anche piccole ottimizzazioni si accumulano nel corso dell'anno. Un reminder automatico costa pochi centesimi e vale molto di più.`}
                </p>
              </div>

              {/* Recovery potential */}
              <Card className="border-2 rounded-3xl overflow-hidden border-orange-200 bg-orange-50 py-0">
                <CardContent className="p-6 space-y-3">
                  <p className="text-md font-semibold text-orange-900 flex items-center gap-2">
                    Recupero stimato con Smartables
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <LossStat label="Bot WA" value="~60%" sub="chiamate recuperate" color="text-green-700" />
                    <LossStat label="Reminder" value="~80%" sub="no-show ridotti" color="text-orange-700" />
                    <LossStat label="Totale anno" value={formatEur(results.totaleAnno * 0.55)} sub="recuperabili" color="text-gray-900" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature recommendations */}
      <section className="py-20 bg-gray-50 border-y-2">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={VP} className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              Basato sul tuo profilo
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Cosa ti consigliamo</h2>
            <p className="text-gray-600 text-lg">
              Le funzionalità di Smartables che avrebbero il maggiore impatto sul tuo fatturato, scelte in base ai tuoi dati.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={VP}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={f.href} className="block h-full group">
                  <Card className={cn("border-2 rounded-3xl h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 py-0", f.bg)}>
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-2 rounded-xl bg-white shadow-sm">
                          <f.icon className={cn("h-5 w-5", f.color)} />
                        </div>
                        <span className={cn("text-xs font-bold px-2 py-1 rounded-full bg-white", f.color)}>
                          {f.badge}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                      <p className="text-sm text-gray-600 flex-1">{f.description}</p>
                      <div className={cn("mt-4 flex items-center gap-1 text-sm font-semibold", f.color)}>
                        Scopri di più
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#e4870e]">
        <div className="container px-4 md:px-6 mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={VP} className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Smetti di perdere coperti. Inizia oggi.
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Smartables si configura in meno di 10 minuti. 14 giorni soddisfatti o rimborsati, nessuna carta richiesta.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild variant="outline" size="lg" className="text-base px-8 py-6 rounded-full bg-transparent text-white border-white/30 hover:text-white! hover:bg-white/10">
                <Link href="/pricing">Vedi i piani</Link>
              </Button>
              <Button asChild size="lg" className="text-base px-6! py-6 rounded-full">
                <Link href="/register">
                  Inizia ora
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default CalculatorView
