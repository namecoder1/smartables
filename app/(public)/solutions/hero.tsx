import { Button } from '@/components/ui/button'
import React from 'react'

const Hero = ({
  icon,
  title,
  subtitle,
  description,
  ctaText
}: {
  icon: React.ReactNode,
  title: string,
  subtitle: string,
  description: string,
  ctaText: string
}) => {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-white">
      <div className="absolute inset-0 z-0">
        {/* Abstract Background */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#FF9710]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-orange-100/40 rounded-full blur-[80px]" />
      </div>

      <div className="container relative z-10 px-4 md:px-6 mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-[#FF9710] font-semibold text-sm mb-8 animate-fade-in-up">
          <span className="p-1 bg-[#FF9710]/20 rounded-full">
            {icon}
          </span>
          {title}
        </div>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-gray-900 mb-8 max-w-4xl leading-[1.1]">
          {subtitle}
        </h1>
        <p className="text-xl md:text-2xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          {description}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="h-14 px-10 text-lg font-bold bg-[#FF9710] hover:bg-[#ff8906] text-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(255,151,16,0.5)] transition-all hover:scale-105">
            {ctaText}
          </Button>
        </div>
      </div>
    </section>
  )
}

export default Hero