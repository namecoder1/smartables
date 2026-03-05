'use client'

import React from 'react'
import { useLocationStore } from '@/store/location-store'
import { Customer } from '@/types/general'
import { Users, UserPlus, Star, Search, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import ClientsTable from '@/components/private/clients-table'
import { Input } from '@/components/ui/input'
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh'
import { LineChart, Line } from 'recharts'
import { subDays, isWithinInterval, startOfMonth, subMonths, format, addDays } from 'date-fns'

const ClientsView = () => {
  const [data, setData] = React.useState<Customer[] | null>(null)
  const [search, setSearch] = React.useState('')
  const { selectedLocationId } = useLocationStore()

  const fetchData = React.useCallback(async () => {
    if (!selectedLocationId) return

    const params = new URLSearchParams()
    params.append('location_id', selectedLocationId)

    const response = await fetch(`/api/supabase/customers?${params.toString()}`)
    const customers = await response.json()
    setData(customers)
  }, [selectedLocationId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  useRealtimeRefresh('customers', {
    filter: selectedLocationId ? `location_id=eq.${selectedLocationId}` : undefined,
    onUpdate: fetchData
  })

  const filteredData = React.useMemo(() => {
    if (!data) return []
    return data.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone_number.includes(search)
    )
  }, [data, search])

  const stats = React.useMemo(() => {
    const now = new Date()

    if (!data) return {
      total: { value: 0, trend: 0, series: [], type: 'neutral' as const },
      new: { value: 0, trend: 0, series: [], type: 'neutral' as const },
      top: { value: 0, trend: 0, series: [], type: 'neutral' as const }
    }

    const thirtyDaysAgo = subDays(now, 30)
    const sixtyDaysAgo = subDays(now, 60)

    const thisMonthStart = startOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))

    // Helper to process trend
    const getTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0
      return ((curr - prev) / prev) * 100
    }

    const getTrendType = (val: number) => {
      if (val > 0.1) return 'positive' as const
      if (val < -0.1) return 'negative' as const
      return 'neutral' as const
    }

    // Totale Clienti Trend (last 30 days growth)
    const totalNow = data.length
    const total30DaysAgo = data.filter(c => new Date(c.created_at) < thirtyDaysAgo).length
    const total60DaysAgo = data.filter(c => new Date(c.created_at) < sixtyDaysAgo).length

    const growthThisPeriod = totalNow - total30DaysAgo
    const growthPrevPeriod = total30DaysAgo - total60DaysAgo
    const totalTrend = getTrend(growthThisPeriod, growthPrevPeriod)

    // Nuovi Mese Trend
    const countThisMonth = data.filter(c => new Date(c.created_at) >= thisMonthStart).length
    const countLastMonth = data.filter(c => {
      const d = new Date(c.created_at)
      return d >= lastMonthStart && d < thisMonthStart
    }).length
    const newTrend = getTrend(countThisMonth, countLastMonth)

    // Top Clienti (No historical data for visits in this view, so neutral trend or simplified)
    const topClients = data.filter(c => c.total_visits >= 5).length

    // Series Data (last 30 days)
    const seriesData = (filterFn: (c: Customer, d: Date) => boolean) => {
      const days = []
      for (let i = 29; i >= 0; i--) {
        const d = subDays(now, i)
        const dateStr = format(d, 'yyyy-MM-dd')
        const count = data.filter(c => {
          const created = new Date(c.created_at)
          return format(created, 'yyyy-MM-dd') === dateStr && filterFn(c, created)
        }).length
        days.push({ x: dateStr, y: count })
      }
      return days
    }

    const totalSeries = []
    let runningTotal = total30DaysAgo
    for (let i = 29; i >= 0; i--) {
      const d = subDays(now, i)
      const dateStr = format(d, 'yyyy-MM-dd')
      runningTotal += data.filter(c => format(new Date(c.created_at), 'yyyy-MM-dd') === dateStr).length
      totalSeries.push({ x: dateStr, y: runningTotal })
    }

    return {
      total: {
        value: totalNow,
        trend: totalTrend,
        type: getTrendType(totalTrend),
        series: totalSeries
      },
      new: {
        value: countThisMonth,
        trend: newTrend,
        type: getTrendType(newTrend),
        series: seriesData((c) => true)
      },
      top: {
        value: topClients,
        trend: 0,
        type: 'neutral' as const,
        series: seriesData((c) => c.total_visits >= 5)
      }
    }
  }, [data])

  const getLineColor = (type: string) => {
    if (type === 'positive') return '#287907'
    if (type === 'negative') return '#E53935'
    return '#A3A3A3'
  }

  const getTrendIcon = (type: string) => {
    if (type === 'positive') return <ArrowUp size={16} />
    if (type === 'negative') return <ArrowDown size={16} />
    return <Minus size={16} />
  }

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <StatCard
          title="Totale Clienti"
          value={stats.total.value}
          subvalue={`${stats.total.trend > 0 ? '+' : ''}${stats.total.trend.toFixed(0)}%`}
          icon={getTrendIcon(stats.total.type)}
          trend="Rispetto al mese scorso"
          color={stats.total.type}
          chartData={stats.total.series}
          lineColor={getLineColor(stats.total.type)}
        />
        <StatCard
          title="Nuovi Mese"
          value={stats.new.value}
          subvalue={`${stats.new.trend > 0 ? '+' : ''}${stats.new.trend.toFixed(0)}%`}
          icon={getTrendIcon(stats.new.type)}
          trend="Rispetto al mese scorso"
          color={stats.new.type}
          chartData={stats.new.series}
          lineColor={getLineColor(stats.new.type)}
        />
        <StatCard
          title="Top Clienti"
          value={stats.top.value}
          subvalue="--"
          icon={<Minus size={16} />}
          trend="Fideli (>5 visite)"
          color="neutral"
          chartData={stats.top.series}
          lineColor={getLineColor('neutral')}
        />
      </div>

      <div className='bg-card text-card-foreground rounded-3xl flex flex-col gap-0 border-2 py-6 pb-0 px-0 shadow-sm overflow-hidden'>
        <div className='flex flex-col items-start lg:flex-row lg:items-center justify-between w-full px-5 border-b-2 pb-6'>
          <h2 className='text-2xl text-foreground font-bold tracking-tight'>Lista Clienti</h2>
          <div className="relative w-full max-w-sm mt-4 lg:mt-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per nome o telefono..."
              className="pl-10 h-10 rounded-xl border-2 bg-card!"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full">
          <ClientsTable data={filteredData} />
        </div>
      </div>
    </div>
  )
}

const StatCard = ({
  title,
  value,
  subvalue,
  icon,
  trend,
  color,
  chartData,
  lineColor
}: {
  title: string
  value: string | number
  subvalue?: string | number
  icon?: React.ReactNode
  trend: string
  color: 'positive' | 'negative' | 'neutral'
  chartData: { x: string, y: number }[]
  lineColor: string
}) => {

  const colorClasses = {
    positive: 'bg-[#cdf1bf] text-[#287907]',
    negative: 'bg-red-100 text-red-800',
    neutral: 'bg-gray-100 text-gray-800'
  }

  return (
    <div className='bg-card text-card-foreground rounded-3xl flex items-start gap-2 border-2 py-5 px-4 shadow-sm min-h-[140px]'>
      <div className='flex flex-col justify-between h-full flex-1'>
        <h2 className='text-md sm:text-lg text-muted-foreground font-semibold tracking-tight'>{title}</h2>
        <div>
          <p className='text-xl sm:text-2xl font-bold tracking-tight'>{value}</p>
          <div className='mt-2 flex flex-wrap items-center gap-2 sm:gap-3'>
            <div className={`flex items-center gap-1 ${colorClasses[color]} w-fit py-1 px-2 rounded-xl`}>
              <p className='text-[10px] sm:text-xs font-bold'>{subvalue}</p>
              {icon}
            </div>
            <p className='text-[10px] sm:text-xs text-muted-foreground font-medium'>{trend}</p>
          </div>
        </div>
      </div>
      <div className='flex items-center justify-end'>
        <LineChart width={80} height={50} data={chartData} className="sm:w-[100px] sm:h-[60px]">
          <Line
            type="monotone"
            dataKey="y"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </div>
    </div>
  )
}

export default ClientsView