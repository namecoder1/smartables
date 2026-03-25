'use client'

import { Button } from '@/components/ui/button'
import React from 'react'
import { motion } from 'motion/react'
import Link from 'next/link'

const E = [0.22, 1, 0.36, 1] as const
const D = 0.65
const fadeUp = { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { duration: D, ease: E } } }
const stagger = (c = 0.08) => ({ hidden: {}, visible: { transition: { staggerChildren: c } } })

interface HeroProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  description: string
  ctaText: string
  ctaHref?: string
  secondaryCtaText?: string
  secondaryCtaHref?: string
}

const Hero = ({
  icon,
  title,
  subtitle,
  description,
  ctaText,
  ctaHref = '/register',
  secondaryCtaText,
  secondaryCtaHref,
}: HeroProps) => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden bg-white border-b-2 border-primary/5">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-150 h-150 bg-[#FF9710]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-125 h-125 bg-orange-100/40 rounded-full blur-[80px]" />
      </div>

      <motion.div
        className="container relative z-10 px-4 md:px-6 mx-auto flex flex-col items-center text-center"
        variants={stagger()}
        initial="hidden"
        animate="visible"
      >
        

        <motion.h1
          variants={fadeUp}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-gray-900 mb-8 max-w-4xl leading-[1.1]"
        >
          {subtitle}
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="text-xl md:text-2xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          {description}
        </motion.p>

        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
          <Button
            asChild
            className="h-14 px-10 text-lg font-bold bg-[#FF9710] hover:bg-[#ff8906] text-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(255,151,16,0.5)] transition-all hover:scale-105"
          >
            <Link href={ctaHref}>{ctaText}</Link>
          </Button>
          {secondaryCtaText && secondaryCtaHref && (
            <Button
              asChild
              variant="ghost"
              className="h-14 px-10 text-lg font-bold text-gray-600 hover:text-[#FF9710] hover:bg-orange-50 rounded-2xl transition-all"
            >
              <Link href={secondaryCtaHref}>{secondaryCtaText}</Link>
            </Button>
          )}
        </motion.div>
      </motion.div>
    </section>
  )
}

export default Hero
