"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"

type TocItem = {
  id: string
  label: string
  number: number
}

export default function GuideTOC({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "")
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[]

    if (sections.length === 0) return

    // Use IntersectionObserver to track which section is in view
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the first section that is intersecting (top-most visible)
        const visibleEntries = entries.filter((e) => e.isIntersecting)

        if (visibleEntries.length > 0) {
          // Pick the one closest to the top of the viewport
          const closest = visibleEntries.reduce((prev, curr) =>
            prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr
          )
          setActiveId(closest.target.id)
        }
      },
      {
        rootMargin: "-10% 0px -60% 0px",
        threshold: 0,
      }
    )

    sections.forEach((section) => observerRef.current?.observe(section))

    return () => observerRef.current?.disconnect()
  }, [items])

  return (
    <nav className="flex flex-col gap-0.5 relative">
      {items.map((item) => {
        const isActive = activeId === item.id
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault()
              const el = document.getElementById(item.id)
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" })
                setActiveId(item.id)
              }
            }}
            className={cn(
              "flex items-center gap-2 text-sm py-1.5 px-2 rounded-md transition-all duration-300 ease-out",
              isActive
                ? "text-primary bg-primary/8"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            <span
              className={cn(
                "text-[10px] font-bold w-4 text-center shrink-0 transition-colors duration-300",
                isActive ? "text-primary" : "text-primary/40"
              )}
            >
              {item.number}
            </span>
            <span className="line-clamp-1">{item.label}</span>
            {/* Active dot indicator */}
            <span
              className={cn(
                "ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0 transition-all duration-300 ease-out",
                isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
              )}
            />
          </a>
        )
      })}
    </nav>
  )
}
