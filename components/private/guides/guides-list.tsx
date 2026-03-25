"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Clock, ArrowRight, BookOpen, Sparkles, Tag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getGuideIcon } from "@/utils/sanity/icons"
import { GuidesByCategory } from "@/utils/sanity/queries"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"

interface GuidesListProps {
  categories: GuidesByCategory[]
}

export default function GuidesList({ categories }: GuidesListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [focused, setFocused] = useState(false)

  const filteredCategories = categories.map(category => ({
    ...category,
    guides: category.guides.filter(guide =>
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.tags?.some(tag => tag.title.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(category => category.guides.length > 0)

  return (
    <div className="flex flex-col gap-12 w-full">
      {/* Hero / Search Section */}

      <div className='relative overflow-hidden rounded-xl xl:border-2 xl:py-20'>
        <div className="absolute inset-0 hidden xl:block">
          {/* Note: In a real app we'd use Next.js Image optimization, but for now standard img tag with object-cover works great */}
          <img src="/guides.jpg" alt="Restaurant Background" className="w-full h-full object-cover opacity-20 dark:opacity-10" />
          <div className="absolute inset-0 bg-linear-to-t from-background/90 to-transparent" />
        </div>

        <div className="relative z-10 border-b pb-4 xl:border-none xl:pb-10 xl:p-10">
          <h1 className="text-3xl xl:text-5xl font-bold tracking-tight text-foreground text-left  xl:text-center">
            Guide pratiche
          </h1>
          <p className="text-muted-foreground xl:mt-2 max-w-2xl text-lg xl:mx-auto text-left xl:text-center">
            Scopri come sfruttare al massimo tutte le funzionalità di Smartables con le nostre guide passo-passo.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={cn(
              "relative w-full xl:max-w-xl mx-auto mt-6 transition-all duration-300 transform px-1",
              focused ? "xl:scale-105" : "xl:scale-100"
            )}
          >
            <div className={cn(
              "absolute inset-0 rounded-2xl xl:bg-primary/20 blur-xl transition-opacity duration-300",
              focused ? "opacity-100" : "opacity-0"
            )} />
            <div className="relative group">
              <Search className={cn(
                "absolute left-4 top-1/2 z-50 -translate-y-1/2 w-5 h-5 transition-colors duration-300",
                focused ? "text-primary" : "text-black"
              )} />
              <Input
                placeholder="Cerca una guida, un argomento..."
                className="pl-12 h-14 rounded-2xl bg-background/80 backdrop-blur-xl border-border/50 shadow-lg text-lg focus-visible:ring-primary/20 focus-visible:border-primary/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {filteredCategories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-4"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-lg">Nessuna guida trovata per "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-primary hover:underline font-medium"
            >
              Mostra tutte le guide
            </button>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-16 pb-20">
            {filteredCategories.map((section, sectionIndex) => (
              <GuideCard key={section._id} section={section} sectionIndex={sectionIndex} />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

const GuideCard = ({
  section,
  sectionIndex,
}: {
  section: any
  sectionIndex: number
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: sectionIndex * 0.1 }}
      className="flex flex-col gap-8"
    >
      <div className="flex flex-col gap-2 border-b border-border/40 pb-4">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          {section.title}
          <span className="text-sm font-normal text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
            {section.guides.length}
          </span>
        </h2>
        {section.description && (
          <p className="text-muted-foreground max-w-3xl">{section.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {section.guides.map((guide: any, index: number) => {
          const Icon = getGuideIcon(guide.icon)
          return (
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (sectionIndex * 0.1) + (index * 0.05) }}
              whileHover={{ y: -5 }}
              className=""
            >
              <Link href={`/guides/${guide.slug}`} className="block h-full">
                <Card className="h-full py-0 gap-2 flex flex-col border-border/50 bg-card/50 hover:bg-card/80 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden group">
                  <CardHeader className="p-6 pb-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-xl bg-linear-to-br from-primary/10 to-primary/5 text-primary group-hover:scale-110 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300 ">
                        <Icon className="w-6 h-6" />
                      </div>
                      {guide.minutes && (
                        <Badge variant="secondary" className="font-medium text-xs gap-1.5 bg-background/50 backdrop-blur border border-border/50 shadow-sm">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          {guide.minutes} min
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {guide.title}
                    </h3>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 grow space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {guide.excerpt}
                    </p>
                    {guide.tags && guide.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {guide.tags.slice(0, 2).map((tag: any) => (
                          <span key={tag._id} className="inline-flex items-center text-[10px] bg-muted/50 px-2 py-1 rounded-md text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary/80 transition-colors">
                            <Tag className="w-3 h-3 mr-1 opacity-70" />
                            {tag.title}
                          </span>
                        ))}
                        {guide.tags.length > 2 && (
                          <span className="text-[10px] px-1 py-1 text-muted-foreground">+{guide.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="px-6 [.border-t]:pt-4 pb-4 border-t border-border/30 bg-muted/20 group-hover:bg-primary/5 transition-colors duration-300">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                        Leggi la guida
                      </span>
                      <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-sm text-primary">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </motion.section>
  )
}