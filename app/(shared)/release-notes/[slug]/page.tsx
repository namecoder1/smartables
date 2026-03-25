import React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { ArrowLeft, ArrowRight, Package, Sparkles, Zap, Bug, Calendar } from 'lucide-react'
import { PortableText, PortableTextComponents } from '@portabletext/react'
import { Metadata } from 'next'
import { getVersionBySlug, getAdjacentVersions } from '@/utils/sanity/queries'

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const version = await getVersionBySlug(slug)
  if (!version) return { title: 'Note di rilascio non trovate' }
  return {
    title: `v${version.version} — ${version.title} | Smartables`,
    description: version.excerpt,
  }
}

function getVersionType(version: string): { label: string; bg: string; text: string; border: string; icon: typeof Sparkles } {
  const parts = version?.replace(/^v/, '').split('.').map(Number)
  if (!parts || parts.length < 3) return { label: 'Aggiornamento', bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', icon: Package }
  const [major, minor, patch] = parts
  if (patch > 0 && minor === 0 && major === 0) return { label: 'Bug Fix', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: Bug }
  if (minor > 0 || patch > 0) return { label: 'Nuove funzionalità', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: Zap }
  return { label: 'Major Release', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', icon: Sparkles }
}

const portableTextComponents: PortableTextComponents = {
  block: {
    h1: ({ children }) => <h1 className="text-3xl font-bold tracking-tight text-gray-900 mt-8 mb-4">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-semibold tracking-tight text-gray-900 mt-8 mb-3 pb-2 border-b border-gray-100">{children}</h2>,
    h3: ({ children }) => <h3 className="text-base font-semibold text-gray-900 mt-6 mb-2">{children}</h3>,
    normal: ({ children }) => <p className="text-gray-600 leading-relaxed">{children}</p>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-[#ff9f29] pl-4 py-1 italic text-gray-500 bg-orange-50/50 rounded-r-lg">{children}</blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc pl-5 space-y-1.5 text-gray-600">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal pl-5 space-y-1.5 text-gray-600">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li className="leading-relaxed">{children}</li>,
    number: ({ children }) => <li className="leading-relaxed">{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ children, value }) => (
      <a href={value?.href} target="_blank" rel="noopener noreferrer"
        className="text-[#ff9f29] underline underline-offset-2 hover:text-[#e4870e] transition-colors">
        {children}
      </a>
    ),
    code: ({ children }) => (
      <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
    ),
  },
  types: {
    image: ({ value }) => value?.asset?.url ? (
      <div className="rounded-xl overflow-hidden border border-gray-200 my-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value.asset.url} alt={value.alt || ''} className="w-full h-auto" />
      </div>
    ) : null,
  },
}

export default async function ReleasePage({ params }: Props) {
  const { slug } = await params
  const [version, { prev, next }] = await Promise.all([
    getVersionBySlug(slug),
    getAdjacentVersions(slug),
  ])

  if (!version) notFound()

  const { label, bg, text, border, icon: TypeIcon } = getVersionType(version.version)

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ARTICLE */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Meta */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <span className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-md border border-gray-200">
            v{version.version}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-gray-400">
            <Calendar className="w-3.5 h-3.5" />
            <span className="capitalize">{format(new Date(version.createdAt), 'dd MMMM yyyy', { locale: it })}</span>
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-4">
          {version.title}
        </h1>

        {version.excerpt && (
          <p className="text-lg text-gray-500 leading-relaxed mb-10 pb-10 border-b border-gray-100">
            {version.excerpt}
          </p>
        )}

        {/* Content */}
        {version.content && version.content.length > 0 ? (
          <div className="flex flex-col gap-4">
            <PortableText value={version.content} components={portableTextComponents} />
          </div>
        ) : (
          <p className="text-gray-400 italic">Nessun contenuto disponibile per questa versione.</p>
        )}

        {/* Navigation */}
        {(prev || next) && (
          <div className="flex items-stretch gap-4 mt-16 pt-8 border-t border-gray-100">
            {prev ? (
              <Link
                href={`/release-notes/${prev.slug}`}
                className="group flex-1 flex flex-col gap-1 items-start rounded-xl border border-gray-200 bg-gray-50 p-5 hover:border-[#ff9f29]/40 hover:bg-orange-50/30 transition-all duration-200"
              >
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                  Versione precedente
                </span>
                <span className="font-mono text-xs font-bold text-gray-500">v{prev.version}</span>
                <span className="text-sm font-medium text-gray-900 group-hover:text-[#ff9f29] transition-colors line-clamp-1">
                  {prev.title}
                </span>
              </Link>
            ) : <div className="flex-1" />}

            {next ? (
              <Link
                href={`/release-notes/${next.slug}`}
                className="group flex-1 flex flex-col gap-1 items-end text-right rounded-xl border border-gray-200 bg-gray-50 p-5 hover:border-[#ff9f29]/40 hover:bg-orange-50/30 transition-all duration-200"
              >
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                  Versione successiva
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="text-sm font-medium text-gray-900 group-hover:text-[#ff9f29] transition-colors line-clamp-1">
                  v{next.version} - {next.title}
                </span>
              </Link>
            ) : <div className="flex-1" />}
          </div>
        )}

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link href="/release-notes" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Torna a tutte le versioni
          </Link>
        </div>
      </div>
    </div>
  )
}
