import { format, subDays, addDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import type {
  BookingSource,
  DayTrend,
  HourTrend,
  WeeklyTrend,
  DailyPoint,
  SeriesPoint,
  TrendType,
  PeriodComparison,
  FullPeriodStats,
  CustomerMetrics,
  WhatsAppStats,
  GroupSizeBucket,
  RawBooking,
  RawOrder,
  RawCustomer,
  RawWhatsAppMessage,
} from './types'

const SOURCE_LABELS: Record<string, string> = {
  whatsapp_auto: 'WhatsApp Auto',
  manual: 'Manuale',
  web: 'Sito Web',
  phone: 'Telefono',
}

export function calcBookingSources(bookings: RawBooking[]): BookingSource[] {
  const counts: Record<string, number> = {}
  bookings.forEach(b => {
    const label = SOURCE_LABELS[b.source] || b.source
    counts[label] = (counts[label] || 0) + 1
  })
  return Object.entries(counts).map(([source, value]) => ({ source, value }))
}

export function calcHottestDays(bookings: RawBooking[]): DayTrend[] {
  const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
  const counts = new Array(7).fill(0)
  bookings.forEach(b => {
    counts[new Date(b.booking_time).getDay()]++
  })
  return days.map((day, i) => ({ day, bookings: counts[i] }))
}

export function calcHottestHours(
  bookings: RawBooking[],
  startHour = 10,
  endHour = 23,
): HourTrend[] {
  const counts = new Array(24).fill(0)
  bookings.forEach(b => {
    counts[new Date(b.booking_time).getHours()]++
  })
  const result: HourTrend[] = []
  for (let h = startHour; h <= endHour; h++) {
    result.push({ hour: `${h}:00`, bookings: counts[h] })
  }
  return result
}

export function calcWeeklyTrend(bookings: RawBooking[]): WeeklyTrend[] {
  const trends: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    trends[format(subDays(new Date(), i), 'EEE')] = 0
  }
  bookings.forEach(b => {
    const key = format(new Date(b.created_at), 'EEE')
    if (trends[key] !== undefined) trends[key]++
  })
  return Object.entries(trends).map(([date, visitors]) => ({ date, visitors }))
}

export function calcLongTermTrend(bookings: RawBooking[]): DailyPoint[] {
  const daily: Record<string, number> = {}
  bookings
    .slice()
    .sort((a, b) => new Date(a.booking_time).getTime() - new Date(b.booking_time).getTime())
    .forEach(b => {
      const key = format(new Date(b.booking_time), 'MMM dd')
      daily[key] = (daily[key] || 0) + 1
    })
  return Object.entries(daily).map(([date, visitors]) => ({ date, visitors }))
}

function makeSeries(map: Map<string, number>): SeriesPoint[] {
  return Array.from(map.entries())
    .map(([x, y]) => ({ x, y }))
    .sort((a, b) => a.x.localeCompare(b.x))
}

function makeTrend(current: number, previous: number): { trendType: TrendType; trendValue: number } {
  let trendValue = 0
  if (previous > 0) trendValue = ((current - previous) / previous) * 100
  else if (current > 0) trendValue = 100
  const trendType: TrendType = trendValue > 1 ? 'positive' : trendValue < -1 ? 'negative' : 'neutral'
  return { trendType, trendValue }
}

export function calcFullPeriodStats({
  bookings,
  orders,
  from,
  to,
}: {
  bookings: RawBooking[]
  orders: RawOrder[]
  from: Date
  to: Date
}): FullPeriodStats {
  const diffDays = Math.max(
    1,
    Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)),
  )
  const prevFrom = subDays(from, diffDays)
  const prevTo = subDays(from, 1)

  const bookingMap = new Map<string, number>()
  const coversMap = new Map<string, number>()
  const revenueMap = new Map<string, number>()

  for (let i = 0; i <= diffDays; i++) {
    const k = format(addDays(from, i), 'yyyy-MM-dd')
    bookingMap.set(k, 0)
    coversMap.set(k, 0)
    revenueMap.set(k, 0)
  }

  let bookingsCurrent = 0, bookingsPrev = 0
  let coversCurrent = 0, coversPrev = 0

  bookings.forEach(b => {
    const d = new Date(b.booking_time)
    const key = format(d, 'yyyy-MM-dd')
    if (isWithinInterval(d, { start: startOfDay(from), end: endOfDay(to) })) {
      bookingMap.set(key, (bookingMap.get(key) || 0) + 1)
      coversMap.set(key, (coversMap.get(key) || 0) + (b.guests_count || 0))
      bookingsCurrent++
      coversCurrent += b.guests_count || 0
    } else if (isWithinInterval(d, { start: startOfDay(prevFrom), end: endOfDay(prevTo) })) {
      bookingsPrev++
      coversPrev += b.guests_count || 0
    }
  })

  let revenueCurrent = 0, revenuePrev = 0

  orders.forEach(o => {
    const d = new Date(o.created_at)
    const key = format(d, 'yyyy-MM-dd')
    if (isWithinInterval(d, { start: startOfDay(from), end: endOfDay(to) })) {
      revenueMap.set(key, (revenueMap.get(key) || 0) + (o.total_amount || 0))
      revenueCurrent += o.total_amount || 0
    } else if (isWithinInterval(d, { start: startOfDay(prevFrom), end: endOfDay(prevTo) })) {
      revenuePrev += o.total_amount || 0
    }
  })

  const avgCovers =
    bookingsCurrent > 0 ? Math.round((coversCurrent / bookingsCurrent) * 10) / 10 : 0

  return {
    bookings: {
      series: makeSeries(bookingMap),
      currentTotal: bookingsCurrent,
      previousTotal: bookingsPrev,
      ...makeTrend(bookingsCurrent, bookingsPrev),
    },
    covers: {
      series: makeSeries(coversMap),
      currentTotal: coversCurrent,
      previousTotal: coversPrev,
      ...makeTrend(coversCurrent, coversPrev),
    },
    revenue: {
      series: makeSeries(revenueMap),
      currentTotal: revenueCurrent,
      previousTotal: revenuePrev,
      ...makeTrend(revenueCurrent, revenuePrev),
    },
    avgCovers,
  }
}

export function calcGroupSizeDistribution(bookings: RawBooking[]): GroupSizeBucket[] {
  const buckets: GroupSizeBucket[] = [
    { name: '1-2', min: 1, max: 2, count: 0 },
    { name: '3-4', min: 3, max: 4, count: 0 },
    { name: '5-6', min: 5, max: 6, count: 0 },
    { name: '7+', min: 7, max: 999, count: 0 },
  ]
  bookings.forEach(b => {
    const bucket = buckets.find(bk => b.guests_count >= bk.min && b.guests_count <= bk.max)
    if (bucket) bucket.count++
  })
  return buckets
}

export function calcCustomerMetrics(customers: RawCustomer[]): CustomerMetrics {
  const totalCustomers = customers.length
  const returning = customers.filter(c => c.total_visits > 1)
  const returningRate =
    totalCustomers > 0 ? Math.round((returning.length / totalCustomers) * 100) : 0
  const avgVisitsPerCustomer =
    totalCustomers > 0
      ? Math.round(
          (customers.reduce((acc, c) => acc + c.total_visits, 0) / totalCustomers) * 10,
        ) / 10
      : 0
  const thirtyDaysAgo = subDays(new Date(), 30)
  const newCustomers = customers.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length

  return {
    totalCustomers,
    newCustomers,
    returningCustomers: returning.length,
    returningRate,
    avgVisitsPerCustomer,
  }
}

export function calcWhatsAppStats(
  usageCount: number,
  usageCap: number,
  billingCycleStart: string | null,
  messages: RawWhatsAppMessage[],
): WhatsAppStats {
  const usagePercentage = usageCap > 0 ? Math.min(100, Math.round((usageCount / usageCap) * 100)) : 0
  const inbound = messages.filter(m => m.direction === 'inbound').length
  const outboundBot = messages.filter(m => m.direction === 'outbound_bot').length
  const outboundHuman = messages.filter(m => m.direction === 'outbound_human').length

  return {
    usageCount,
    usageCap,
    usagePercentage,
    billingCycleStart,
    inbound,
    outboundBot,
    outboundHuman,
    totalMessages: messages.length,
  }
}

export function calcAverageCovers(bookings: RawBooking[]): number {
  const valid = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'no_show')
  if (valid.length === 0) return 0
  const total = valid.reduce((acc, b) => acc + (b.guests_count || 0), 0)
  return Math.round((total / valid.length) * 10) / 10
}
