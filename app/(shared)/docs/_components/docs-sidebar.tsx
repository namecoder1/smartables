'use client'

import Link from 'next/link'
import { Menu, BookMarked } from 'lucide-react'
import { DocSection } from '@/utils/sanity/queries'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { getDocSectionIcon } from '@/utils/sanity/icons'
import { cn } from '@/lib/utils'

function NavTree({
  sections,
  currentTopicSlug,
  onLinkClick,
}: {
  sections: DocSection[]
  currentTopicSlug: string
  onLinkClick?: () => void
}) {
  return (
    <nav className="space-y-5">
      {sections.map((section) => {
        const Icon = getDocSectionIcon(section.icon)
        return (
          <div key={section.id}>
            <div className="flex items-center gap-2 mb-1.5 px-2">
              <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {section.title}
              </span>
            </div>
            <ul className="space-y-0.5">
              {section.topics.map((topic) => {
                const isActive = topic.slug === currentTopicSlug
                return (
                  <li key={topic.id}>
                    <Link
                      href={`/docs/${section.slug}/${topic.slug}`}
                      onClick={onLinkClick}
                      className={cn(
                        'flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors',
                        isActive
                          ? 'bg-[#FF9710]/10 text-[#FF9710] font-semibold'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      )}
                    >
                      {topic.title}
                    </Link>
                    {isActive && topic.hasChapters && topic.chapters.length > 0 && (
                      <ul className="ml-4 mt-0.5 mb-1 space-y-0.5 border-l-2 border-[#FF9710]/20 pl-3">
                        {topic.chapters.map((chapter) => (
                          <li key={chapter.anchor}>
                            <a
                              href={`#${chapter.anchor}`}
                              onClick={onLinkClick}
                              className="block text-xs text-gray-500 py-1 leading-snug hover:text-[#FF9710] transition-colors"
                            >
                              {chapter.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}

interface DocsSidebarProps {
  sections: DocSection[]
  currentTopicSlug: string
}

export function DocsSidebar({ sections, currentTopicSlug }: DocsSidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-56 xl:w-64 shrink-0">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-10 scrollbar-thin">
          <Link
            href="/docs"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 mb-6 px-2 transition-colors"
          >
            <BookMarked className="w-3.5 h-3.5" />
            Tutti i docs
          </Link>
          <NavTree sections={sections} currentTopicSlug={currentTopicSlug} />
        </div>
      </aside>

      {/* Mobile: floating menu */}
      <div className="lg:hidden fixed bottom-6 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-full text-sm font-semibold shadow-xl">
              <Menu className="w-4 h-4" />
              Navigazione
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>
                <Link href="/docs" className="flex items-center gap-2 text-gray-800">
                  <BookMarked className="w-4 h-4 text-[#FF9710]" />
                  Documentazione
                </Link>
              </SheetTitle>
            </SheetHeader>
            <NavTree sections={sections} currentTopicSlug={currentTopicSlug} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
