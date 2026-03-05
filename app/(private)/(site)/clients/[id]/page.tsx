'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocationStore } from '@/store/location-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChevronLeft,
  Phone,
  Mail,
  MoreHorizontal,
  Calendar,
  CreditCard,
  User,
  ExternalLink,
  Target,
  UtensilsCrossed,
  Cake,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Minus,
  Clock
} from 'lucide-react'
import { format, subDays, isWithinInterval } from 'date-fns'
import { it } from 'date-fns/locale'
import PageWrapper from '@/components/private/page-wrapper'
import { Booking, Order } from '@/types/general'
import { mapBookingStatus } from '@/lib/maps'
import SetPageTitle from '@/components/private/set-page-title'
import { LineChart, Line } from 'recharts'

interface CustomerDetail {
  id: string
  name: string
  phone_number: string
  email?: string
  total_visits: number
  last_visit: string
  created_at: string
  bookings: Booking[]
  orders: (Order & { items: any[] })[]
}

const ClientPage = () => {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { selectedLocationId } = useLocationStore()
  const [data, setData] = React.useState<CustomerDetail | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchDetail = async () => {
      if (!id || !selectedLocationId) return
      try {
        const response = await fetch(`/api/supabase/customers/${id}?location_id=${selectedLocationId}`)
        const detail = await response.json()
        setData(detail)
      } catch (error) {
        console.error("Error fetching customer detail:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id, selectedLocationId])

  const stats = React.useMemo(() => {
    if (!data) return null

    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)
    const sixtyDaysAgo = subDays(now, 60)

    const getTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0
      return ((curr - prev) / prev) * 100
    }

    const getTrendType = (val: number) => {
      if (val > 0.1) return 'positive'
      if (val < -0.1) return 'negative'
      return 'neutral'
    }

    // Bookings
    const bookingsThisPeriod = data.bookings.filter(b => new Date(b.booking_time) >= thirtyDaysAgo).length
    const bookingsPrevPeriod = data.bookings.filter(b => {
      const d = new Date(b.booking_time)
      return d >= sixtyDaysAgo && d < thirtyDaysAgo
    }).length
    const bookingsTrend = getTrend(bookingsThisPeriod, bookingsPrevPeriod)

    // Spending
    const spendingThisPeriod = data.orders
      .filter(o => new Date(o.created_at) >= thirtyDaysAgo)
      .reduce((acc, o) => acc + o.total_amount, 0)
    const spendingPrevPeriod = data.orders
      .filter(o => {
        const d = new Date(o.created_at)
        return d >= sixtyDaysAgo && d < thirtyDaysAgo
      })
      .reduce((acc, o) => acc + o.total_amount, 0)
    const spendingTrend = getTrend(spendingThisPeriod, spendingPrevPeriod)

    // Average Ticket
    const ordersThisPeriod = data.orders.filter(o => new Date(o.created_at) >= thirtyDaysAgo).length
    const ordersPrevPeriod = data.orders.filter(o => {
      const d = new Date(o.created_at)
      return d >= sixtyDaysAgo && d < thirtyDaysAgo
    }).length

    const avgThis = ordersThisPeriod > 0 ? spendingThisPeriod / ordersThisPeriod : 0
    const avgPrev = ordersPrevPeriod > 0 ? spendingPrevPeriod / ordersPrevPeriod : 0
    const avgTrend = getTrend(avgThis, avgPrev)

    // Series Generation (last 30 days)
    const generateSeries = (items: any[], dateKey: string, valueKey?: string) => {
      const series = []
      for (let i = 29; i >= 0; i--) {
        const d = subDays(now, i)
        const dateStr = format(d, 'yyyy-MM-dd')
        const val = items
          .filter(item => format(new Date(item[dateKey]), 'yyyy-MM-dd') === dateStr)
          .reduce((acc, item) => acc + (valueKey ? item[valueKey] : 1), 0)
        series.push({ x: dateStr, y: val })
      }
      return series
    }

    return {
      bookings: {
        value: data.bookings.length,
        trend: bookingsTrend,
        type: getTrendType(bookingsTrend),
        series: generateSeries(data.bookings, 'booking_time')
      },
      spending: {
        value: data.orders.reduce((acc, o) => acc + o.total_amount, 0),
        trend: spendingTrend,
        type: getTrendType(spendingTrend),
        series: generateSeries(data.orders, 'created_at', 'total_amount')
      },
      orders: {
        value: data.orders.length,
        trend: getTrend(ordersThisPeriod, ordersPrevPeriod),
        type: getTrendType(getTrend(ordersThisPeriod, ordersPrevPeriod)),
        series: generateSeries(data.orders, 'created_at')
      },
      avg: {
        value: data.orders.length > 0 ? data.orders.reduce((acc, o) => acc + o.total_amount, 0) / data.orders.length : 0,
        trend: avgTrend,
        type: getTrendType(avgTrend),
        series: generateSeries(data.orders, 'created_at', 'total_amount').map((s, i, arr) => {
          const ords = generateSeries(data.orders, 'created_at')[i].y
          return { x: s.x, y: ords > 0 ? s.y / ords : 0 }
        })
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

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Caricamento in corso...</div>
  if (!data || !stats) return <div className="p-8 text-center">Cliente non trovato</div>

  return (
    <PageWrapper>
      <div className="flex flex-col gap-6">
        <SetPageTitle title={data.name} description='' />

        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-3xl font-bold tracking-tight">Dettaglio Cliente</h2>
            <p className="text-muted-foreground">Panoramica completa di {data.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar - Personal Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-card rounded-3xl border-2 p-8 shadow-sm">
              <div className="flex flex-col items-center justify-start text-center">
                <div className="flex items-center justify-start mr-auto gap-4">
                  <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center mb-6 border-4 border-white shadow-xl">
                    <User className="w-10 h-10 text-primary/30" />
                  </div>
                  <div className="flex flex-col items-start">
                    <h3 className="text-2xl font-bold mb-1">{data.name}</h3>
                    <p className="text-xs text-muted-foreground mb-6 uppercase tracking-widest font-semibold">Cliente da {format(new Date(data.created_at), 'MMM yyyy')}</p>
                  </div>
                </div>

                <div className="w-full space-y-3 pt-6 border-t font-medium">
                  <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-muted/30 border-2 border-transparent hover:border-primary/20 transition-all cursor-pointer group">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Telefono</p>
                      <p className="text-sm font-bold">{data.phone_number}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Stats Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatCard
                title="Prenotazioni"
                value={stats.bookings.value}
                subvalue={`${stats.bookings.trend > 0 ? '+' : ''}${stats.bookings.trend.toFixed(0)}%`}
                icon={getTrendIcon(stats.bookings.type)}
                trend="Ultimi 30 giorni"
                color={stats.bookings.type as any}
                chartData={stats.bookings.series}
                lineColor={getLineColor(stats.bookings.type)}
              />
              <StatCard
                title="Totale Speso"
                value={`€ ${stats.spending.value.toFixed(0)}`}
                subvalue={`${stats.spending.trend > 0 ? '+' : ''}${stats.spending.trend.toFixed(0)}%`}
                icon={getTrendIcon(stats.spending.type)}
                trend="Ultimi 30 giorni"
                color={stats.spending.type as any}
                chartData={stats.spending.series}
                lineColor={getLineColor(stats.spending.type)}
              />
            </div>

            {/* Bookings History */}
            <div className='bg-card text-card-foreground rounded-3xl border-2 shadow-sm overflow-hidden'>
              <div className='flex items-center justify-between w-full px-6 py-5 border-b-2'>
                <h3 className='text-xl text-foreground font-bold tracking-tight'>Storico Prenotazioni</h3>
                <Badge variant="outline" className="rounded-lg font-bold border-2">
                  {data.bookings.length} prenotazioni
                </Badge>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.bookings.length > 0 ? data.bookings.map(booking => (
                    <div key={booking.id} className="p-5 rounded-2xl border-2 bg-muted/5 hover:border-primary/20 transition-all flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <div className="p-2.5 bg-white rounded-xl shadow-sm shrink-0">
                          <UtensilsCrossed className="w-5 h-5 text-primary" />
                        </div>
                        <Badge className={`rounded-full px-3 py-1 font-bold text-[10px] uppercase ${booking.status === 'confirmed' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                          booking.status === 'cancelled' ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          } border shadow-none`}>
                          {mapBookingStatus(booking.status)}
                        </Badge>
                      </div>

                      <div>
                        <p className="font-bold">{format(new Date(booking.booking_time), 'EEEE d MMMM', { locale: it })}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-medium">
                          <span className="flex items-center gap-1.5"><Clock size={12} /> {format(new Date(booking.booking_time), 'HH:mm')}</span>
                          <span className="flex items-center gap-1.5"><User size={12} /> {booking.guests_count} persone</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-2 py-8 text-center text-muted-foreground font-medium">Nessuna prenotazione trovata</div>
                  )}
                </div>
              </div>
            </div>

            {/* Orders History */}
            <div className='bg-card text-card-foreground rounded-3xl border-2 shadow-sm overflow-hidden'>
              <div className='flex items-center justify-between w-full px-6 py-5 border-b-2'>
                <h3 className='text-xl text-foreground font-bold tracking-tight'>Storico Spese</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="[&_tr]:border-b-2">
                    <tr className="border-b-2 bg-muted/30">
                      <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">Ordine</th>
                      <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">Data</th>
                      <th className="h-12 px-6 text-right align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">Totale</th>
                      <th className="h-12 px-6 text-center align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">Stato</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {data.orders.length > 0 ? data.orders.map((order) => (
                      <tr key={order.id} className="border-b-2 hover:bg-muted/30 transition-colors">
                        <td className="p-4 px-6 align-middle font-bold text-primary">#{order.id.slice(0, 6)}</td>
                        <td className="p-4 px-6 align-middle">
                          <div className="flex flex-col text-xs font-semibold">
                            <span>{format(new Date(order.created_at), 'dd MMM yyyy')}</span>
                            <span className="text-muted-foreground font-medium">{format(new Date(order.created_at), 'HH:mm')}</span>
                          </div>
                        </td>
                        <td className="p-4 px-6 align-middle text-right font-black text-base">€ {order.total_amount.toFixed(2)}</td>
                        <td className="p-4 px-6 align-middle text-center">
                          <Badge className="rounded-lg px-3 py-1 font-bold text-[10px] uppercase bg-green-500 text-white shadow-none">
                            {order.status}
                          </Badge>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground italic font-medium">Nessuna spesa registrata</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
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
    <div className='bg-card text-card-foreground rounded-3xl flex items-start gap-2 border-2 py-5 px-5 shadow-sm min-h-[140px]'>
      <div className='flex flex-col justify-between h-full flex-1'>
        <h2 className='text-md text-muted-foreground font-semibold tracking-tight'>{title}</h2>
        <div>
          <p className='text-3xl font-black tracking-tight'>{value}</p>
          <div className='mt-3 flex flex-wrap items-center gap-3'>
            <div className={`flex items-center gap-1 ${colorClasses[color]} w-fit py-1 px-2.5 rounded-xl`}>
              <p className='text-[10px] font-bold'>{subvalue}</p>
              {icon}
            </div>
            <p className='text-[10px] text-muted-foreground font-medium'>{trend}</p>
          </div>
        </div>
      </div>
      <div className='flex items-center justify-end'>
        <LineChart width={80} height={40} data={chartData}>
          <Line
            type="monotone"
            dataKey="y"
            stroke={lineColor}
            strokeWidth={3}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </div>
    </div>
  )
}

export default ClientPage