import React from 'react'

const DataContainer = ({
  children
}: {
  children: React.ReactNode
}) => {
  return (
    <div className='border-t-2 pt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3 text-card-foreground flex-col'>
      {children}
    </div>
  )
}

export default DataContainer