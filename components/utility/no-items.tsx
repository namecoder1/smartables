import { cn } from '@/lib/utils'
import React from 'react'

const NoItems = ({
  icon,
  title,
  description,
  button
} : {
  icon: React.ReactNode,
  title: string,
  description: string,
  button?: React.ReactNode
}) => {
  return (
    <div className="flex flex-col items-center rounded-xl justify-center p-12 border-2 border-dashed bg-card min-h-[400px]">
      <div className="bg-primary/10 border-2 border-primary/30 p-4 mb-4 rounded-full">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className={cn('text-muted-foreground text-center max-w-md', button ? 'mb-6' : 'mb-0')}>
        {description}
      </p>
      {button}
    </div>
  )
}

export default NoItems