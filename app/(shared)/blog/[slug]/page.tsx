import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { ArrowLeft, ArrowRight, Clock, Calendar } from 'lucide-react'
import { PortableText, PortableTextComponents } from '@portabletext/react'
import { getArticleBySlug, getAdjacentArticles, getArticles, SanityArticleCard } from '@/utils/sanity/queries'
import { Button } from '@/components/ui/button'

export const revalidate = 60

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://smartables.it"

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const articles = await getArticles()
  return articles.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) return { title: 'Articolo non trovato' }
  return {
    title: article.seo?.metaTitle || article.title,
    description: article.seo?.metaDescription || article.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: article.seo?.metaTitle || article.title,
      description: article.seo?.metaDescription || article.excerpt,
      type: 'article',
      publishedTime: article.publishedAt,
      authors: article.author ? [article.author] : undefined,
      images: article.image?.url ? [{ url: article.image.url, alt: article.image.alt || article.title }] : [],
    },
  }
}

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

const portableTextComponents: PortableTextComponents = {
  block: {
    h1: ({ children }) => (
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 mt-10 mb-4">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 mt-10 pb-3 border-b border-gray-100">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-2">{children}</h3>
    ),
    normal: ({ children }) => (
      <p className="text-gray-600 leading-relaxed text-[1.05rem]">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-[#FF9710] pl-5 py-2 italic text-gray-500 bg-orange-50/60 rounded-r-xl my-6">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc pl-6 space-y-2 text-gray-600 text-[1.05rem]">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal pl-6 space-y-2 text-gray-600 text-[1.05rem]">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="leading-relaxed">{children}</li>,
    number: ({ children }) => <li className="leading-relaxed">{children}</li>,
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-900">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#FF9710] underline underline-offset-2 hover:text-[#e4870e] transition-colors"
      >
        {children}
      </a>
    ),
  },
  types: {
    image: ({ value }) =>
      value?.url ? (
        <div className="rounded-2xl overflow-hidden border border-gray-100 my-6 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.url} alt={value.alt || ''} className="w-full h-auto" />
        </div>
      ) : null,
    callout: ({ value }) => {
      const styles: Record<string, { bg: string; border: string; icon: string }> = {
        consiglio: { bg: 'bg-blue-50', border: 'border-blue-200', icon: '💡' },
        esempio: { bg: 'bg-gray-50', border: 'border-gray-200', icon: '📌' },
        nota: { bg: 'bg-amber-50', border: 'border-amber-200', icon: '⚠️' },
        attenzione: { bg: 'bg-red-50', border: 'border-red-200', icon: '🚨' },
      }
      const s = styles[value.type] || styles.nota
      return (
        <div className={`${s.bg} ${s.border} border rounded-xl p-4 my-6 flex gap-3`}>
          <span className="text-xl shrink-0 mt-0.5">{s.icon}</span>
          <p className="text-sm text-gray-700 leading-relaxed">{value.text}</p>
        </div>
      )
    },
  },
}

function RelatedCard({ article }: { article: SanityArticleCard }) {
  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group flex gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
    >
      {article.image?.url && (
        <div className="relative w-16 h-14 rounded-lg overflow-hidden shrink-0">
          <Image src={article.image.url} alt={article.title} fill className="object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#FF9710] mb-0.5">
          {categoryLabels[article.category] || article.category}
        </p>
        <p className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-[#FF9710] transition-colors leading-snug">
          {article.title}
        </p>
      </div>
    </Link>
  )
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params

  const [article, { prev, next }, allArticles] = await Promise.all([
    getArticleBySlug(slug),
    getAdjacentArticles(slug),
    getArticles(),
  ])

  if (!article) notFound()

  const related = allArticles.filter((a) => a.slug !== slug && a.category === article.category).slice(0, 3)

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    author: { "@type": "Person", name: article.author },
    publisher: {
      "@type": "Organization",
      name: "Smartables",
      "@id": `${BASE_URL}/#organization`,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE_URL}/blog/${slug}` },
    ...(article.image?.url && {
      image: { "@type": "ImageObject", url: article.image.url },
    }),
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: article.title, item: `${BASE_URL}/blog/${slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    <div className="min-h-screen bg-white font-sans">
      {/* HERO IMAGE */}
      {article.image?.url && (
        <div className="relative w-full h-72 md:h-96 bg-gray-100">
          <Image
            src={article.image.url}
            alt={article.image.alt || article.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
          {/* Breadcrumb overlay */}
          <div className="absolute bottom-6 left-6 right-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 text-sm text-white/70 mb-3">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
              <span>/</span>
              <span className="text-white line-clamp-1">{article.title}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid lg:grid-cols-[1fr_320px] gap-12">
          {/* ── MAIN CONTENT ── */}
          <article>
            {/* No image: breadcrumb here */}
            {!article.image?.url && (
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
                <span>/</span>
                <Link href="/blog" className="hover:text-gray-700 transition-colors">Blog</Link>
                <span>/</span>
                <span className="text-gray-600 line-clamp-1">{article.title}</span>
              </div>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {article.category && (
                <span
                  className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${categoryColors[article.category] || 'bg-gray-50 text-gray-600 border-gray-100'}`}
                >
                  {categoryLabels[article.category] || article.category}
                </span>
              )}
              {article.readingTime && (
                <span className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  {article.readingTime} min di lettura
                </span>
              )}
              {article.publishedAt && (
                <span className="flex items-center gap-1.5 text-sm text-gray-400 ml-auto">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(article.publishedAt), 'd MMMM yyyy', { locale: it })}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-4 leading-tight">
              {article.title}
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed mb-8 pb-8 border-b border-gray-100">
              {article.excerpt}
            </p>

            {/* Author */}
            <div className="flex items-center gap-3 mb-10">
              {article.author === 'Tobia Bartolomei' ? (
                <Image src='/tobia-bartolomei.png' alt='Author Photo' width={100} height={100} className='w-10 h-10 border rounded-xl' />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#FF9710]/10 flex items-center justify-center text-base font-bold text-[#FF9710]">
                  {article.author?.[0] ?? 'S'}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900 text-sm">{article.author}</p>
                {article.authorRole && (
                  <p className="text-xs text-gray-400">{article.authorRole}</p>
                )}
              </div>
            </div>

            {/* Portable Text */}
            {article.content && article.content.length > 0 ? (
              <div className="flex flex-col gap-5">
                <PortableText value={article.content} components={portableTextComponents} />
              </div>
            ) : (
              <p className="text-gray-400 italic">Contenuto non disponibile.</p>
            )}

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-gray-100">
                {article.tags.map((tag) => (
                  <span key={tag} className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Prev / Next */}
            {(prev || next) && (
              <div className="flex items-stretch gap-4 mt-8 pt-8 border-t border-gray-100">
                {prev ? (
                  <Link
                    href={`/blog/${prev.slug}`}
                    className="group flex-1 flex flex-col gap-1 items-start rounded-xl border border-gray-200 bg-gray-50 p-5 hover:border-[#FF9710]/40 hover:bg-orange-50/30 transition-all"
                  >
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                      Articolo precedente
                    </span>
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-[#FF9710] transition-colors line-clamp-2 mt-1">
                      {prev.title}
                    </span>
                  </Link>
                ) : (
                  <div className="flex-1" />
                )}

                {next ? (
                  <Link
                    href={`/blog/${next.slug}`}
                    className="group flex-1 flex flex-col gap-1 items-end text-right rounded-xl border border-gray-200 bg-gray-50 p-5 hover:border-[#FF9710]/40 hover:bg-orange-50/30 transition-all"
                  >
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      Articolo successivo
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-[#FF9710] transition-colors line-clamp-2 mt-1">
                      {next.title}
                    </span>
                  </Link>
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            )}

            {/* Back link */}
            <div className="mt-8 text-center">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Torna al blog
              </Link>
            </div>
          </article>

          {/* ── SIDEBAR ── */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Author card */}
              <div className="rounded-2xl border border-gray-200 p-5 bg-white">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Autore</p>
                <div className="flex items-center gap-3">
                  {article.author === 'Tobia Bartolomei' ? (
                    <Image src='/tobia-bartolomei.png' alt='Author Photo' width={100} height={100} className='w-10 h-10 border rounded-xl' />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#FF9710]/10 flex items-center justify-center text-base font-bold text-[#FF9710]">
                      {article.author?.[0] ?? 'S'}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-900">{article.author}</p>
                    {article.authorRole && (
                      <p className="text-xs text-gray-400 mt-0.5">{article.authorRole}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Related articles */}
              {related.length > 0 && (
                <div className="rounded-2xl border border-gray-200 p-5 bg-white">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    Articoli correlati
                  </p>
                  <div className="flex flex-col gap-1">
                    {related.map((a) => (
                      <RelatedCard key={a.id} article={a} />
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="rounded-4xl bg-neutral-800 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF9710]/20 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 relative z-10">
                  Prova Smartables
                </p>
                <p className="text-white font-bold text-lg leading-snug mb-4 relative z-10">
                  Gestisci il tuo ristorante con intelligenza.
                </p>
                <Button
                  asChild
                  className="w-full bg-[#FF9710] hover:bg-[#e4870e] text-white font-bold rounded-xl relative z-10"
                >
                  <Link href="/register">Inizia gratis</Link>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
    </>
  )
}
