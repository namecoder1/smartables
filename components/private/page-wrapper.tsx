import React from 'react'

const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <section className='p-6 flex flex-col gap-6 h-fit'>
      {children}
    </section>
  )
}

export default PageWrapper