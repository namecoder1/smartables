import { Button } from '@/components/ui/button'
import React from 'react'

const Hero = ({
  icon,
  title,
  subtitle,
  description,
  ctaText
} : {
  icon: React.ReactNode,
  title: string,
  subtitle: string,
  description: string,
  ctaText: string
}) => {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-black text-white">
      <div className="absolute inset-0 z-0 opacity-40">
        {/* Abstract gradient */}
        <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-[#da3743]/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="container relative z-10 px-4 md:px-6 mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-6">
          {icon}
          {title}
        </div>
        <h1 className="text-4xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
          {subtitle}
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 max-w-3xl leading-relaxed mb-10">
          {description}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="h-14 px-8 text-lg font-bold bg-[#FF9710] hover:bg-[#e0850e] text-white rounded-full">
            {ctaText}
          </Button>
        </div>
      </div>
    </section>
  )
}

export default Hero