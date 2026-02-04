import React from 'react'

const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <section className='p-6 flex flex-col gap-6 min-h-full dark:bg-[#1e1e1e]'>
      {children}
    </section>
  )
}

export default PageWrapper