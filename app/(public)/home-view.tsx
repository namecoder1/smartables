'use client'

import Image from 'next/image'
import { CheckCircle2, Users, LayoutDashboard, LineChart, MessageCircle, PhoneMissed, Smartphone, X, EllipsisVertical, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { FaRegCalendarXmark, FaWhatsapp } from 'react-icons/fa6'
import { MdOutlineReply, MdPlayArrow } from 'react-icons/md'
import { TbClipboardText } from 'react-icons/tb'
import { PLANS } from '@/lib/plans'
import { Progress } from '@/components/ui/progress'
import { BiSolidBellRing } from 'react-icons/bi'
import { BsFillBarChartFill } from 'react-icons/bs'
import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { SanityFaq } from '@/utils/sanity/queries'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

const E = [0.22, 1, 0.36, 1] as const   // ease-out-expo
const D = 0.65

const fadeUp    = { hidden: { opacity: 0, y: 32 },       visible: { opacity: 1, y: 0,     transition: { duration: D, ease: E } } }
const fadeLeft  = { hidden: { opacity: 0, x: -40 },      visible: { opacity: 1, x: 0,     transition: { duration: D, ease: E } } }
const fadeRight = { hidden: { opacity: 0, x: 40 },       visible: { opacity: 1, x: 0,     transition: { duration: D, ease: E } } }
const scaleUp   = { hidden: { opacity: 0, scale: 0.92 }, visible: { opacity: 1, scale: 1, transition: { duration: D, ease: E } } }

const stagger = (children = 0.1, delay = 0) => ({
  hidden:  {},
  visible: { transition: { staggerChildren: children, delayChildren: delay } },
})

const VP = { once: false, margin: '-80px' } as const


const HomeView = ({
  reservations,
  setupFee,
  faqs
} : {
  reservations: number | null,
  setupFee: boolean,
  faqs: SanityFaq[]
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans overflow-x-hidden selection:bg-[#FF9710] selection:text-white">
      <Hero isPromo={setupFee} />
      <SocialProof count={reservations || 0} />
      <HookSection />
      <ShowcaseSection />
      <BentoSection />
      <PricingSection />
      <CRMFeatures />
      <FAQSection faqs={faqs} />
      <CTA />
    </div>
  )
}

const Hero = ({
  isPromo
} : {
  isPromo: boolean
}) => {
  const [activePhone, setActivePhone] = useState<1 | 2>(2)

  useEffect(() => {
    const timer = setInterval(() => {
      setActivePhone(p => (p === 1 ? 2 : 1))
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden py-16 mb-20 xl:mb-0 xl:pb-10 px-4 md:px-8 xl:px-20">
      {/* Background decorative blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 right-[30%] w-175 h-175 bg-orange-100/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-100 h-100 bg-orange-50/60 rounded-full blur-2xl" />
      </div>

      <div className="w-full px-10 max-w-7xl mx-auto mt-4 xl:mt-10 relative z-10 flex flex-col xl:flex-row items-center xl:items-start gap-10 xl:gap-20">

        {/* Text column — staggered on mount */}
        <motion.div
          className='flex flex-col items-center xl:items-start text-center xl:text-left'
          variants={stagger(0.08)}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUp} className="flex items-center gap-2 mb-5 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
            <FaWhatsapp className="text-green-600" size={14} />
            <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">CRM per Ristoranti su WhatsApp</span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl xl:text-7xl flex-1 font-bold tracking-tighter text-gray-900 mb-6 xl:mb-8 max-w-4xl leading-[1.1]">
            Ogni chiamata persa è un tavolo vuoto.{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#FF9710] to-[#FF6B00]">
              Noi lo recuperiamo.
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg md:text-xl xl:text-2xl text-muted-foreground mb-8 xl:mb-10 max-w-2xl leading-relaxed">
            Il primo CRM per ristoranti che trasforma le chiamate perse in clienti reali tramite WhatsApp. Automatizza la sala, fidelizza i clienti e aumenta il fatturato.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-5 w-full justify-center xl:justify-start">
            <Button asChild className="h-14 px-6 text-lg font-bold bg-[#FF9710] hover:bg-[#ff8906] text-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(255,151,16,0.5)] transition-all hover:scale-105 hover:shadow-[0_25px_50px_-12px_rgba(255,151,16,0.6)]">
              <Link href='/register'>Prova ora</Link>
            </Button>
            <Button variant="ghost" className="h-14 px-10 text-lg font-bold text-gray-600 hover:text-[#FF9710] hover:bg-orange-50 rounded-2xl transition-all">
              <Link href='/solutions'>Scopri come funziona</Link>
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center xl:justify-start gap-x-5 gap-y-2 mt-8">
            {['WhatsApp nativo', 'Prenotazioni 24/7', 'CRM integrato'].map(label => (
              <div key={label} className="flex items-center gap-1.5 text-sm text-gray-500">
                <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                {label}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Phones container — slides in from right on mount */}
        <motion.div
          className='relative h-130 w-full xl:h-162.5 xl:w-105 xl:shrink-0 mt-6 xl:mt-0'
          initial={{ opacity: 0, x: 48 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: E }}
        >
          {/* Phone 1 — Booking Form */}
          <div className={cn(
            "absolute border-gray-800 bg-gray-800 border-14 rounded-[2.5rem] h-150 w-75 shadow-xl transition-all duration-700 ease-in-out",
            activePhone === 1
              ? "top-4 left-1/2 -translate-x-1/2 scale-[0.85] rotate-6 z-20 opacity-100 xl:translate-x-0 xl:top-8 xl:left-3 xl:scale-100"
              : "top-4 left-1/2 -translate-x-1/2 scale-[0.85] rotate-0 z-10 opacity-0 pointer-events-none xl:opacity-60 xl:scale-95 xl:-top-10 xl:right-10 xl:left-auto xl:translate-x-0"
          )}>
            <div className="h-8 w-0.75 bg-gray-800 absolute -start-4.25 top-18 rounded-s-lg"></div>
            <div className="h-11.5 w-0.75 bg-gray-800 absolute -start-4.25 top-31 rounded-s-lg"></div>
            <div className="h-11.5 w-0.75 bg-gray-800 absolute -start-4.25 top-44.5 rounded-s-lg"></div>
            <div className="h-16 w-0.75 bg-gray-800 absolute -end-4.25 top-35.5 rounded-e-lg"></div>
            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-[#E5DDD5] relative flex flex-col">
              <div className={cn(
                "bg-[#075E54] p-4 flex items-center gap-3 text-white shadow-md z-10 transition-opacity duration-700",
                activePhone !== 1 && "opacity-30"
              )}>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Image src="/mock-logo.jpg" width={32} height={32} alt="Logo" className="rounded-full" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">Pizzeria Italia</p>
                  <p className="text-[10px] opacity-80">Online</p>
                </div>
              </div>
              <div className='flex-1 flex flex-col justify-between bg-muted rounded-t-3xl border-2 border-b-0'>
                <div className='flex flex-col gap-2'>
                  <div className='flex items-center justify-between py-2 px-3 border-b'>
                    <X size={16} />
                    <p className='text-sm font-medium'>Prenota un tavolo</p>
                    <EllipsisVertical size={16} />
                  </div>
                  <div className='py-4 px-2 space-y-4'>
                    <div className='flex items-center justify-between p-3 border rounded-xl'>
                      <p className='text-muted-foreground text-sm'>Quante persone?</p>
                      <MdPlayArrow size={12} />
                    </div>
                    <div className='flex items-center justify-between p-3 border rounded-xl'>
                      <p className='text-muted-foreground text-sm'>Zona preferita (opzionale)</p>
                      <MdPlayArrow size={12} />
                    </div>
                    <div className='flex items-center justify-between p-3 border rounded-xl'>
                      <p className='text-muted-foreground text-sm'>Data</p>
                      <MdPlayArrow size={12} />
                    </div>
                    <div className='flex items-center justify-between p-3 border rounded-xl'>
                      <p className='text-muted-foreground text-sm'>Orario</p>
                      <MdPlayArrow size={12} />
                    </div>
                  </div>
                </div>
                <div className='border-t p-4'>
                  <div className='bg-neutral-200/60 py-2 rounded-xl w-full'>
                    <p className='text-center text-sm text-neutral-400'>Continua</p>
                  </div>
                  <p className='text-[10px] text-center mt-2'>Managed by the business. <span className='text-emerald-500'>Learn more</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Phone 2 — Chat */}
          <div className={cn(
            "absolute border-gray-800 bg-gray-800 border-14 rounded-[2.5rem] h-150 w-75 shadow-xl transition-all duration-700 ease-in-out",
            activePhone === 2
              ? "top-4 left-1/2 -translate-x-1/2 scale-[0.85] rotate-6 z-20 opacity-100 xl:translate-x-0 xl:top-8 xl:left-3 xl:scale-100"
              : "top-4 left-1/2 -translate-x-1/2 scale-[0.85] rotate-0 z-10 opacity-0 pointer-events-none xl:opacity-60 xl:scale-95 xl:-top-10 xl:right-10 xl:left-auto xl:translate-x-0"
          )}>
            <div className="h-8 w-0.75 bg-gray-800 absolute -start-4.25 top-18 rounded-s-lg"></div>
            <div className="h-11.5 w-0.75 bg-gray-800 absolute -start-4.25 top-31 rounded-s-lg"></div>
            <div className="h-11.5 w-0.75 bg-gray-800 absolute -start-4.25 top-44.5 rounded-s-lg"></div>
            <div className="h-16 w-0.75 bg-gray-800 absolute -end-4.25 top-35.5 rounded-e-lg"></div>
            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-[#E5DDD5] relative flex flex-col">
              <div className="bg-[#075E54] p-4 flex items-center gap-3 text-white shadow-md z-40">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Image src="/mock-logo.jpg" width={32} height={32} alt="Logo" className="rounded-full" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">Pizzeria Italia</p>
                  <p className="text-[10px] opacity-80">Online</p>
                </div>
              </div>
              <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
                <div className="flex justify-start animate-in slide-in-from-left-4 duration-700 fade-in fill-mode-forwards">
                  <div className="bg-white rounded-tr-lg rounded-bl-lg rounded-br-lg max-w-[85%] shadow-sm relative">
                    <div className='p-3 pb-2'>
                      <p className="text-xs text-gray-800 leading-relaxed">
                        Ciao! Hai chiamato Pizzeria Italia ma non siamo riusciti a risponderti. Come possiamo aiutarti?
                      </p>
                      <div className='mt-2 flex items-center justify-between'>
                        <span className="text-[9px] text-gray-400">Powered by Smartables</span>
                        <span className="text-[9px] text-gray-400">12:01</span>
                      </div>
                    </div>
                    <div>
                      <div className='flex border-y py-2 items-center justify-center gap-2 text-[#00A5F4] opacity-35'>
                        <MdOutlineReply color='#339CC9' />
                        <p className='text-xs'>Sono un fornitore</p>
                      </div>
                      <div className='flex border-b py-2 items-center justify-center gap-2 text-[#00A5F4] opacity-35'>
                        <MdOutlineReply color='#339CC9' />
                        <p className='text-xs'>Richiamatemi</p>
                      </div>
                      <div className='flex py-2 items-center justify-center gap-2 text-[#00A5F4]'>
                        <TbClipboardText color='#339CC9' />
                        <p className='text-xs'>Prenota un tavolo</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end animate-in slide-in-from-right-4 duration-700 fade-in fill-mode-forwards">
                  <div className="bg-[#dcf8c6] rounded-tl-lg rounded-bl-lg rounded-br-lg p-3 pb-5 max-w-[85%] shadow-sm relative">
                    <p className="text-xs text-gray-800">Hai inviato un modulo.</p>
                    <span className="text-[9px] text-gray-500 absolute bottom-1 right-2">12:02</span>
                  </div>
                </div>
                <div className="flex justify-start animate-in slide-in-from-left-4 duration-700 fade-in fill-mode-forwards">
                  <div className="bg-white rounded-tr-lg rounded-bl-lg rounded-br-lg p-3 max-w-[85%] shadow-sm relative">
                    <p className="text-xs text-gray-800 leading-relaxed">
                      La tua prenotazione per 3 persone a nome di Marco Rossi per il 4 Aprile alle 20:15 è stata registrata! Ti aspettiamo presso Pizzeria Italia
                    </p>
                    <span className="text-[9px] text-gray-400 absolute bottom-1 right-2">12:02</span>
                  </div>
                </div>
              </div>
              <div className="p-2 pb-3 bg-[#f0f0f0] flex items-center gap-2">
                <div className="w-full h-8 bg-white rounded-xl border border-gray-200" />
                <div className="w-10 h-8 bg-[#075E54] rounded-full flex items-center justify-center text-white">
                  <MessageCircle size={16} />
                </div>
              </div>
            </div>
          </div>

          {/* Floating badges */}
          <div className="hidden xl:flex absolute top-10 z-30 -right-24 bg-white p-4 rounded-4xl shadow-xl items-center gap-3 animate-bounce border-2">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500">
              <PhoneMissed size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold">Chiamata Persa</p>
              <p className="text-sm font-bold text-gray-900">Ore 12:01</p>
            </div>
          </div>
          <div className="hidden xl:flex absolute -bottom-10 z-30 -left-10 bg-white p-4 rounded-4xl shadow-xl items-center gap-3 animate-bounce border-2">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <Smartphone size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold">Recuperati</p>
              <p className="text-sm font-bold text-gray-900">+60€</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

const SocialProof = ({ count } : { count: number }) => {
  return (
    <section className="py-12 bg-neutral-100 border-y-2">
      <motion.div
        className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 px-4 md:px-6"
        variants={stagger(0.2)}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
      >
        <motion.div variants={scaleUp} className='flex flex-col items-center md:items-start gap-1'>
          <h3 className='text-4xl font-light text-muted-foreground'>{count || 382}+</h3>
          <p className="text-sm font-bold text-primary uppercase tracking-widest">Prenotazioni Recuperate</p>
        </motion.div>
        <motion.div
          variants={fadeRight}
          className="flex flex-wrap justify-center items-center gap-x-8 gap-y-8 grayscale cursor-default hover:grayscale-0 transition-all duration-700"
        >
          <span className="text-2xl font-serif font-bold opacity-40 hover:opacity-90 hover:text-black transition-all duration-300">Da Vittorio</span>
          <span className="text-2xl font-mono font-bold opacity-40 hover:opacity-90 hover:text-black transition-all duration-300">Osteria Francescana</span>
          <span className="text-2xl font-sans font-black italic opacity-40 hover:opacity-90 hover:text-black transition-all duration-300">SORBILLO</span>
          <span className="text-2xl font-serif italic font-semibold opacity-40 hover:opacity-90 hover:text-black transition-all duration-300">La Pergola</span>
        </motion.div>
      </motion.div>
    </section>
  )
}

const HookSection = () => {
  const items = [
    {
      id: 1,
      icon: <PhoneMissed className='text-primary' size={24} />,
      title: 'La chiamata persa',
      text: 'Il 40% delle prenotazioni avviene fuori dall\'orario di servizio. Se non rispondi, il cliente chiama il prossimo ristorante su Google.'
    },
    {
      id: 2,
      icon: <FaRegCalendarXmark className='text-primary' size={24} />,
      title: 'Il No-Show distruttivo',
      text: 'Un tavolo prenotato fa guadagnare mediamente 45€ a coperto. Senza promemoria intelligenti inviati ai tuoi clienti stai lasciando tanta carne al fuoco.'
    }
  ]

  return (
    <section className='py-16 lg:py-32 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-10 px-4 md:px-6'>
      {/* Left: text + items */}
      <motion.div
        className='flex flex-col items-start gap-10 lg:gap-12 w-full lg:w-1/2'
        variants={stagger(0.15)}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
      >
        <motion.h3 variants={fadeLeft} className='text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight'>
          Perchè perdi fatturato senza nemmeno saperlo?
        </motion.h3>
        <motion.div variants={stagger(0.2)} className='flex flex-col items-start gap-8'>
          {items.map((item) => (
            <motion.div key={item.id} variants={fadeUp} className='flex items-start justify-start gap-6'>
              <div className='bg-primary/20 border-2 border-primary/25 mt-1 p-3 flex items-center justify-center rounded-full shrink-0'>
                {item.icon}
              </div>
              <div className='space-y-1'>
                <h4 className='text-xl lg:text-2xl font-semibold tracking-tight'>{item.title}</h4>
                <p className='text-muted-foreground text-base lg:text-lg'>{item.text}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Right: stat box */}
      <motion.div
        variants={fadeRight}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
        className='bg-primary/5 flex flex-col items-center justify-center gap-4 w-full lg:w-1/2 py-12 lg:h-100 rounded-4xl'
      >
        <h4 className='text-primary text-6xl md:text-7xl font-bold tracking-tighter'>22%</h4>
        <p className='text-lg md:text-xl font-medium text-[#6d4e00] max-w-sm text-center'>Aumento medio delle prenotazioni nel primo mese con Smartables.</p>
      </motion.div>
    </section>
  )
}

const ShowcaseSection = () => {
  const items = [
    {
      id: 1,
      title: 'Chiamata persa',
      text: 'Il cliente chiama ma sei impegnato in sala. Smartables intercetta il segnale di occupato o mancata risposta.'
    },
    {
      id: 2,
      title: 'Whatsapp automatico',
      text: 'Dopo 30 secondi, il cliente riceve un Whatsapp gentile e personalizzato con il link per prenotare.'
    },
    {
      id: 3,
      title: 'Tavolo confermato',
      text: 'Il cliente prenota, tu ricevi la notifica in dashboard e il tavolo è venduto. Senza alzare la cornetta.'
    }
  ]

  return (
    <section className='bg-neutral-900 pt-16 lg:pt-32 px-4 md:px-10 relative'>
      <div className='flex flex-col gap-10 items-center max-w-7xl mx-auto mb-40'>
        <motion.div
          className='flex flex-col items-center justify-center gap-4'
          variants={stagger(0.15)}
          initial="hidden"
          whileInView="visible"
          viewport={VP}
        >
          <motion.h4 variants={fadeUp} className='text-light uppercase text-primary tracking-wide'>Processo impeccabile</motion.h4>
          <motion.h2 variants={fadeUp} className='text-3xl md:text-4xl text-white font-bold tracking-tight text-center'>
            Semplice come un gesto del Maître
          </motion.h2>
        </motion.div>

        <motion.div
          className='grid grid-cols-1 lg:grid-cols-3 gap-8 items-center justify-center w-full'
          variants={stagger(0.18)}
          initial="hidden"
          whileInView="visible"
          viewport={VP}
        >
          {items.map((item) => (
            <motion.div key={item.id} variants={fadeUp} className='relative h-48'>
              <h4 className='text-9xl text-muted-foreground/30 absolute top-0 left-0'>0{item.id}</h4>
              <div className='absolute top-20 left-6 space-y-4'>
                <h2 className='text-primary text-2xl'>{item.title}</h2>
                <p className='text-white/60 text-lg'>{item.text}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.div
        className='bg-muted p-4 md:p-6 rounded-[32px] mb-16 md:mb-32 max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8'
        variants={scaleUp}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
      >
        <div className='w-full md:w-2/3 rounded-xl relative h-52 md:h-100'>
          <Image quality={100} src='/dashboard-showcase.png' alt='Dashboard Showcase' className='rounded-xl object-cover transition-all duration-500' fill sizes="(max-width: 768px) 100vw, 60vw" priority />
        </div>
        <div className='w-full md:w-1/3 flex flex-col gap-4 items-start'>
          <h3 className='text-2xl md:text-3xl tracking-tight font-semibold'>Integrazione invisibile</h3>
          <p className='text-base md:text-lg text-muted-foreground'>Grazie alla dashboard di Smartables riesco a capire al volo cosa posso migliorare del mio ristorante, non tornerei mai indietro!</p>
        </div>
      </motion.div>
    </section>
  )
}

const BentoSection = () => {
  return (
    <section className='py-16 lg:py-32 flex items-center flex-col gap-8 lg:gap-14 px-4 md:px-6'>
      <motion.h2
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
        className='text-3xl md:text-4xl lg:text-5xl text-black font-bold tracking-tight text-center'
      >
        Strumenti per un&apos;accoglienza moderna
      </motion.h2>

      <motion.div
        className='flex flex-col gap-6 w-full max-w-7xl mx-auto'
        variants={stagger(0.12)}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
      >
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 w-full h-fit'>
          <motion.div variants={scaleUp} className='bg-neutral-100 border-2 rounded-4xl md:col-span-2 p-6 space-y-4'>
            <PhoneMissed className='text-primary' size={32} />
            <h3 className='text-2xl font-bold tracking-tight'>Missed Call Recovery</h3>
            <p>Non lasciare mai più un cliente nel limbo. Il nostro sistema lavora 24/7, anche quando il ristorante è chiuso o il personale è al massimo delle capacità</p>
          </motion.div>
          <motion.div variants={scaleUp} className='bg-white border-2 rounded-4xl p-6 space-y-4'>
            <FaWhatsapp className='text-primary' size={32} />
            <h3 className='text-2xl font-bold tracking-tight'>AI Whatsapp Bot</h3>
            <p>Risponde automaticamente a domande su menù, allergie e orari.</p>
          </motion.div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 w-full h-fit'>
          <motion.div variants={scaleUp} className='bg-white border-2 rounded-4xl p-6 space-y-4'>
            <BiSolidBellRing className='text-primary' size={32} />
            <h3 className='text-2xl font-bold tracking-tight'>No-Show Killer</h3>
            <p>Promemoria automatici e richiesta di conferma via Whatsapp 2 ore prima del pasto.</p>
          </motion.div>
          <motion.div variants={scaleUp} className='bg-neutral-100 border-2 flex flex-col md:flex-row items-start md:items-center rounded-4xl md:col-span-2 p-6 gap-4 md:gap-x-4'>
            <div className='space-y-4 w-full md:w-1/2'>
              <BsFillBarChartFill className='text-primary' size={32} />
              <h3 className='text-2xl font-bold tracking-tight'>Analytics & CRM</h3>
              <p>Vedi esattamente quanti euro hai recuperato e costruisci un database di clienti fedeli.</p>
            </div>
            <div className='border-2 w-full md:w-1/2 p-4 rounded-2xl bg-white'>
              <div className='flex items-center justify-between'>
                <p className='uppercase font-bold text-sm'>Recupero</p>
                <p className='uppercase font-bold text-xs'>+24%</p>
              </div>
              <Progress value={40} className='mt-2' />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

const IntegrationBadge = ({ label }: { label: string }) => (
  <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
    {label}
  </span>
)

const FeatureCard = ({ icon, title, description, colorClass, badge }: { icon: React.ReactNode, title: string, description: string, colorClass: string, badge?: React.ReactNode }) => (
  <div className="group p-8 rounded-[2rem] border-2 h-full bg-white transition-all hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-2 cursor-default border-gray-100">
    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", colorClass)}>
      {icon}
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
    <p className="text-gray-500 leading-relaxed font-medium">{description}</p>
    {badge}
  </div>
)

const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <section className='bg-neutral-900 py-16 lg:py-32 flex items-center flex-col gap-8 lg:gap-12 px-4 md:px-6'>
      <motion.div
        variants={stagger(0.12)}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
        className="flex flex-col items-center gap-4"
      >
        <motion.h2 variants={fadeUp} className='text-3xl md:text-4xl lg:text-5xl text-white font-bold tracking-tight text-center'>
          Piani su misura per ogni sala
        </motion.h2>
        <motion.p variants={fadeUp} className='text-white/60 text-lg 2xl:text-xl'>
          Recupera solo 3 tavoli al mese per coprire l'intero costo del sistema.
        </motion.p>
      </motion.div>

      <motion.div variants={fadeUp} className='flex items-center gap-4'>
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
      <motion.div
        className='grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-7xl mx-auto'
        variants={stagger(0.15)}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
      >
        {PLANS.map((plan) => (
          <motion.div key={plan.id} variants={scaleUp}>
            <PricingCard plan={plan} isAnnual={isAnnual} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

const CRMFeatures = () => {
  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-20"
          variants={stagger(0.12)}
          initial="hidden"
          whileInView="visible"
          viewport={VP}
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Ora disponibile
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            Già su TheFork o OpenTable?<br />
            <span className="text-[#FF9710]">Collega tutto in un click.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-xl text-gray-500">
            Smartables si integra con le piattaforme che già usi. Le prenotazioni esterne entrano automaticamente nel tuo CRM — con preferenze, allergie e storico ospite già compilati.
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
          variants={stagger(0.15)}
          initial="hidden"
          whileInView="visible"
          viewport={VP}
        >
          <motion.div variants={scaleUp}>
            <FeatureCard
              icon={<Users size={32} />}
              title="Profili ospiti arricchiti"
              description="Quando un cliente TheFork arriva, il suo profilo è già pronto: allergie, preferenze di posto, storico visite. Zero inserimento manuale."
              colorClass="bg-blue-50 text-blue-600"
              badge={<div className="flex flex-wrap gap-2 mt-4"><IntegrationBadge label="TheFork" /><IntegrationBadge label="Quandoo" /><IntegrationBadge label="OpenTable" /></div>}
            />
          </motion.div>
          <motion.div variants={scaleUp}>
            <FeatureCard
              icon={<LayoutDashboard size={32} />}
              title="Zero double booking"
              description="Quando accetti una prenotazione via WhatsApp, la disponibilità si aggiorna su TheFork e OpenTable in tempo reale. Un sistema centrale, nessun conflitto."
              colorClass="bg-orange-50 text-[#FF9710]"
              badge={<div className="flex flex-wrap gap-2 mt-4"><IntegrationBadge label="Sync bidirezionale" /><IntegrationBadge label="Real-time" /></div>}
            />
          </motion.div>
          <motion.div variants={scaleUp}>
            <FeatureCard
              icon={<LineChart size={32} />}
              title="Analytics per canale"
              description="Confronta tasso di no-show, revenue e coperti per canale: WhatsApp, TheFork, telefono, web. Sai esattamente dove vale la pena investire."
              colorClass="bg-purple-50 text-purple-600"
              badge={<div className="flex flex-wrap gap-2 mt-4"><IntegrationBadge label="No-show per fonte" /><IntegrationBadge label="Revenue per canale" /></div>}
            />
          </motion.div>
        </motion.div>

        {/* Bottom callout */}
        <motion.div
          className="mt-6 md:mt-8 rounded-4xl bg-gray-50 border-2 border-gray-100 px-6 py-5.5 flex flex-col md:flex-row items-center justify-between gap-6"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VP}
        >
          <div className="flex flex-col gap-2">
            <p className="text-lg font-bold text-gray-900">Disponibile sui piani Growth e Business</p>
            <p className="text-gray-500 text-sm max-w-xl">
              Collega TheFork, Quandoo o OpenTable dalle impostazioni della tua sede. Nessuna configurazione complessa — solo le credenziali API del tuo account.
            </p>
          </div>
          <Button asChild size="lg" className="rounded-2xl px-8 h-12 font-bold shrink-0 bg-gray-900 hover:bg-gray-800 text-white">
            <Link href="/register">Inizia gratis</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

const FAQSection = ({
  faqs
} : {
  faqs: SanityFaq[]
}) => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container px-4 md:px-6 mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Domande sul supporto</h2>
          <p className="text-xl text-gray-500">Risposte alle domande più comuni sul Smartables.</p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Accordion type="single" collapsible className="border border-gray-200 px-4 rounded-3xl bg-white shadow-sm hover:shadow-sm transition-shadow duration-200">
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

const CTA = () => {
  return (
    <section className="bg-primary relative overflow-hidden">
      <div className="w-full max-w-5xl mx-auto px-4 md:px-6 text-center relative z-10">
        <motion.div
          className="p-12 md:p-24 relative overflow-hidden text-center"
          variants={scaleUp}
          initial="hidden"
          whileInView="visible"
          viewport={VP}
        >
          <motion.div
            variants={stagger(0.12)}
            initial="hidden"
            whileInView="visible"
            viewport={VP}
            className="relative z-10"
          >
            <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-bold text-white mb-8">
              Pronto a rivoluzionare <br /> il tuo ristorante?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
              Smetti di lasciare soldi sul tavolo. Unisciti ai migliori ristoranti italiani che hanno gia automatizzato il loro successo.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="h-16 px-12 text-xl font-bold bg-black hover:bg-black! text-white rounded-2xl shadow-xl hover:scale-105 transition-all">
                Inizia ora
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

const PricingCard = ({
  plan,
  isAnnual,
} : {
  plan: any,
  isAnnual: boolean,
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
              "text-2xl font-bold tracking-tight",
              !popular ? 'text-white' : 'text-black' 
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
              "font-extrabold tracking-tight text-4xl",
              popular ? 'text-black' : 'text-white'
            )}>
              €{price}
            </span>
            <span className={cn(
              'font-medium',
              popular ? 'text-black' : 'text-white'
            )}>{period}</span>
          </div>
          {showSetupFee && (
            <p className="text-xs mt-2 text-gray-500">
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
                <p className={!popular ? "text-white/70" : "text-black"}>
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
                "shadow-md hover:shadow-lg transition-all bg-black hover:bg-black!"
                : "bg-primary border-primary hover:bg-primary/90 hover:text-white"
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

export default HomeView
