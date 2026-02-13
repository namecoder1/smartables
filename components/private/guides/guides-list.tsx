"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Clock, ArrowRight, BookOpen } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getGuideIcon } from "@/utils/sanity/icons"
import { GuidesByCategory } from "@/utils/sanity/queries"
import { motion } from "motion/react"

interface GuidesListProps {
  categories: GuidesByCategory[]
}

export default function GuidesList({ categories }: GuidesListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCategories = categories.map(category => ({
    ...category,
    guides: category.guides.filter(guide =>
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.guides.length > 0)

  return (
    <div className="flex flex-col gap-8">
      {/* Hero / Search Section */}
      <div className="flex flex-col gap-6">
        <div className="xl:hidden flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Guide pratiche</h1>
              <p className="text-muted-foreground">
                Impara a usare Smartables al meglio
              </p>
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 z-50 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca una guida..."
            className="pl-9 bg-background/50 backdrop-blur-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredCategories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nessuna guida trovata per "{searchQuery}"
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {filteredCategories.map((section) => (
            <section key={section._id} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold tracking-tight">{section.title}</h2>
                {section.description && (
                  <p className="text-sm text-muted-foreground max-w-2xl">{section.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {section.guides.map((guide, index) => {
                  const Icon = getGuideIcon(guide.icon)
                  return (
                    <motion.div
                      key={guide._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link href={`/guides/${guide.slug}`} className="block h-full">
                        <Card className="h-full py-0 hover:border-primary/50 transition-all duration-300 hover:shadow-md group flex flex-col overflow-hidden border-border/60 bg-card/50">
                          <CardHeader className="p-5 pb-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                                <Icon className="w-5 h-5" />
                              </div>
                              {guide.minutes && (
                                <Badge variant="secondary" className="font-normal text-xs gap-1 bg-muted/50">
                                  <Clock className="w-3 h-3" />
                                  {guide.minutes} min
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-base text-foreground/90 group-hover:text-primary transition-colors leading-snug">
                              {guide.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-5 pt-0 grow">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {guide.excerpt}
                            </p>
                          </CardContent>
                          <CardFooter className="p-5 pt-0 mt-auto">
                            <div className="flex items-center text-xs font-medium text-foreground group-hover:text-primary transition-all duration-300">
                              Leggi guida <ArrowRight className="w-3 h-3 ml-1" />
                            </div>
                          </CardFooter>
                        </Card>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
