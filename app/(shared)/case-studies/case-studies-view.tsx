'use client'

import { CaseStudy } from '@/utils/sanity/queries'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { ArrowRight, Briefcase } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

function FeaturedCard({ caseStudy }: { caseStudy: CaseStudy }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mb-14"
    >
      <Link
        href={`/case-studies/${caseStudy.slug}`}
        className="group grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-gray-200 hover:border-[#FF9710]/40 hover:shadow-xl transition-all duration-300 bg-white"
      >
        {/* Image */}
        <div className="relative aspect-video md:aspect-auto overflow-hidden bg-gray-100">
          {caseStudy.image?.url ? (
            <Image
              src={caseStudy.image.url}
              alt={caseStudy.image.alt || caseStudy.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-[#FF9710]/20 to-amber-100 flex items-center justify-center">
              <Briefcase className="w-16 h-16 text-[#FF9710]/40" />
            </div>
          )}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1.5 bg-[#FF9710] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              In evidenza
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-10 flex flex-col justify-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-4 group-hover:text-[#FF9710] transition-colors">
            {caseStudy.title}
          </h2>
          <p className="text-gray-500 leading-relaxed mb-6 line-clamp-3">
            {caseStudy.excerpt}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FF9710]/10 flex items-center justify-center text-sm font-bold text-[#FF9710]">
                {caseStudy.author?.[0] ?? 'S'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{caseStudy.author}</p>
                {caseStudy.publishedAt && (
                  <p className="text-xs text-gray-400">
                    {format(new Date(caseStudy.publishedAt), 'd MMM yyyy', { locale: it })}
                  </p>
                )}
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF9710] group-hover:gap-2.5 transition-all">
              Leggi <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function CaseStudyCard({ caseStudy, index }: { caseStudy: CaseStudy; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/case-studies/${caseStudy.slug}`}
        className="group flex flex-col rounded-2xl overflow-hidden border border-gray-200 bg-white hover:border-[#FF9710]/40 hover:shadow-lg transition-all duration-300 h-full"
      >
        {/* Image */}
        <div className="relative aspect-video overflow-hidden bg-gray-100">
          {caseStudy.image?.url ? (
            <Image
              src={caseStudy.image.url}
              alt={caseStudy.image.alt || caseStudy.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Briefcase className="w-10 h-10 text-gray-300" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-6">
          <h3 className="font-bold text-gray-900 leading-snug mb-2 group-hover:text-[#FF9710] transition-colors line-clamp-2 mt-2">
            {caseStudy.title}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1 mb-4">
            {caseStudy.excerpt}
          </p>
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              {caseStudy.publishedAt
                ? format(new Date(caseStudy.publishedAt), 'd MMM yyyy', { locale: it })
                : ''}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF9710] group-hover:gap-1.5 transition-all">
              Leggi <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

const CaseStudiesView = ({ caseStudies }: { caseStudies: CaseStudy[] }) => {
  const featured = caseStudies.find((a) => a.featured)
  const regular = caseStudies.filter((a) => a.id !== featured?.id)

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      {/* HERO */}
      <section className="bg-[#121212] py-20 md:py-28 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl px-6 text-center relative z-10"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-white/20">
            <Briefcase className="w-4 h-4 text-[#FF9710]" />
            Le storie di successo
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-5 tracking-tight text-white">
            Case Studies
          </h1>
          <p className="text-lg text-white/80 max-w-xl mx-auto">
            Scopri come i nostri clienti hanno trasformato il loro ristorante con Smartables.
          </p>
        </motion.div>
      </section>

      {/* CONTENT */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          {caseStudies.length === 0 ? (
            <p className="text-center text-gray-400 py-16">Nessun case study pubblicato.</p>
          ) : (
            <>
              {/* Featured */}
              {featured && <FeaturedCard caseStudy={featured} />}

              {/* Grid */}
              {regular.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regular.map((caseStudy, i) => (
                    <CaseStudyCard key={caseStudy.id} caseStudy={caseStudy} index={i} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default CaseStudiesView
