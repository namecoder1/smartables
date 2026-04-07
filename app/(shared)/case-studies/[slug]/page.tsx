import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { ArrowLeft, Calendar } from 'lucide-react'
import { PortableText, PortableTextComponents } from '@portabletext/react'
import { getCaseStudyBySlug, getCaseStudies, CaseStudy } from '@/utils/sanity/queries'
import { Button } from '@/components/ui/button'

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const caseStudies = await getCaseStudies()
  return caseStudies.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const caseStudy = await getCaseStudyBySlug(slug)
  if (!caseStudy) return { title: 'Case Study non trovato | Smartables' }
  return {
    title: `${caseStudy.title} | Smartables`,
    description: caseStudy.excerpt,
    openGraph: {
      title: caseStudy.title,
      description: caseStudy.excerpt,
      images: caseStudy.image?.url ? [{ url: caseStudy.image.url }] : [],
    },
  }
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

function RelatedCard({ caseStudy }: { caseStudy: CaseStudy }) {
  return (
    <Link
      href={`/case-studies/${caseStudy.slug}`}
      className="group flex gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
    >
      {caseStudy.image?.url && (
        <div className="relative w-16 h-14 rounded-lg overflow-hidden shrink-0">
          <Image src={caseStudy.image.url} alt={caseStudy.title} fill className="object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-[#FF9710] transition-colors leading-snug">
          {caseStudy.title}
        </p>
      </div>
    </Link>
  )
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params

  const [caseStudy, allCaseStudies] = await Promise.all([
    getCaseStudyBySlug(slug),
    getCaseStudies(),
  ])

  if (!caseStudy) notFound()

  const related = allCaseStudies.filter((a) => a.slug !== slug).slice(0, 4)

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* HERO IMAGE */}
      {caseStudy.image?.url && (
        <div className="relative w-full h-72 md:h-96 bg-gray-100">
          <Image
            src={caseStudy.image.url}
            alt={caseStudy.image.alt || caseStudy.title}
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
              <Link href="/case-studies" className="hover:text-white transition-colors">Case Studies</Link>
              <span>/</span>
              <span className="text-white line-clamp-1">{caseStudy.title}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid lg:grid-cols-[1fr_320px] gap-12">
          {/* ── MAIN CONTENT ── */}
          <article>
            {/* No image: breadcrumb here */}
            {!caseStudy.image?.url && (
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
                <span>/</span>
                <Link href="/case-studies" className="hover:text-gray-700 transition-colors">Case Studies</Link>
                <span>/</span>
                <span className="text-gray-600 line-clamp-1">{caseStudy.title}</span>
              </div>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {caseStudy.publishedAt && (
                <span className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(caseStudy.publishedAt), 'd MMMM yyyy', { locale: it })}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-4 leading-tight">
              {caseStudy.title}
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed mb-8 pb-8 border-b border-gray-100">
              {caseStudy.excerpt}
            </p>

            {/* Author */}
            <div className="flex items-center gap-3 mb-10">
              {caseStudy.author === 'Smartables Content Desk' ? (
                <Image src='/logo.png' alt='Author Photo' width={100} height={100} className='size-10 p-2 aspect-square border rounded-xl' />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#FF9710]/10 flex items-center justify-center text-base font-bold text-[#FF9710]">
                  {caseStudy.author?.[0] ?? 'S'}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900 text-sm">{caseStudy.author}</p>
                {caseStudy.authorRole && (
                  <p className="text-xs text-gray-400">{caseStudy.authorRole}</p>
                )}
              </div>
            </div>

            {/* Portable Text */}
            {caseStudy.content && caseStudy.content.length > 0 ? (
              <div className="flex flex-col gap-5">
                <PortableText value={caseStudy.content} components={portableTextComponents} />
              </div>
            ) : (
              <p className="text-gray-400 italic">Contenuto non disponibile.</p>
            )}

            {/* Back link */}
            <div className="mt-8 text-center pt-8 border-t border-gray-100">
              <Link
                href="/case-studies"
                className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Torna ai Case Studies
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
                  {caseStudy.author === 'Smartables Content Desk' ? (
                    <Image src='/logo.png' alt='Author Photo' width={100} height={100} className='size-10 p-2 aspect-square border rounded-xl' />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#FF9710]/10 flex items-center justify-center text-base font-bold text-[#FF9710]">
                      {caseStudy.author?.[0] ?? 'S'}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-900">{caseStudy.author}</p>
                    {caseStudy.authorRole && (
                      <p className="text-xs text-gray-400 mt-0.5">{caseStudy.authorRole}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Related */}
              {related.length > 0 && (
                <div className="rounded-2xl border border-gray-200 p-5 bg-white">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    Altre Storie
                  </p>
                  <div className="flex flex-col gap-1">
                    {related.map((a) => (
                      <RelatedCard key={a.id} caseStudy={a} />
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
  )
}