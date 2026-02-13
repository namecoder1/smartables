import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getFeaturedGuides } from '@/utils/sanity/queries'
import { getGuideIcon } from '@/utils/sanity/icons'

export const ResourcesSection = async () => {
  const resources = await getFeaturedGuides(3)

  if (!resources || resources.length === 0) {
    return null
  }

  return (
    <Card className="border-2 shadow-sm h-full py-0 gap-0">
      <CardHeader className="border-b-2 bg-muted/20 py-6 flex items-center gap-3">
        <BookOpen className="w-5 h-5 text-muted-foreground" />
        <CardTitle className="text-lg font-semibold">
          Guide Consigliate
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y-2">
          {resources.map((resource) => (
            <ResourceItem
              key={resource._id}
              title={resource.title}
              description={resource.excerpt}
              iconName={resource.icon}
              href={`/guides/${resource.slug}`}
            />
          ))}
        </div>
        <div className="p-3 bg-muted/10 border-t-2">
          <Link href="/guides" className="flex items-center justify-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-2">
            Vedi tutte le guide <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

const ResourceItem = ({ title, description, iconName, href }: { title: string, description: string, iconName?: string, href: string }) => {
  const Icon = getGuideIcon(iconName)
  return (
    <Link href={href} className="flex gap-4 p-4 hover:bg-muted/30 transition-colors group items-start">
      <div className="mt-1 p-1.5 rounded-md bg-muted/40 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h4 className="text-sm font-medium leading-tight group-hover:text-primary transition-colors">{title}</h4>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
      </div>
    </Link>
  )
}
