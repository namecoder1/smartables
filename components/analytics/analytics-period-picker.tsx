'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { DateRange } from 'react-day-picker'
import { RangePicker } from '@/components/ui/range-picker'

export function AnalyticsPeriodPicker({
  className
} : {
  className?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const date = from && to ? { from: new Date(from), to: new Date(to) } : undefined

  const handleChange = (range: DateRange | undefined) => {
    const params = new URLSearchParams(searchParams.toString())
    if (range?.from) params.set('from', range.from.toISOString())
    else params.delete('from')
    if (range?.to) params.set('to', range.to.toISOString())
    else params.delete('to')
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const handleReset = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('from')
    params.delete('to')
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <RangePicker
      date={date}
      placeholder='Scegli periodo'
      onChange={handleChange}
      onReset={handleReset}
      disabled={{ after: new Date() }}
      showDays={false}
      variant="button"
      className={className}
    />
  )
}
