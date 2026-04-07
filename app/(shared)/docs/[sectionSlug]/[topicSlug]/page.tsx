import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Hash } from 'lucide-react'
import {
  getDocNav,
  getDocTopicBySlug,
  getAdjacentDocTopics,
} from '@/utils/sanity/queries'
import { DocsSidebar } from '../../_components/docs-sidebar'
import { DocsContent } from '../../_components/docs-content'

export const revalidate = 60

type Props = { params: Promise<{ sectionSlug: string; topicSlug: string }> }

export async function generateStaticParams() {
  const sections = await getDocNav()
  return sections.flatMap((section) =>
    section.topics.map((topic) => ({
      sectionSlug: section.slug,
      topicSlug: topic.slug,
    }))
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topicSlug } = await params
  const topic = await getDocTopicBySlug(topicSlug)
  if (!topic) return { title: 'Pagina non trovata | Smartables' }

  const title = `${topic.title} | Docs Smartables`
  const description = topic.excerpt || `Scopri come ${topic.title.toLowerCase()} su Smartables.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
    },
    alternates: {
      canonical: `/docs/${topic.section.slug}/${topic.slug}`,
    },
  }
}

export default async function DocTopicPage({ params }: Props) {
  const { topicSlug } = await params

  const [topic, sections] = await Promise.all([
    getDocTopicBySlug(topicSlug),
    getDocNav(),
  ])

  if (!topic) notFound()

  const { prev, next } = await getAdjacentDocTopics(topicSlug, topic.section._id)

  const hasChapters = topic.hasChapters && topic.chapters.length > 0

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Thin top accent bar */}
      <div className="h-0.5 bg-linear-to-r from-[#FF9710] via-amber-400 to-[#FF9710]/20" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 md:py-12">
        <div className="flex gap-10 xl:gap-14">
          {/* ── LEFT SIDEBAR ── */}
          <DocsSidebar sections={sections} currentTopicSlug={topicSlug} />

          {/* ── MAIN CONTENT ── */}
          <main className="flex-1 min-w-0">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
              <Link href="/docs" className="hover:text-gray-700 transition-colors">
                Docs
              </Link>
              <span>/</span>
              <Link
                href={`/docs/${topic.section.slug}`}
                className="hover:text-gray-700 transition-colors"
              >
                {topic.section.title}
              </Link>
              <span>/</span>
              <span className="text-gray-700 font-medium line-clamp-1">{topic.title}</span>
            </nav>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-3 leading-snug">
              {topic.title}
            </h1>

            {/* Excerpt */}
            {topic.excerpt && (
              <p className="text-base text-gray-500 leading-relaxed mb-8 pb-8 border-b border-gray-100">
                {topic.excerpt}
              </p>
            )}

            {/* Mobile TOC */}
            {hasChapters && (
              <div className="xl:hidden mb-8 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  In questa pagina
                </p>
                <ul className="space-y-1">
                  {topic.chapters.map((ch) => (
                    <li key={ch.anchor}>
                      <a
                        href={`#${ch.anchor}`}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#FF9710] transition-colors py-0.5"
                      >
                        <Hash className="w-3 h-3 text-gray-400 shrink-0" />
                        {ch.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Content */}
            {hasChapters ? (
              <div className="space-y-14">
                {topic.chapters.map((chapter) => (
                  <section key={chapter.anchor} id={chapter.anchor} className="scroll-mt-24">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2 group">
                      {chapter.title}
                      <a
                        href={`#${chapter.anchor}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Link a questa sezione"
                      >
                        <Hash className="w-4 h-4 text-gray-400" />
                      </a>
                    </h2>
                    <DocsContent content={chapter.content} />
                  </section>
                ))}
              </div>
            ) : topic.content && topic.content.length > 0 ? (
              <DocsContent content={topic.content} />
            ) : (
              <p className="text-gray-400 italic">Contenuto non ancora disponibile.</p>
            )}

            {/* Prev / Next navigation */}
            {(prev || next) && (
              <div className="flex items-stretch gap-4 mt-14 pt-8 border-t border-gray-100">
                {prev ? (
                  <Link
                    href={`/docs/${topic.section.slug}/${prev.slug}`}
                    className="group flex-1 flex flex-col gap-1 items-start rounded-xl border border-gray-200 bg-gray-50 p-5 hover:border-[#FF9710]/40 hover:bg-orange-50/20 transition-all"
                  >
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                      Precedente
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
                    href={`/docs/${topic.section.slug}/${next.slug}`}
                    className="group flex-1 flex flex-col gap-1 items-end text-right rounded-xl border border-gray-200 bg-gray-50 p-5 hover:border-[#FF9710]/40 hover:bg-orange-50/20 transition-all"
                  >
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      Successivo
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
            <div className="mt-8 mb-12">
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Torna alla documentazione
              </Link>
            </div>
          </main>

          {/* ── RIGHT TOC (desktop, only with chapters) ── */}
          {hasChapters && (
            <aside className="hidden xl:block w-52 shrink-0">
              <div className="sticky top-24">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  In questa pagina
                </p>
                <ul className="space-y-1">
                  {topic.chapters.map((ch) => (
                    <li key={ch.anchor}>
                      <a
                        href={`#${ch.anchor}`}
                        className="flex items-start gap-2 text-sm text-gray-500 hover:text-[#FF9710] transition-colors py-0.5 leading-snug"
                      >
                        <Hash className="w-3 h-3 mt-0.5 text-gray-300 shrink-0" />
                        {ch.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
