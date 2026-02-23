import PageWrapper from "@/components/private/page-wrapper"
import { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Info, Lightbulb, AlertTriangle, BookmarkCheck, Clock } from "lucide-react"
import { PortableText, PortableTextComponents } from "@portabletext/react"
import { getGuideBySlug, getAdjacentGuides, getSuggestedGuides } from "@/utils/sanity/queries"
import { getGuideIcon } from "@/utils/sanity/icons"
import { notFound } from "next/navigation"
import GuideTOC from "@/components/private/guide-toc"
import SetPageTitle from "@/components/private/set-page-title"

export const revalidate = 60

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const guide = await getGuideBySlug(slug)
  if (!guide) return { title: "Guida non trovata" }

  return {
    title: guide.title,
    description: guide.excerpt,
  }
}

// Callout icon map — now with colored left borders
const calloutConfig: Record<string, { icon: typeof Info; label: string; bgClass: string; borderClass: string; accentBorder: string }> = {
  consiglio: { icon: Lightbulb, label: "Consiglio", bgClass: "bg-accent/50", borderClass: "border-border", accentBorder: "border-l-amber-500" },
  esempio: { icon: BookmarkCheck, label: "Esempio", bgClass: "bg-accent/50", borderClass: "border-border", accentBorder: "border-l-emerald-500" },
  nota: { icon: Info, label: "Nota", bgClass: "bg-primary/5", borderClass: "border-primary/15", accentBorder: "border-l-primary" },
  attenzione: { icon: AlertTriangle, label: "Attenzione", bgClass: "bg-destructive/5", borderClass: "border-destructive/15", accentBorder: "border-l-destructive" },
}

// Portable Text components for rendering blockContent
const portableTextComponents: PortableTextComponents = {
  block: {
    h1: ({ children }) => (
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{children}</h1>
    ),
    h2: ({ children, value }) => {
      return (
        <div className="flex items-center gap-3" data-h2-block={value._key}>
          <h2 className="text-lg font-semibold tracking-tight m-0">{children}</h2>
        </div>
      )
    },
    h3: ({ children }) => (
      <h3 className="text-base font-semibold tracking-tight">{children}</h3>
    ),
    normal: ({ children }) => (
      <p className="text-base">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-primary/30 pl-4 italic text-muted-foreground">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="flex flex-col gap-1.5 list-disc pl-5 marker:text-primary/50">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="flex flex-col gap-1.5 list-decimal pl-5 marker:text-primary/50">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
  marks: {
    strong: ({ children }) => (
      <strong className="text-foreground">{children}</strong>
    ),
    em: ({ children }) => <em>{children}</em>,
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
      >
        {children}
      </a>
    ),
  },
  types: {
    image: ({ value }) => (
      <div className="rounded-lg overflow-hidden border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value?.asset?.url}
          alt={value?.alt || ""}
          className="w-full h-auto"
        />
      </div>
    ),
    callout: ({ value }) => {
      const config = calloutConfig[value.type] ?? calloutConfig.nota
      const Icon = config.icon
      return (
        <div className={`flex items-start gap-3 rounded-lg border-l-3 ${config.accentBorder} ${config.bgClass} border ${config.borderClass} p-4 mt-1`}>
          <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="m-0 text-xs">
            <strong className="text-foreground">{config.label}:</strong>{" "}
            {value.text}
          </p>
        </div>
      )
    },
  },
}

// Helper: wrap content between H2s into numbered sections
function groupContentBySections(content: any[]) {
  if (!content || content.length === 0) return { intro: [], sections: [] }

  const intro: any[] = []
  const sections: { heading: any; content: any[] }[] = []

  let currentSection: { heading: any; content: any[] } | null = null

  for (const block of content) {
    const isH2 = block._type === "block" && block.style === "h2"

    if (isH2) {
      if (currentSection) sections.push(currentSection)
      currentSection = { heading: block, content: [] }
    } else if (currentSection) {
      currentSection.content.push(block)
    } else {
      intro.push(block)
    }
  }

  if (currentSection) sections.push(currentSection)

  return { intro, sections }
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params
  const guide = await getGuideBySlug(slug)

  if (!guide) notFound()

  const Icon = getGuideIcon(guide.icon)
  const [{ prev, next }, suggestedGuides] = await Promise.all([
    getAdjacentGuides(slug, guide.category._id),
    getSuggestedGuides(slug),
  ])
  const { intro, sections } = groupContentBySections(guide.content)

  // Build TOC from sections
  const toc = sections.map((section, index) => ({
    id: `sezione-${index + 1}`,
    label: section.heading.children?.map((c: any) => c.text).join("") || "",
    number: index + 1,
  }))

  return (
    <PageWrapper className="p-0! gap-0">
      <SetPageTitle title={guide.title} description={guide.excerpt || ""} />
      <div className="px-6 pt-5 pb-6 flex flex-col gap-4 border-b border-border">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/guides" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Guide pratiche
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{guide.title}</span>
        </nav>
      </div>

      {/* Main content + Sidebar */}
      <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
        {/* Article */}
        <div className="flex-1 min-w-0 max-w-4xl flex flex-col gap-4 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-foreground tracking-tighter">{guide.title}</h1>
              <div className="flex items-center gap-2">
                {guide.category && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    {guide.category.title}
                  </span>
                )}

                {guide.minutes && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground bg-accent px-2.5 py-1 rounded-full">
                    <Clock className="w-3 h-3" />
                    {guide.minutes} min
                  </span>
                )}
              </div>
            </div>
          </div>

          <article className="prose-custom flex flex-col gap-10">
            {/* Intro paragraphs (before first H2) */}
            {intro.length > 0 && (
              <div className="flex flex-col gap-3 text-sm text-foreground leading-relaxed">
                <PortableText value={intro} components={portableTextComponents} />
              </div>
            )}

            {/* Numbered sections with anchors */}
            {sections.map((section, index) => {
              const headingText = section.heading.children?.map((c: any) => c.text).join("") || ""

              return (
                <section
                  key={section.heading._key}
                  id={`sezione-${index + 1}`}
                  className="flex flex-col gap-3 scroll-mt-6"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0">
                      {index + 1}
                    </span>
                    <h2 className="text-lg font-semibold tracking-tight m-0">{headingText}</h2>
                  </div>
                  <div className="pl-10 flex flex-col gap-3 text-muted-foreground leading-relaxed">
                    <PortableText value={section.content} components={portableTextComponents} />
                  </div>
                </section>
              )
            })}
          </article>

          {(prev || next) && (
            <div className="flex items-stretch gap-4 pt-6 border-t border-border">
              {prev ? (
                <Link
                  href={`/guides/${prev.slug}`}
                  className="group flex-1 flex flex-col gap-1 items-start text-left rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/25 hover:bg-accent/50"
                >
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                    Guida precedente
                  </span>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">
                    {prev.title}
                  </span>
                </Link>
              ) : (
                <div className="flex-1" />
              )}

              {next ? (
                <Link
                  href={`/guides/${next.slug}`}
                  className="group flex-1 flex flex-col gap-1 items-end text-right rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/25 hover:bg-accent/50"
                >
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    Prossima guida
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">
                    {next.title}
                  </span>
                </Link>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          )}
        </div>

        {/* Sidebar — sticky with TOC + suggested guides */}
        <aside className="hidden lg:flex flex-col gap-6 shrink-0 border-l pt-6 pl-6">
          <div className="sticky top-6 flex flex-col gap-6">
            {/* Table of Contents */}
            {toc.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold text-foreground tracking-tight">Indice</h3>
                <GuideTOC items={toc} />
              </div>
            )}

            {/* Suggested guides */}
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-foreground tracking-tight">Altre guide</h3>
              {suggestedGuides.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nessuna guida suggerita.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {suggestedGuides.slice(0, 4).map((sg) => {
                    const SgIcon = getGuideIcon(sg.icon)
                    return (
                      <Link
                        key={sg._id}
                        href={`/guides/${sg.slug}`}
                        className="group flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 transition-all duration-200 hover:border-primary/25 hover:bg-accent/50"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0 mt-0.5 transition-colors group-hover:bg-primary/15">
                          <SgIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium group-hover:text-primary transition-colors leading-tight line-clamp-2">
                            {sg.title}
                          </h4>
                          {sg.category && (
                            <span className="text-sm text-muted-foreground mt-1 block">
                              {sg.category.title}
                            </span>
                          )}
                          {sg.minutes && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <Clock className="w-2.5 h-2.5" />
                              {sg.minutes} min
                            </span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </PageWrapper>
  )
}