import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { cn } from '@/lib/utils'

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { CircleQuestionMark } from 'lucide-react'

const EditCard = ({
  title,
  description,
  children,
  className,
  hasGuide,
  guideTitle,
  guideDescription
}: {
  title: string
  description: string
  children: React.ReactNode
  className?: string
  hasGuide?: boolean
  guideTitle?: string
  guideDescription?: string
}) => {

  return (
    <div>
      <Card className={cn('pt-0', className)}>
        <CardHeader className='border-b-2 py-4 space-y-0! gap-0!'>
          <CardTitle className="flex items-center gap-2 text-lg">
            {hasGuide && (
              <HoverCard>
                <HoverCardTrigger><CircleQuestionMark size={20} /></HoverCardTrigger>
                <HoverCardContent side="top" align='start'>
                  <h3 className='font-bold uppercase'>{guideTitle}</h3>
                  <p className='text-muted-foreground'>{guideDescription}</p>
                </HoverCardContent>
              </HoverCard>
            )}
            {title}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {children}
        </CardContent>
      </Card>
      
    </div>
  )
}

export default EditCard