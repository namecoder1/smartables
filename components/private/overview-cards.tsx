import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

const OverviewCards = ({
  data
}: {
  data: {
    title: string
    value: string | number
    description: string
  }[]
}) => {
  return (
    <div className='grid min-[510px]:grid-cols-3 gap-4'>
      {data.map((item, index) => (
        <Card key={index} className='gap-2 bg-card/80 shadow-none'>
          <CardHeader>
            <CardTitle>{item.title}</CardTitle>
          </CardHeader>
          <CardContent className='flex items-end gap-1.5'>
            <p className='text-3xl font-bold'>
              {item.value}
            </p>
            <span className='text-xl hidden sm:flex text-foreground/80 font-semibold tracking-tight'>
              {item.description}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default OverviewCards