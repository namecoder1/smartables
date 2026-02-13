import React from 'react'

import { cn } from "@/lib/utils"

const PageWrapper = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  return (
    <section className={cn('p-6 flex flex-col gap-6 min-h-full bg-background dark:bg-[#1a1813]', className)}>
      {children}
    </section>
  )
}

export default PageWrapper