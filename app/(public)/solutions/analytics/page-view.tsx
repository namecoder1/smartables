'use client'

import { BarChart3, TrendingUp, Users, Clock, ArrowUp, ArrowDown, CheckCircle2, Calendar, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Hero from '../hero'
import { motion } from 'motion/react'
import Link from 'next/link'
import { ChartBar } from '@/components/charts/chart-bar'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

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
        icon={<BarChart3 className="w-4 h-4" />}
        title="Analytics & Report"
        subtitle="Dati chiari. Decisioni veloci."
        description="Coperti per fascia oraria, fatturato recuperato, piatti più ordinati, clienti più fedeli. Tutto ciò che ti serve per capire il tuo ristorante — in una sola schermata."
        ctaText="Accedi alla dashboard"
        ctaHref="/register"
      />
      <DashboardSection />
      <InsightsSection />
      <CTASection />
    </div>
  )
}

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const DashboardSection = () => (
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
            Una dashboard che{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-600 to-blue-600">
              parla chiaro
            </span>
          </h2>
          <p className="text-xl text-gray-500 leading-relaxed">
            Non serve essere analisti. La dashboard di Smartables trasforma i dati del tuo ristorante in insight immediati: sai già cosa funziona e cosa migliorare.
          </p>
          <ul className="space-y-5">
            {[
              { icon: BarChart3, text: 'Coperti reali vs prenotati per fascia oraria' },
              { icon: TrendingUp, text: 'Fatturato recuperato dalle chiamate perse' },
              { icon: Users, text: 'Clienti nuovi vs abituali, tasso di ritorno' },
              { icon: Calendar, text: 'No-show settimanali con trend su 30 giorni' },
            ].map((item) => (
              <li key={item.text} className="flex items-center gap-4">
                <div className="bg-teal-600 p-2 rounded-xl shadow-md shadow-teal-100">
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-700 font-medium">{item.text}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Right: dashboard mockup */}
        <motion.div variants={fadeRight} className="relative">
          <div className="absolute inset-0 bg-teal-100 rounded-[3rem] rotate-1 translate-x-3 translate-y-3 -z-10 opacity-50" />
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
            {/* Top bar */}
            <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <span className="text-gray-400 text-xs font-mono">Dashboard · Pizzeria Italia</span>
              <div className="w-16" />
            </div>

            {/* KPI row */}
            <div className="p-5 border-b border-gray-100 grid grid-cols-3 gap-3">
              {[
                { label: 'Coperti oggi', value: '74', delta: '+12%', up: true },
                { label: 'Fatturato', value: '€1.840', delta: '+8%', up: true },
                { label: 'No-show', value: '2', delta: '-60%', up: false },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-gray-50 rounded-2xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">{kpi.label}</p>
                  <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
                  <div className={`flex items-center justify-center gap-1 text-xs font-semibold mt-1 ${kpi.up ? 'text-green-600' : 'text-red-500'}`}>
                    {kpi.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {kpi.delta}
                  </div>
                </div>
              ))}
            </div>

            {/* Bar chart mock */}
            <div className="p-5 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Coperti per fascia oraria</p>
              <div className="flex items-end gap-2 h-40">
                <ChartContainer config={chartConfig} className='flex-1 h-40'>
                  <AreaChart
                    accessibilityLayer
                    data={[
                      { hour: "18:30", desktop: 3 },
                      { hour: "19:00", desktop: 7 },
                      { hour: "19:30", desktop: 10 },
                      { hour: "20:00", desktop: 6 },
                      { hour: "20:30", desktop: 13 },
                      { hour: "21:00", desktop: 8 },
                    ]}
                    margin={{
                      left: 12,
                      right: 12,
                    }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="hour"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="line" />}
                    />
                    <Area
                      dataKey="desktop"
                      type="natural"
                      fill="#00BBA7"
                      fillOpacity={0.4}
                      stroke="#00BBA7"
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            </div>

            {/* Top dishes */}
            <div className="p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Piatti più ordinati</p>
              <div className="space-y-2">
                {[
                  { name: 'Diavola piccante', orders: 34, pct: 85 },
                  { name: 'Margherita', orders: 28, pct: 70 },
                  { name: 'Quattro stagioni', orders: 18, pct: 45 },
                ].map((dish) => (
                  <div key={dish.name} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-32 truncate">{dish.name}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${dish.pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">{dish.orders}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  </section>
)

const insights = [
  {
    icon: Clock,
    color: 'bg-teal-500',
    title: 'Ottimizza i turni',
    desc: 'Scopri le fasce orarie con più coperti e calibra il personale di conseguenza. Meno ore a vuoto, più servizio quando serve.',
    stat: '-22%',
    statLabel: 'costi fissi',
  },
  {
    icon: TrendingUp,
    color: 'bg-[#FF9710]',
    title: 'Traccia il fatturato recuperato',
    desc: 'Vedi esattamente quanti euro sono arrivati da chiamate perse recuperate. Il ROI di Smartables sotto i tuoi occhi.',
    stat: '3–5×',
    statLabel: 'ROI medio',
  },
  {
    icon: Users,
    color: 'bg-blue-600',
    title: 'Conosci i tuoi clienti',
    desc: 'Frequenza di visita, scontrino medio, provenienza. Segmenta la base clienti e pianifica campagne mirate.',
    stat: '+31%',
    statLabel: 'tasso ritorno',
  },
]

const InsightsSection = () => (
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
          Insight che cambiano le decisioni
        </h2>
        <p className="text-gray-500 text-lg">
          Non semplici numeri. Risposte alle domande che ti fai ogni giorno.
        </p>
      </motion.div>

      <motion.div
        className="grid md:grid-cols-3 gap-6"
        variants={stagger(0.12)}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
      >
        {insights.map((f) => (
          <motion.div
            key={f.title}
            variants={scaleUp}
            className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-md ${f.color}`}>
              <f.icon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
            <p className="text-gray-500 leading-relaxed mb-6">{f.desc}</p>
            <div className="bg-gray-50 rounded-xl flex items-center justify-center p-3 border border-gray-100 text-center">
              <span className="text-2xl font-bold text-gray-900">{f.stat}</span>
              <span className="text-sm text-gray-400 ml-2">{f.statLabel}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
)

const perks = [
  'Export CSV per contabilità e report personali',
  'Report settimanale via email automatico',
  'Confronto con il periodo precedente',
  'Multi-sede: aggregato o per singola location',
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
        <div className="absolute top-0 right-0 w-100 h-100 bg-primary/15 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-100 h-100 bg-orange-500/15 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2" />

        <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-6 relative z-10">
          <Zap className="w-4 h-4" />
          Incluso in tutti i piani
        </div>

        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">
          Smetti di gestire a occhio.
        </h2>
        <p className="text-xl text-gray-400 mb-8 max-w-xl mx-auto relative z-10">
          I dati sono già tutti lì. Devi solo saperli leggere.
        </p>

        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-10 relative z-10">
          {perks.map((p) => (
            <li key={p} className="flex items-center gap-2 text-gray-400 text-sm">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              {p}
            </li>
          ))}
        </ul>

        <Button
          asChild
          className="h-16 px-12 text-xl font-bold bg-[#FF9710] hover:bg-[#e0850e] text-white rounded-2xl shadow-xl hover:scale-105 transition-transform relative z-10"
        >
          <Link href="/register">Accedi alla dashboard</Link>
        </Button>
      </motion.div>
    </div>
  </section>
)

export default PageView