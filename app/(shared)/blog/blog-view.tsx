'use client'

import { SanityArticleCard } from '@/utils/sanity/queries'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { motion } from 'motion/react'
import { ArrowRight, BookOpen, Clock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

const categoryLabels: Record<string, string> = {
  tips: 'Tips & Tricks',
  news: 'News',
  ristorazione: 'Ristorazione',
  ai: 'AI & Automazione',
}

const categoryColors: Record<string, string> = {
  tips: 'bg-blue-50 text-blue-700 border-blue-100',
  news: 'bg-purple-50 text-purple-700 border-purple-100',
  ristorazione: 'bg-green-50 text-green-700 border-green-100',
  ai: 'bg-amber-50 text-amber-700 border-amber-100',
}

const ALL = 'all'

function CategoryBadge({ category }: { category: string }) {
  const label = categoryLabels[category] || category
  const color = categoryColors[category] || 'bg-gray-50 text-gray-600 border-gray-100'
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${color}`}>
      {label}
    </span>
  )
}

function FeaturedCard({ article }: { article: SanityArticleCard }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mb-14"
    >
      <Link
        href={`/blog/${article.slug}`}
        className="group grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-gray-200 hover:border-[#FF9710]/40 hover:shadow-xl transition-all duration-300 bg-white"
      >
        {/* Image */}
        <div className="relative aspect-video md:aspect-auto overflow-hidden bg-gray-100">
          {article.image?.url ? (
            <Image
              src={article.image.url}
              alt={article.image.alt || article.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-[#FF9710]/20 to-amber-100 flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-[#FF9710]/40" />
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
          <div className="flex items-center gap-3 mb-4">
            <CategoryBadge category={article.category} />
            {article.readingTime && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {article.readingTime} min
              </span>
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-4 group-hover:text-[#FF9710] transition-colors">
            {article.title}
          </h2>
          <p className="text-gray-500 leading-relaxed mb-6 line-clamp-3">
            {article.excerpt}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {article.author === 'Tobia Bartolomei' ? (
                <Image src='/tobia-bartolomei.png' alt='Author Photo' width={100} height={100} className='w-10 h-10 border rounded-xl' />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#FF9710]/10 flex items-center justify-center text-base font-bold text-[#FF9710]">
                  {article.author?.[0] ?? 'S'}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-800">{article.author}</p>
                {article.publishedAt && (
                  <p className="text-xs text-gray-400">
                    {format(new Date(article.publishedAt), 'd MMM yyyy', { locale: it })}
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

function ArticleCard({ article, index }: { article: SanityArticleCard; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/blog/${article.slug}`}
        className="group flex flex-col rounded-2xl overflow-hidden border border-gray-200 bg-white hover:border-[#FF9710]/40 hover:shadow-lg transition-all duration-300 h-full"
      >
        {/* Image */}
        <div className="relative aspect-video overflow-hidden bg-gray-100">
          {article.image?.url ? (
            <Image
              src={article.image.url}
              alt={article.image.alt || article.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-gray-300" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-6">
          <div className="flex items-center gap-2 mb-3">
            <CategoryBadge category={article.category} />
            {article.readingTime && (
              <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                <Clock className="w-3 h-3" />
                {article.readingTime} min
              </span>
            )}
          </div>
          <h3 className="font-bold text-gray-900 leading-snug mb-2 group-hover:text-[#FF9710] transition-colors line-clamp-2">
            {article.title}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1 mb-4">
            {article.excerpt}
          </p>
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              {article.publishedAt
                ? format(new Date(article.publishedAt), 'd MMM yyyy', { locale: it })
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

const BlogView = ({ articles }: { articles: SanityArticleCard[] }) => {
  const [activeCategory, setActiveCategory] = useState(ALL)

  const featured = articles.find((a) => a.featured)
  const categories = Array.from(new Set(articles.map((a) => a.category).filter(Boolean)))

  const filtered = articles
    .filter((a) => activeCategory !== ALL || a.id !== featured?.id)
    .filter((a) => activeCategory === ALL || a.category === activeCategory)

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      {/* HERO */}
      <section className="bg-[#FF9710] py-20 md:py-28 relative overflow-hidden">
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
          <div className="inline-flex items-center gap-2 bg-white/15 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-white/20">
            <BookOpen className="w-4 h-4" />
            Risorse per il tuo ristorante
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-5 tracking-tight text-white">
            Blog Smartables
          </h1>
          <p className="text-lg text-white/80 max-w-xl mx-auto">
            Consigli pratici, novità e approfondimenti per gestire il tuo ristorante con intelligenza.
          </p>
        </motion.div>
      </section>

      {/* CONTENT */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          {articles.length === 0 ? (
            <p className="text-center text-gray-400 py-16">Nessun articolo pubblicato.</p>
          ) : (
            <>
              {/* Featured */}
              {featured && activeCategory === ALL && <FeaturedCard article={featured} />}

              {/* Category filter */}
              {categories.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-10">
                  <button
                    onClick={() => setActiveCategory(ALL)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                      activeCategory === ALL
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    Tutti
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                        activeCategory === cat
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {categoryLabels[cat] || cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Grid */}
              {filtered.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((article, i) => (
                    <ArticleCard key={article.id} article={article} index={i} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-16">
                  Nessun articolo in questa categoria.
                </p>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default BlogView
