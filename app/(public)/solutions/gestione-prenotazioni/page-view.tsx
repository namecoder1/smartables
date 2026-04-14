'use client'

import { Calendar, Bell, MessageSquare, ShieldCheck, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Hero from '../hero'
import { motion } from 'motion/react'
import Link from 'next/link'
import Image from 'next/image'
import { MdOutlineReply } from 'react-icons/md'

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
        icon={<Calendar className="h-4 w-4" />}
        title="Gestione Prenotazioni"
        subtitle="L'80% dei no-show si evita con un messaggio."
        description="Conferme via WhatsApp, promemoria automatici e carta a garanzia. Il tuo sistema di prenotazione lavora per te — anche quando sei in sala."
        ctaText="Attiva prenotazioni smart"
        ctaHref="/register"
        secondaryCtaText="Come funziona"
        secondaryCtaHref="#flow"
      />
      <BenefitsSection />
      <FlowSection />
      <CTASection />
    </div>
  )
}

const benefits = [
  {
    icon: MessageSquare,
    theme: 'green' as const,
    title: 'WhatsApp First',
    description: 'Le conferme arrivano dove i clienti le leggono davvero: su WhatsApp. Un semplice tap su "Sì" blocca il tavolo.',
  },
  {
    icon: ShieldCheck,
    theme: 'orange' as const,
    title: 'Carta a Garanzia',
    description: 'Per tavoli numerosi o serate speciali, richiedi una carta a garanzia in modo automatico. Zero no-show d\'impulso.',
  },
  {
    icon: Bell,
    theme: 'blue' as const,
    title: 'Reminder Automatici',
    description: '24 ore prima Smartables manda una conferma. Se il cliente disdice, il tavolo torna subito disponibile per altri.',
  },
]

const themeMap = {
  green: { light: 'bg-green-50', icon: 'text-green-600', border: 'hover:border-green-50' },
  orange: { light: 'bg-orange-50', icon: 'text-orange-600', border: 'hover:border-orange-50' },
  blue: { light: 'bg-blue-50', icon: 'text-blue-600', border: 'hover:border-blue-50' },
}

const BenefitsSection = () => (
  <section className="py-24 bg-white">
    <div className="container px-4 md:px-6 mx-auto max-w-7xl">
      <motion.div
        className="text-center max-w-3xl mx-auto mb-16"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
      >
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Il tuo assistente virtuale{' '}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-[#FF9710] to-[#FF6B00]">
            per le prenotazioni
          </span>
        </h2>
        <p className="text-xl text-gray-500">
          Non perdere tempo al telefono. Lascia che Smartables gestisca il flusso.
        </p>
      </motion.div>

      <motion.div
        className="grid md:grid-cols-3 gap-6"
        variants={stagger(0.12)}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
      >
        {benefits.map((b) => {
          const t = themeMap[b.theme]
          return (
            <motion.div
              key={b.title}
              variants={scaleUp}
              className={`p-8 rounded-3xl bg-white border-2 border-transparent transition-all hover:shadow-xl hover:-translate-y-1 ${t.border}`}
            >
              <div className={`p-4 rounded-2xl w-fit mb-6 ${t.light}`}>
                <b.icon className={`w-8 h-8 ${t.icon}`} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{b.title}</h3>
              <p className="text-gray-500 leading-relaxed">{b.description}</p>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  </section>
)

const flowSteps = [
  { step: 1, title: 'Prenotazione ricevuta', desc: 'Il cliente prenota — via WhatsApp, telefono o link pubblico.', color: 'bg-gray-800 border-gray-900' },
  { step: 2, title: 'Reminder automatico', desc: 'Smartables invia un messaggio WhatsApp 24h prima con richiesta di conferma.', color: 'bg-blue-600 border-blue-700' },
  { step: 3, title: 'Conferma o disdetta', desc: 'Il cliente risponde con un tap. Se disdice, il tavolo si libera per altri in automatico.', color: 'bg-[#FF9710] border-primary' },
]

const FlowSection = () => (
  <section id="flow" className="py-24 bg-gray-50 border-t border-gray-100 overflow-hidden relative">
    <div className="absolute top-1/4 left-[-10%] w-150 h-150 bg-green-200/20 rounded-full blur-[100px] pointer-events-none" />
    <div className="container px-4 md:px-6 mx-auto max-w-7xl relative z-10">
      <motion.div
        className="grid lg:grid-cols-2 gap-20 items-center"
        variants={stagger()}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
      >
        {/* Left: steps */}
        <motion.div variants={fadeLeft}>
          <span className="inline-block py-1 px-3 rounded-full bg-[#FF9710]/10 text-[#FF9710] font-bold tracking-wider uppercase text-xs mb-6">
            Il Flusso Intelligente
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 leading-tight">
            Come Smartables sconfigge i no-show
          </h2>

          <div className="space-y-10 relative">
            <div className="absolute left-5.75 top-4 bottom-4 w-0.5 bg-border" />
            {flowSteps.map((item) => (
              <div key={item.step} className="relative flex gap-8 items-start">
                <div className={`w-12 h-12 rounded-full ${item.color} text-white flex items-center justify-center text-lg font-bold shrink-0 shadow-lg relative z-10 border-4`}>
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: WhatsApp mockup */}
        <motion.div variants={fadeRight} className="relative">
          <div className="absolute -inset-4 bg-linear-to-tr from-green-200 to-blue-200 rounded-[3rem] blur-xl opacity-40" />
          <div className="relative bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] rounded-[2.5rem] shadow-2xl p-8 border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-[#075E54] -mx-8 -mt-8 px-8 py-4 mb-6 flex items-center gap-3">
                <Image src='/mock-logo.jpg' className='h-10 w-10 rounded-full' alt='Mock Logo' width={40} height={40} />
              <div>
                <p className="font-bold text-white text-sm">Pizzeria Italia</p>
                <p className="text-[10px] text-white/70">Promemoria automatico</p>
              </div>
            </div>

            <div className="space-y-5">

              <div className="bg-white rounded-tr-lg rounded-bl-lg rounded-br-lg max-w-[85%] shadow-sm relative">
                <div className='p-3 pb-2'>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    Ciao Marco! 👋 Confermi la cena di domani alle 20:30 per 4 persone presso Pizzaurum?
                  </p>
                  <div className='mt-2 flex items-center justify-between'>
                    <span className="text-[9px] text-gray-400">Powered by Smartables</span>
                    <span className="text-[11px] text-gray-400">19:42</span>
                  </div>
                </div>
                <div>
                  <div className='flex border-y py-2 items-center justify-center gap-2 text-[#00A5F4]'>
                    <MdOutlineReply color='#339CC9' />
                    <p className='text-sm'>Confermo</p>
                  </div>
                  <div className='flex border-b py-2 items-center justify-center gap-2 text-[#00A5F4] opacity-35'>
                    <MdOutlineReply color='#339CC9' />
                    <p className='text-sm'>Disdico</p>
                  </div>
                </div>
              </div>


              <div className="bg-white rounded-tr-lg rounded-bl-lg rounded-br-lg p-4 max-w-[80%] shadow-sm">
                <p className="text-gray-800 text-sm">Ottimo! 🎉 Abbiamo confermato il tuo tavolo. A presto!</p>
              </div>

              <p className="text-xs text-center text-black bg-white/50 w-fit px-2 py-1 mx-auto rounded-xl backdrop-blur-xs mt-2 font-medium">
                Nessuna app richiesta • Solo WhatsApp
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  </section>
)

const guarantees = [
  'Prenotazioni da WhatsApp, web e telefono in un unico calendario',
  'Lista d\'attesa automatica con notifica al primo posto libero',
  'Storico prenotazioni per ogni cliente nel CRM',
  'Report settimanale su no-show e conversioni',
]

const CTASection = () => (
  <section className="py-32 bg-white overflow-hidden">
    <div className="container max-w-5xl mx-auto px-4">
      <motion.div
        className="bg-neutral-950 rounded-[3rem] p-12 md:p-20 relative overflow-hidden shadow-2xl text-center"
        variants={scaleUp}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
      >
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#FF9710]/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-primary/15 rounded-full blur-[120px]" />

        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">
          Basta sedie vuote.
        </h2>
        <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto relative z-10">
          L&apos;80% dei no-show si evita con un semplice messaggio. Inizia oggi.
        </p>

        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-10 relative z-10">
          {guarantees.map((g) => (
            <li key={g} className="flex items-center gap-2 text-gray-400 text-sm">
              <ArrowRight className="w-3 h-3 text-[#FF9710] shrink-0" />
              {g}
            </li>
          ))}
        </ul>

        <Button
          asChild
          className="h-16 px-12 text-xl font-bold bg-[#FF9710] hover:bg-[#ff8906] text-white rounded-2xl shadow-xl hover:scale-105 transition-transform relative z-10"
        >
          <Link href="/register">Attiva le prenotazioni smart</Link>
        </Button>
      </motion.div>
    </div>
  </section>
)

export default PageView