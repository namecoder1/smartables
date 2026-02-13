import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BookOpen, ArrowUpRight, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getFeaturedGuides } from '@/utils/sanity/queries'
import { getGuideIcon } from '@/utils/sanity/icons'

// Resource Item Component
interface ResourceItemProps {
  title: string
  description: string
  iconName?: string
  href: string
  className?: string
  minutes?: number
}

const ResourceItem = ({ title, description, iconName, href, className, minutes }: ResourceItemProps) => {
  const Icon = getGuideIcon(iconName)

  return (
    <Link href={href} className={cn(
      "group flex flex-col justify-between p-5 rounded-xl border border-border/50 bg-input/30 hover:scale-102 transition-all duration-300 hover:shadow-md",
      className
    )}>
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
            <Icon className="h-5 w-5" />
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div>
          <h4 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">{title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{description}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        <span>Leggi guida</span>
        {minutes && <span>{minutes} min</span>}
      </div>
    </Link>
  )
}

export const ResourcesSection = async () => {
  const resources = await getFeaturedGuides(4)

  if (!resources || resources.length === 0) {
    return null
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Impara e cresci</CardTitle>
            <CardDescription>Risorse utili per ottenere il massimo.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {resources.map((resource) => (
          <ResourceItem
            key={resource._id}
            title={resource.title}
            description={resource.excerpt}
            iconName={resource.icon}
            href={`/guides/${resource.slug}`}
            minutes={resource.minutes}
          />
        ))}
      </CardContent>
    </Card>
  )
}
