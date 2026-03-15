// -- Analytics Module Types --

export type BookingSource = {
  source: string
  value: number
}

export type DayTrend = {
  day: string
  bookings: number
}

export type HourTrend = {
  hour: string
  bookings: number
}

export type WeeklyTrend = {
  date: string
  visitors: number
}

export type DailyPoint = {
  date: string
  visitors: number
}

export type SeriesPoint = {
  x: string
  y: number
}

export type TrendType = 'positive' | 'negative' | 'neutral'

export type PeriodComparison = {
  series: SeriesPoint[]
  currentTotal: number
  previousTotal: number
  trendType: TrendType
  trendValue: number
}

export type FullPeriodStats = {
  bookings: PeriodComparison
  covers: PeriodComparison
  revenue: PeriodComparison
  avgCovers: number
}

export type WhatsAppStats = {
  usageCount: number
  usageCap: number
  usagePercentage: number
  billingCycleStart: string | null
  inbound: number
  outboundBot: number
  outboundHuman: number
  totalMessages: number
}

export type CustomerMetrics = {
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  returningRate: number
  avgVisitsPerCustomer: number
}

export type GroupSizeBucket = {
  name: string
  min: number
  max: number
  count: number
}

// Raw DB types for analytics queries
export type RawBooking = {
  id: string
  booking_time: string
  created_at: string
  source: string
  status: string
  guests_count: number
  guest_name: string
  guest_phone: string
  customer_id: string | null
}

export type RawOrder = {
  id: string
  created_at: string
  total_amount: number
  status: string
}

export type RawCustomer = {
  id: string
  name: string
  phone_number: string
  total_visits: number
  last_visit: string
  created_at: string
  tags: string[]
}

export type RawWhatsAppMessage = {
  id: string
  direction: 'inbound' | 'outbound_bot' | 'outbound_human'
  status: string
  cost_implication: boolean
  created_at: string
}

export type AnalyticsFeatures = {
  periodComparison: boolean
  rushHours: boolean
  groupDistribution: boolean
  longTermTrends: boolean
  customerMetrics: boolean
  whatsappDetailedAnalytics: boolean
  exportCsv: boolean
  averageCovers: boolean
  whatsappUsageMeter: boolean
}
