'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

const E = [0.22, 1, 0.36, 1] as const
const D = 0.65
const fadeUp = { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { duration: D, ease: E } } }
const stagger = (c = 0.12, d = 0) => ({ hidden: {}, visible: { transition: { staggerChildren: c, delayChildren: d } } })

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 bg-white text-center selection:bg-[#FF9710] selection:text-white overflow-hidden">
      <motion.div
        className="flex flex-col items-center"
        variants={stagger(0.12, 0.05)}
        initial="hidden"
        animate="visible"
      >
        {/* 404 */}
        <motion.div variants={fadeUp} className="relative mb-2 leading-none select-none">
          <span className="text-[160px] md:text-[220px] font-black text-gray-100 leading-none">
            404
          </span>
          <span className="absolute inset-0 flex items-center justify-center text-[160px] md:text-[220px] font-black leading-none text-transparent bg-clip-text bg-linear-to-b from-[#FF9710] to-[#FF6B00] opacity-[0.12]">
            404
          </span>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="w-16 h-1 rounded-full bg-linear-to-r from-[#FF9710] to-[#FF6B00] mb-8"
        />

        <motion.h1 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Pagina non trovata
        </motion.h1>

        <motion.p variants={fadeUp} className="text-lg text-gray-500 max-w-md mb-10 leading-relaxed">
          La pagina che stai cercando non esiste o è stata spostata.
          Torna alla home e riprova.
        </motion.p>

        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
          <Button
            asChild
            className="h-12 px-8 font-bold bg-[#FF9710] hover:bg-[#ff8906] text-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(255,151,16,0.45)] transition-all hover:scale-105"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Torna alla home
            </Link>
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="h-12 px-8 font-bold text-gray-600 hover:text-[#FF9710] hover:bg-orange-50 rounded-2xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Vai indietro
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
