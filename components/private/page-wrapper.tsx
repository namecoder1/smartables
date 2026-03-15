import React from 'react'

import { cn } from "@/lib/utils"

const PageWrapper = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  return (
    <section className={cn('p-6 bg-[#eeeeee] xl:p-8 flex flex-col gap-6 min-h-full', className)}>
      {children}
    </section>
  )
}

export default PageWrapper