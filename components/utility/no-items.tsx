import { cn } from '@/lib/utils'
import React from 'react'

const NoItems = ({
  icon,
  title,
  description,
  button,
  variant = 'default'
} : {
  icon: React.ReactNode,
  title: string,
  description: string,
  button?: React.ReactNode,
  variant?: 'default' | 'children'
}) => {

  if (variant === 'children') {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="bg-primary/10 border-2 border-primary/30 p-4 mb-4 rounded-4xl">
          {icon}
        </div>
        <h3 className="text-lg text-center font-semibold mb-1">{title}</h3>
        <p className={cn('text-muted-foreground text-center max-w-xs sm:max-w-md', button ? 'mb-6' : 'mb-0')}>
          {description}
        </p>
        {button}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center rounded-3xl justify-center p-12 border-2 border-dashed bg-card min-h-100">
      <div className="bg-primary/10 border-2 border-primary/30 p-4 mb-4 rounded-4xl">
        {icon}
      </div>
      <h3 className="text-xl text-center font-semibold mb-2">{title}</h3>
      <p className={cn('text-muted-foreground text-center max-w-md', button ? 'mb-6' : 'mb-0')}>
        {description}
      </p>
      {button}
    </div>
  )
}

export default NoItems