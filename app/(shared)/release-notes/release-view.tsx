'use client'

import { SanityVersion } from '@/utils/sanity/queries'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Package } from 'lucide-react'

const ReleaseView = ({
  versions
}: {
  versions: SanityVersion[]
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      {/* HERO */}
      <section className="bg-[#ff9f29] py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl px-6 text-center relative z-10"
        >
          <div className="inline-flex items-center gap-2 bg-white/15 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-white/20">
            <Package className="w-4 h-4" />
            Aggiornamenti piattaforma
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-5 tracking-tight text-white">
            Note di rilascio
          </h1>
          <p className="text-lg text-white/80 max-w-xl mx-auto">
            Ogni aggiornamento, ogni miglioramento. Il diario evolutivo di Smartables.
          </p>
        </motion.div>
      </section>

      {/* CONTENT */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-6">
          {versions.length === 0 ? (
            <p className="text-center text-gray-500">Nessuna versione pubblicata.</p>
          ) : (
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-2.75 top-2 bottom-2 w-0.5 bg-primary/60 hidden md:block" />

              <div className="flex flex-col gap-10">
                {versions.map((version, index) => {
                  return (
                    <motion.div
                      key={version.id}
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className="flex gap-6 md:gap-8"
                    >
                      {/* Timeline dot */}
                      <div className="hidden md:flex flex-col items-center shrink-0 mt-1">
                        <div className="w-6 h-6 rounded-full bg-[#fbbe73] border-2 border-primary flex items-center justify-center z-10" />
                      </div>

                      {/* Card */}
                      <Link
                        href={`/release-notes/${version.slug}`}
                        className="flex-1 group rounded-2xl border-2 border-gray-200 bg-white p-6 hover:border-[#ff9f29]/40 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-md border border-gray-200">
                            v{version.version}
                          </span>
                          <span className="text-xs text-gray-400 ml-auto capitalize">
                            {format(new Date(version.createdAt), 'dd MMMM yyyy', { locale: it })}
                          </span>
                        </div>

                        <h2 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#ff9f29] transition-colors">
                          {version.title}
                        </h2>

                        {version.excerpt && (
                          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">
                            {version.excerpt}
                          </p>
                        )}

                        <span className="inline-flex items-center gap-1 text-sm font-medium text-[#ff9f29] group-hover:gap-2 transition-all">
                          Leggi le note
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default ReleaseView
