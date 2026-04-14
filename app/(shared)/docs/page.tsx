import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookMarked, MessageCircle } from 'lucide-react'
import { getDocNav } from '@/utils/sanity/queries'
import { getDocSectionIcon } from '@/utils/sanity/icons'
import { Button } from '@/components/ui/button'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Documentazione | Smartables',
  description: 'Guide, tutorial e riferimenti per usare al meglio Smartables nel tuo ristorante. Trova risposte veloci su prenotazioni, menù, WhatsApp, analytics e altro.',
  alternates: { canonical: '/docs' },
  openGraph: {
    title: 'Documentazione Smartables',
    description: 'Guide, tutorial e riferimenti per usare al meglio Smartables nel tuo ristorante.',
    type: 'website',
    images: [
      {
        url: "/og-image.png",
        width: 1280,
        height: 800,
        alt: "Smartables - Documentazione",
      },
    ],
  },
}

export default async function DocsPage() {
  const sections = await getDocNav()

  const totalTopics = sections.reduce((sum, s) => sum + s.topics.length, 0)

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* HERO */}
      <section className="bg-gray-950 py-20 md:py-28 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-75 bg-[#FF9710]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/8 text-white/70 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-white/10">
            <BookMarked className="w-4 h-4 text-[#FF9710]" />
            {totalTopics} articoli disponibili
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-5 tracking-tight text-white">
            Come possiamo aiutarti?
          </h1>
          <p className="text-lg text-white/60 max-w-xl mx-auto">
            Trova guide passo-passo, tutorial e riferimenti per usare Smartables al massimo nel tuo ristorante.
          </p>
        </div>
      </section>

      {/* SECTIONS */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="mx-auto max-w-6xl px-6">
          {sections.length === 0 ? (
            <p className="text-center text-gray-400 py-16">
              Nessuna documentazione disponibile al momento.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sections.map((section) => {
                const Icon = getDocSectionIcon(section.icon)
                const firstTopic = section.topics[0]
                return (
                  <Link
                    key={section.id}
                    href={
                      firstTopic
                        ? `/docs/${section.slug}/${firstTopic.slug}`
                        : `/docs/${section.slug}`
                    }
                    className="group flex flex-col bg-white rounded-2xl border border-gray-200 p-6 hover:border-[#FF9710]/40 hover:shadow-md transition-all duration-200"
                  >
                    {/* Icon */}
                    <div style={{ backgroundColor: section.bgColor}} className="w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5" color={section.iconColor} />
                    </div>

                    {/* Title + description */}
                    <h2 className="text-base font-bold text-gray-900 mb-1 group-hover:text-[#FF9710] transition-colors">
                      {section.title}
                    </h2>
                    {section.description && (
                      <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">
                        {section.description}
                      </p>
                    )}

                    {/* Topic quick links */}
                    {section.topics.length > 0 && (
                      <ul className="mt-auto space-y-1 pt-4 border-t border-gray-100">
                        {section.topics.slice(0, 4).map((topic) => (
                          <li
                            key={topic.id}
                            className="flex items-center gap-1.5 text-sm text-gray-500 group-hover:text-gray-700 transition-colors"
                          >
                            <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                            <span className="line-clamp-1">{topic.title}</span>
                          </li>
                        ))}
                        {section.topics.length > 4 && (
                          <li className="text-xs text-[#FF9710] font-medium pl-2.5">
                            +{section.topics.length - 4} altri articoli
                          </li>
                        )}
                      </ul>
                    )}

                    <div className="flex items-center gap-1 mt-4 text-xs font-semibold text-[#FF9710] opacity-0 group-hover:opacity-100 transition-opacity">
                      Esplora <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* SUPPORT CTA */}
      <section className="py-14 bg-white border-t border-gray-100">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#FF9710]/10 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-6 h-6 text-[#FF9710]" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Non hai trovato quello che cercavi?
          </h2>
          <p className="text-gray-500 mb-6">
            Il nostro team di supporto è sempre disponibile ad aiutarti.
          </p>
          <Button asChild className="bg-[#FF9710] hover:bg-[#e4870e] text-white font-semibold rounded-xl">
            <Link href="/support">Contatta il supporto</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
