'use client'

import { useRef, useState, useCallback } from 'react'
import { LayoutDashboard, Armchair, Clock, RotateCcw, Move } from 'lucide-react'
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

// ---------------------------------------------------------------------------
// Interactive floor plan
// ---------------------------------------------------------------------------

type TableId = 'T4' | 'T12' | 'T8' | 'T2'
interface Pos { x: number; y: number }   // % within container

const INITIAL_POS: Record<TableId, Pos> = {
  T4:  { x: 32, y: 46 },
  T12: { x: 57, y: 26 },
  T8:  { x: 19, y: 62 },
  T2:  { x: 68, y: 64 },
}

// Per-table size in % (for clamping)
const TABLE_SIZE: Record<TableId, { w: number; h: number }> = {
  T4:  { w: 16, h: 16 },
  T12: { w: 22, h: 16 },
  T8:  { w: 18, h: 14 },
  T2:  { w: 12, h: 12 },
}

const InteractiveFloorPlan = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    id: TableId
    startMx: number; startMy: number
    startTx: number; startTy: number
  } | null>(null)

  const [pos, setPos] = useState<Record<TableId, Pos>>(INITIAL_POS)
  const [active, setActive] = useState<TableId | null>(null)

  const toPct = useCallback((cx: number, cy: number): Pos => {
    const r = containerRef.current?.getBoundingClientRect()
    if (!r) return { x: 0, y: 0 }
    return { x: (cx - r.left) / r.width * 100, y: (cy - r.top) / r.height * 100 }
  }, [])

  const onDown = useCallback((e: React.PointerEvent, id: TableId) => {
    e.preventDefault()
    e.stopPropagation()
    const m = toPct(e.clientX, e.clientY)
    dragRef.current = { id, startMx: m.x, startMy: m.y, startTx: pos[id].x, startTy: pos[id].y }
    setActive(id)
    // Capture on the container so move/up fire even if cursor leaves
    containerRef.current?.setPointerCapture(e.pointerId)
  }, [pos, toPct])

  const onMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    const { id, startMx, startMy, startTx, startTy } = dragRef.current
    const m = toPct(e.clientX, e.clientY)
    const { w, h } = TABLE_SIZE[id]
    setPos(prev => ({
      ...prev,
      [id]: {
        x: Math.max(w / 2 + 2, Math.min(100 - w / 2 - 2, startTx + m.x - startMx)),
        y: Math.max(h / 2 + 14, Math.min(100 - h / 2 - 4, startTy + m.y - startMy)),
      },
    }))
  }, [toPct])

  const onUp = useCallback(() => {
    dragRef.current = null
    setActive(null)
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative rounded-[2.5rem] overflow-hidden bg-gray-50 border border-gray-100 aspect-square shadow-2xl select-none touch-none"
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {/* Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />

      {/* Legend */}
      <div className="absolute top-5 left-5 bg-white px-3 py-2 rounded-xl shadow-sm border-2 border-gray-100 flex gap-4 z-20">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-xs font-semibold text-gray-500">Libero</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="text-xs font-semibold text-gray-500">Attesa</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-xs font-semibold text-gray-500">Occupato</span>
        </div>
      </div>

      {/* T4 — round, green (libero) */}
      <div
        style={{
          left: `${pos.T4.x}%`,
          top: `${pos.T4.y}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: active === 'T4' ? 30 : 10,
          transition: active === 'T4' ? 'none' : 'box-shadow 150ms',
        }}
        className={`absolute w-20 h-20 bg-white rounded-full border-4 border-green-500 flex items-center justify-center shadow-md ${active === 'T4' ? 'cursor-grabbing shadow-xl scale-110' : 'cursor-grab hover:shadow-lg hover:scale-105'} transition-[transform,box-shadow] duration-150`}
        onPointerDown={e => onDown(e, 'T4')}
      >
        <div className="text-center pointer-events-none">
          <span className="font-bold text-gray-700 text-sm block">T4</span>
          <span className="text-[9px] text-gray-400">2 pers.</span>
        </div>
      </div>

      {/* T12 — rect, red (occupato + timer) */}
      <div
        style={{
          left: `${pos.T12.x}%`,
          top: `${pos.T12.y}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: active === 'T12' ? 30 : 10,
          transition: active === 'T12' ? 'none' : 'box-shadow 150ms',
        }}
        className={`absolute w-32 h-24 bg-white rounded-2xl border-4 border-red-500 flex items-center justify-center shadow-md ${active === 'T12' ? 'cursor-grabbing shadow-xl scale-105' : 'cursor-grab hover:shadow-lg hover:scale-[1.03]'} transition-[transform,box-shadow] duration-150`}
        onPointerDown={e => onDown(e, 'T12')}
      >
        <div className="text-center pointer-events-none">
          <span className="font-bold text-gray-700 text-sm block">T12</span>
          <span className="text-[10px] text-red-500 font-bold uppercase">1h 08m</span>
          <span className="text-[9px] text-gray-400 block">4 pers.</span>
        </div>
      </div>

      {/* T8 — rect, amber (prenotato) */}
      <div
        style={{
          left: `${pos.T8.x}%`,
          top: `${pos.T8.y}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: active === 'T8' ? 30 : 10,
          transition: active === 'T8' ? 'none' : 'box-shadow 150ms',
        }}
        className={`absolute w-24 h-20 bg-white rounded-xl border-4 border-amber-400 flex items-center justify-center shadow-sm ${active === 'T8' ? 'cursor-grabbing shadow-xl scale-105' : 'cursor-grab hover:shadow-md hover:scale-[1.03]'} transition-[transform,box-shadow] duration-150`}
        onPointerDown={e => onDown(e, 'T8')}
      >
        <div className="text-center pointer-events-none">
          <span className="font-bold text-gray-700 text-sm block">T8</span>
          <span className="text-[9px] text-amber-600 font-semibold">21:30</span>
        </div>
      </div>

      {/* T2 — rect, gray dashed (bloccato) */}
      <div
        style={{
          left: `${pos.T2.x}%`,
          top: `${pos.T2.y}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: active === 'T2' ? 30 : 10,
          transition: active === 'T2' ? 'none' : 'box-shadow 150ms',
        }}
        className={`absolute w-16 h-16 bg-white rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center opacity-60 ${active === 'T2' ? 'cursor-grabbing opacity-80' : 'cursor-grab'} transition-[opacity,transform] duration-150`}
        onPointerDown={e => onDown(e, 'T2')}
      >
        <span className="font-bold text-gray-400 text-sm pointer-events-none">T2</span>
      </div>

      {/* Drag hint */}
      <div
        className={`absolute bottom-5 left-0 right-0 flex justify-center transition-opacity duration-300 ${active ? 'opacity-0' : 'opacity-100'}`}
        style={{ zIndex: 20 }}
      >
        <span className="bg-white/90 backdrop-blur-sm text-gray-400 text-xs px-3 py-1.5 rounded-full border-2 border-gray-100 flex items-center gap-1.5 shadow-sm">
          <Move className="w-3 h-3" />
          Trascina i tavoli
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page sections
// ---------------------------------------------------------------------------

const PageView = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans selection:bg-[#FF9710] selection:text-white">
      <Hero
        icon={<LayoutDashboard className="w-4 h-4" />}
        title="Gestione Sala"
        subtitle="La tua sala, sempre sotto controllo."
        description="Una mappa interattiva che replica il tuo locale. Sposta tavoli, uniscili, monitora i tempi. Il tuo staff lavora più veloce, i clienti aspettano meno."
        ctaText="Disegna la tua sala"
        ctaHref="/register"
      />
      <MapSection />
      <DetailsSection />
      <CTASection />
    </div>
  )
}

const MapSection = () => (
  <section className="py-24 bg-white relative">
    <div className="container px-4 md:px-6 mx-auto max-w-7xl">
      <motion.div
        className="grid lg:grid-cols-2 gap-16 items-center"
        variants={stagger()}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
      >
        {/* Left: interactive floor plan */}
        <motion.div variants={fadeLeft}>
          <InteractiveFloorPlan />
        </motion.div>

        {/* Right: text */}
        <motion.div variants={fadeRight} className="space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
            Mappa{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#FF9710] to-[#FF6B00]">
              interattiva
            </span>{' '}
            drag & drop
          </h2>
          <p className="text-xl text-gray-500 leading-relaxed">
            Replica fedelmente la disposizione del tuo ristorante. Sposta tavoli, uniscili o separali con un tocco. Vedi a colpo d&apos;occhio chi attende da troppo.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {[
              { t: 'Timer per tavolo', d: 'Sai esattamente da quanto ogni cliente è seduto' },
              { t: 'Unisci tavoli', d: 'Crea configurazioni per gruppi numerosi in un click' },
              { t: 'Turni multipli', d: 'Gestisci 19:30 e 21:30 sullo stesso tavolo' },
              { t: 'Staff in sync', d: 'Tutti vedono la mappa aggiornata in tempo reale' },
            ].map((item) => (
              <div key={item.t} className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
                <h4 className="font-bold text-gray-900 text-sm mb-1">{item.t}</h4>
                <p className="text-xs text-gray-500">{item.d}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  </section>
)

const features = [
  {
    icon: Armchair,
    color: 'bg-red-500',
    title: 'Gestione Capienza',
    desc: 'Imposta la capienza massima per fascia oraria. Il sistema blocca automaticamente le prenotazioni in eccesso. Zero overbooking.',
    stat: '0',
    statLabel: 'overbooking',
  },
  {
    icon: Clock,
    color: 'bg-[#FF9710]',
    title: 'Turni e Orari',
    desc: 'Configura doppi o tripli turni (es. 19:30 – 21:30 – 23:00) per massimizzare i coperti nelle serate di punta.',
    stat: '2×',
    statLabel: 'coperti per sera',
  },
  {
    icon: RotateCcw,
    color: 'bg-blue-600',
    title: 'Analisi Rotazione',
    desc: "Visualizza i tempi medi di permanenza per fascia oraria. Ottimizza il servizio e riduci i tempi morti tra un turno e l'altro.",
    stat: '-15min',
    statLabel: 'tempo medio',
  },
]

const DetailsSection = () => (
  <section className="py-24 bg-white border-t border-gray-50">
    <div className="container px-4 md:px-6 mx-auto max-w-7xl">
      <motion.div
        className="text-center max-w-3xl mx-auto mb-16"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Precisione svizzera</h2>
        <p className="text-gray-500 text-lg">Ogni dettaglio è pensato per velocizzare il servizio e aumentare il fatturato per coperto.</p>
      </motion.div>

      <motion.div
        className="grid md:grid-cols-3 gap-6"
        variants={stagger(0.12)}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
      >
        {features.map((f) => (
          <motion.div
            key={f.title}
            variants={scaleUp}
            className="bg-gray-50 p-8 rounded-[2rem] hover:bg-white border-2 border-transparent hover:border-gray-100 hover:shadow-xl transition-all group"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${f.color} group-hover:scale-110 transition-transform`}>
              <f.icon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
            <p className="text-gray-500 leading-relaxed mb-6">{f.desc}</p>
            <div className="bg-white flex items-center justify-center rounded-xl p-3 border-2 border-gray-100 text-center">
              <span className="text-2xl font-bold text-gray-900">{f.stat}</span>
              <span className="text-sm text-gray-400 ml-2">{f.statLabel}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
)

const CTASection = () => (
  <section className="py-32 bg-white overflow-hidden">
    <div className="container max-w-5xl mx-auto px-4">
      <motion.div
        className="bg-neutral-950/90 rounded-[3rem] p-12 md:p-20 relative overflow-hidden shadow-2xl text-center"
        variants={scaleUp}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
      >
        <div className="absolute top-0 right-0 w-100 h-100 bg-primary/20 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-100 h-100 bg-[#FF9710]/15 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2" />

        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">
          La tua sala, organizzata alla perfezione.
        </h2>
        <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto relative z-10">
          Disegna il tuo locale in pochi minuti e inizia subito a gestire i tavoli in modo visivo.
        </p>
        <Button
          asChild
          className="h-16 px-12 text-xl font-bold bg-[#FF9710] hover:bg-[#e0850e] text-white rounded-2xl shadow-xl hover:scale-105 transition-transform relative z-10"
        >
          <Link href="/register">Disegna la tua sala</Link>
        </Button>
      </motion.div>
    </div>
  </section>
)

export default PageView
