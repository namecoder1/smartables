'use client'

import { DonutPie } from '@/components/charts/donut-pie'
import RushHoursChart from '@/components/charts/rush-hours-chart'
import { DashboardRealtimeUpdater } from '@/components/dashboard/dashboard-realtime-updater'
import { Button } from '@/components/ui/button'
import { RangePicker } from '@/components/ui/range-picker'
import { subDays, format, isWithinInterval, startOfMonth, endOfMonth, subMonths, getHours, addDays } from 'date-fns'
import { ArrowDown, ArrowUp, Settings, Minus, SquareArrowOutUpRight, Loader2 } from 'lucide-react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import React, { useMemo, useTransition } from 'react'
import { DateRange } from 'react-day-picker'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts'
import { Reservations } from './reservations'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const DashboardView = ({
  organization,
  reservationsToday,
  reservationsWeek,
  coversToday,
  todaysBookings,
  analysisBookings,
  analysisOrders,
  profile,
  activeLocationId,
  ordersAmount
}: {
  organization: any
  reservationsToday: number
  reservationsWeek: number
  coversToday: number
  todaysBookings: any[]
  analysisBookings: any[]
  analysisOrders: any[]
  profile: any
  activeLocationId: string | undefined
  ordersAmount: number
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const date = useMemo(() => {
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    if (from && to) {
      return { from: new Date(from), to: new Date(to) }
    }
    const now = new Date()
    return { from: subDays(now, 30), to: now }
  }, [searchParams])

  const handleDateChange = (newRange: DateRange | undefined) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newRange?.from) {
      params.set('from', newRange.from.toISOString())
    } else {
      params.delete('from')
    }
    if (newRange?.to) {
      params.set('to', newRange.to.toISOString())
    } else {
      params.delete('to')
    }
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

  const [selectedDay, setSelectedDay] = React.useState<number>(1)

  React.useEffect(() => {
    const day = new Date().getDay() === 0 ? 7 : new Date().getDay()
    setSelectedDay(day)
  }, [])

  // Calculate stats directly to avoid memoization/sync issues
  const calculateStats = () => {
    const now = new Date()
    const currentWeekStart = subDays(now, 7)
    const previousWeekStart = subDays(now, 14)

    const processData = (data: any[], dateKey: string, valueKey?: string) => {
      const dailyMap = new Map<string, number>()

      // Initialize based on selected range
      if (date.from && date.to) {
        const diffDays = Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24))
        for (let i = 0; i <= diffDays; i++) {
          const d = format(addDays(date.from, i), 'yyyy-MM-dd')
          dailyMap.set(d, 0)
        }
      }

      data.forEach(item => {
        const itemDate = new Date(item[dateKey])
        const d = format(itemDate, 'yyyy-MM-dd')
        if (dailyMap.has(d)) {
          const val = valueKey ? (item[valueKey] || 0) : 1
          dailyMap.set(d, (dailyMap.get(d) || 0) + val)
        }
      })

      const series = Array.from(dailyMap.entries())
        .map(([x, y]) => ({ x, y }))
        .sort((a, b) => a.x.localeCompare(b.x))

      // Totals for the period
      const totalInRange = data.reduce((acc, item) => acc + (valueKey ? (item[valueKey] || 0) : 1), 0)

      // Trend calculation
      const currentWeekTotal = data.filter(item =>
        isWithinInterval(new Date(item[dateKey]), { start: currentWeekStart, end: now })
      ).reduce((acc, item) => acc + (valueKey ? (item[valueKey] || 0) : 1), 0)

      const previousWeekTotal = data.filter(item =>
        isWithinInterval(new Date(item[dateKey]), { start: previousWeekStart, end: currentWeekStart })
      ).reduce((acc, item) => acc + (valueKey ? (item[valueKey] || 0) : 1), 0)

      let trendType: 'positive' | 'negative' | 'neutral' = 'neutral'
      let trendValue = 0
      if (previousWeekTotal > 0) {
        trendValue = ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100
      } else if (currentWeekTotal > 0) {
        trendValue = 100
      }

      if (trendValue > 1) trendType = 'positive'
      else if (trendValue < -1) trendType = 'negative'

      return { series, trendType, trendValue, periodTotal: totalInRange }
    }

    const bookings = processData(analysisBookings || [], 'booking_time')
    const covers = processData(analysisBookings || [], 'booking_time', 'guests_count')
    const revenue = processData(analysisOrders || [], 'created_at', 'total_amount')

    const avgTicketValue = analysisOrders.length > 0 ? revenue.periodTotal / analysisOrders.length : 0

    // Average Ticket Trend
    const currentWeekRevenue = (analysisOrders || []).filter(item =>
      isWithinInterval(new Date(item.created_at), { start: currentWeekStart, end: now })
    ).reduce((acc, item) => acc + (item.total_amount || 0), 0)

    const currentWeekBookings = (analysisBookings || []).filter(item =>
      isWithinInterval(new Date(item.booking_time), { start: currentWeekStart, end: now })
    ).length

    const previousWeekRevenue = (analysisOrders || []).filter(item =>
      isWithinInterval(new Date(item.created_at), { start: previousWeekStart, end: currentWeekStart })
    ).reduce((acc, item) => acc + (item.total_amount || 0), 0)

    const previousWeekBookings = (analysisBookings || []).filter(item =>
      isWithinInterval(new Date(item.booking_time), { start: previousWeekStart, end: currentWeekStart })
    ).length

    const currentAvg = currentWeekBookings > 0 ? currentWeekRevenue / currentWeekBookings : 0
    const previousAvg = previousWeekBookings > 0 ? previousWeekRevenue / previousWeekBookings : 0

    let avgTrendType: 'positive' | 'negative' | 'neutral' = 'neutral'
    let avgTrendValue = 0
    if (previousAvg > 0) {
      avgTrendValue = ((currentAvg - previousAvg) / previousAvg) * 100
    } else if (currentAvg > 0) {
      avgTrendValue = 100
    }

    if (avgTrendValue > 1) avgTrendType = 'positive'
    else if (avgTrendValue < -1) avgTrendType = 'negative'

    const avgSeries = revenue.series.map((rev, i) => {
      const book = bookings.series[i]
      return { x: rev.x, y: (book && book.y > 0) ? rev.y / book.y : 0 }
    })

    return {
      bookings,
      covers,
      revenue,
      avgTicket: {
        value: avgTicketValue,
        series: avgSeries,
        trendType: avgTrendType,
        trendValue: avgTrendValue
      }
    }
  }

  const stats = calculateStats()

  // Rush Hours Logic
  const rushHoursData = useMemo(() => {
    const now = new Date()
    const currentMonthStart = startOfMonth(now)
    const previousMonthStart = startOfMonth(subMonths(now, 1))
    const previousMonthEnd = endOfMonth(subMonths(now, 1))

    const processRushData = (data: any[], start: Date, end: Date) => {
      const hourlyStats = new Array(24).fill(0).map((_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        count: 0
      }))

      data.filter(item => {
        const d = new Date(item.booking_time)
        const day = d.getDay() === 0 ? 7 : d.getDay() // 1-7
        return isWithinInterval(d, { start, end }) && day === selectedDay
      }).forEach(item => {
        const hour = getHours(new Date(item.booking_time))
        hourlyStats[hour].count++
      })

      return hourlyStats
    }

    const current = processRushData(analysisBookings, currentMonthStart, now)
    const previous = processRushData(analysisBookings, previousMonthStart, previousMonthEnd)

    // Filter hours to show only relevant ones (e.g., 10:00 to 23:00)
    const startHour = 10
    const endHour = 23

    const formatted = []
    for (let h = startHour; h <= endHour; h++) {
      formatted.push({
        hour: `${h}:00`,
        current: current[h].count,
        previous: previous[h].count
      })
    }

    const hasPreviousData = previous.some(h => h.count > 0)

    return { formatted, hasPreviousData }
  }, [analysisBookings, selectedDay])

  // Group Size Distribution Logic
  const groupSizeData = useMemo(() => {
    const buckets = [
      { name: '1-2', min: 1, max: 2, count: 0, color: '#FE950F' },
      { name: '3-4', min: 3, max: 4, count: 0, color: '#FE950F' },
      { name: '5-6', min: 5, max: 6, count: 0, color: '#FE950F' },
      { name: '7+', min: 7, max: 100, count: 0, color: '#FE950F' },
    ]

    analysisBookings.forEach(booking => {
      const guests = booking.guests_count
      const bucket = buckets.find(b => guests >= b.min && guests <= b.max)
      if (bucket) bucket.count++
    })

    return buckets
  }, [analysisBookings])

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

  const daysOfWeek = [
    { label: 'L', value: 1 },
    { label: 'M', value: 2 },
    { label: 'M', value: 3 },
    { label: 'G', value: 4 },
    { label: 'V', value: 5 },
    { label: 'S', value: 6 },
    { label: 'D', value: 7 },
  ]

  return (
    <div className="relative">
      {isPending && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-3xl transition-all duration-300">
          <div className="flex flex-col items-center gap-2 bg-card p-6 rounded-2xl shadow-xl border-2 animate-in fade-in zoom-in duration-200">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Aggiornamento dati...</p>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className='items-start flex-col flex'>
          <h3 className="text-3xl font-bold tracking-tight">Dashboard</h3>
          <p className="text-muted-foreground">Panoramica completa delle tue prenotazioni</p>
        </div>
        <div className="w-full sm:w-fit flex items-center justify-between sm:justify-start gap-2">
          <RangePicker
            date={date}
            onChange={handleDateChange}
            onReset={handleReset}
            disabled={{ after: new Date() }}
            showDays={false}
            variant="button"
          />
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 lg:col-span-2'>
          {/* StatCard: Prenotazioni */}
          <StatCard
            title="Prenotazioni"
            value={stats.bookings.periodTotal}
            subvalue={`${stats.bookings.trendValue > 0 ? '+' : ''}${stats.bookings.trendValue.toFixed(1)}%`}
            icon={getTrendIcon(stats.bookings.trendType)}
            trend="Rispetto alla settimana scorsa"
            color={stats.bookings.trendType}
            chartData={stats.bookings.series}
            lineColor={getLineColor(stats.bookings.trendType)}
          />

          {/* StatCard: Coperti Occupati */}
          <StatCard
            title="Coperti Occupati"
            value={stats.covers.periodTotal}
            subvalue={`${stats.covers.trendValue > 0 ? '+' : ''}${stats.covers.trendValue.toFixed(1)}%`}
            icon={getTrendIcon(stats.covers.trendType)}
            trend="Rispetto a settimana scorsa"
            color={stats.covers.trendType}
            chartData={stats.covers.series}
            lineColor={getLineColor(stats.covers.trendType)}
          />

          {/* StatCard: Revenue */}
          <StatCard
            title="Revenue"
            value={`€ ${stats.revenue.periodTotal?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subvalue={`${stats.revenue.trendValue > 0 ? '+' : ''}${stats.revenue.trendValue.toFixed(1)}%`}
            icon={getTrendIcon(stats.revenue.trendType)}
            trend="Rispetto alla settimana scorsa"
            color={stats.revenue.trendType}
            chartData={stats.revenue.series}
            lineColor={getLineColor(stats.revenue.trendType)}
          />

          {/* StatCard: Media per Scontrino */}
          <StatCard
            title="Media per Scontrino"
            value={`€ ${stats.avgTicket.value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subvalue={`${stats.avgTicket.trendValue > 0 ? '+' : ''}${stats.avgTicket.trendValue.toFixed(1)}%`}
            icon={getTrendIcon(stats.avgTicket.trendType)}
            trend="Rispetto alla settimana scorsa"
            color={stats.avgTicket.trendType}
            chartData={stats.avgTicket.series}
            lineColor={getLineColor(stats.avgTicket.trendType)}
          />
        </div>
        <div className='bg-card text-card-foreground rounded-3xl flex flex-col items-center gap-2 border-2 py-6 px-4 shadow-sm'>
          <h2 className='text-lg text-muted-foreground text-left mr-auto font-semibold tracking-tight px-2'>Canale</h2>
          <div className='w-full max-w-70 mx-auto'>
            <DonutPie data={analysisBookings} />
          </div>
        </div>
      </div>

      <div className='mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card className='pt-0 justify-between gap-0'>
          <CardHeader className="border-b-2 py-5 flex flex-wrap flex-row items-center justify-between w-full gap-4">
            <CardTitle className="text-lg font-bold tracking-tight">
              Orari di punta
            </CardTitle>
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
              {daysOfWeek.map((day) => (
                <button
                  key={`${day.label}-${day.value}`}
                  onClick={() => setSelectedDay(day.value)}
                  className={`
                    flex items-center justify-center w-6 h-5 rounded-md text-xs font-bold transition-all duration-200
                    ${selectedDay === day.value
                      ? 'bg-white text-foreground shadow-sm scale-110'
                      : 'text-zinc-500 hover:text-foreground hover:bg-white/50'}
                  `}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className='w-full'>
            <RushHoursChart
              data={rushHoursData.formatted}
              showComparison={rushHoursData.hasPreviousData}
            />
          </CardContent>
        </Card>

        <Card className='pt-0 justify-between gap-0'>
          <CardHeader className="border-b-2 py-5 flex items-center gap-3">
            <CardTitle className="text-lg font-bold tracking-tight">
              Distribuzione Gruppi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-62.5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={groupSizeData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#71717a', fontSize: 12, fontWeight: 600 }}
                    width={40}
                  />
                  <Bar
                    dataKey="count"
                    radius={[0, 4, 4, 0]}
                    barSize={32}
                  >
                    {groupSizeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-auto border-t pt-4">
              {groupSizeData.slice(0, 4).map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium text-muted-foreground">{item.name} pers.</span>
                  </div>
                  <span className="text-sm font-bold">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className='py-0 mt-6 gap-0'>
        <CardHeader className="flex flex-col items-start lg:flex-row lg:items-center justify-between w-full py-5 border-b-2">
          <CardTitle className="text-lg font-bold tracking-tight">
            Prenotazioni di oggi
          </CardTitle>
          <Link href={`/${organization?.slug}/${activeLocationId}/prenotazioni`} className='flex items-center gap-2 text-sm'>
            Guarda tutte
            <SquareArrowOutUpRight size={16} />
          </Link>
        </CardHeader>
        <CardContent className='px-0!'>
          <Reservations data={todaysBookings} context="dashboard" />
        </CardContent>
      </Card>

      {profile && (
        <DashboardRealtimeUpdater
          organizationId={profile.organization_id}
          locationId={activeLocationId}
        />
      )}
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
    <div className='bg-card text-card-foreground rounded-3xl flex items-start gap-2 border-2 py-5 px-4 shadow-sm min-h-35'>
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
        <LineChart width={80} height={50} data={chartData} className="sm:w-25 sm:h-15">
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

export default DashboardView
