'use server'

import { requireAuth } from '@/lib/supabase-helpers'
import { subDays, subMonths } from 'date-fns'
import { findPlanByPriceId } from '@/lib/plans'
import { getAnalyticsFeatures } from '@/lib/analytics/config'
import {
  calcBookingSources,
  calcHottestDays,
  calcHottestHours,
  calcWeeklyTrend,
  calcLongTermTrend,
  calcFullPeriodStats,
  calcCustomerMetrics,
  calcWhatsAppStats,
  calcAverageCovers,
  calcGroupSizeDistribution,
} from '@/lib/analytics/calculations'
import {
  queryBookings,
  queryBookingsTotalCount,
  queryOrders,
  queryCustomers,
  queryWhatsAppMessages,
  queryOrganizationUsage,
} from '@/lib/analytics/queries'

export async function getAnalyticsData(from?: string, to?: string) {
  const auth = await requireAuth()
  if (!auth.success) return null
  const { supabase, organizationId } = auth

  // Org usage & plan info — single fetch, used for plan detection + WA stats
  const orgUsage = await queryOrganizationUsage(organizationId)
  const currentPlan = findPlanByPriceId(orgUsage?.stripe_price_id || '')
  const planId = currentPlan?.id || 'starter'
  const hasAnalyticsAddon = ((orgUsage as any)?.addons_config?.extra_analytics ?? 0) > 0
  const features = getAnalyticsFeatures(planId, hasAnalyticsAddon)

  const now = new Date()
  const toDate = to ? new Date(to) : now
  const fromDate = from ? new Date(from) : subDays(now, 30)

  // For period comparison we fetch an extended range (double period) to compute prev period
  const diffDays = Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)))
  const extendedFrom = features.periodComparison ? subDays(fromDate, diffDays) : fromDate

  // Parallel fetches: year-window bookings + period bookings (with optional extended range)
  // totalBookings uses a count query to avoid loading all records for the counter.
  const [allBookings, periodBookings, totalBookings] = await Promise.all([
    queryBookings(organizationId),                        // last 1-year window (capped)
    queryBookings(organizationId, extendedFrom, toDate),  // period (+ prev if needed)
    queryBookingsTotalCount(organizationId),              // exact all-time count via HEAD
  ])

  // Conditional fetches based on plan
  const [orders, customers, waMessages] = await Promise.all([
    features.periodComparison
      ? queryOrders(organizationId, extendedFrom, toDate)
      : Promise.resolve([]),
    features.customerMetrics
      ? queryCustomers(organizationId)
      : Promise.resolve([]),
    features.whatsappDetailedAnalytics
      ? queryWhatsAppMessages(organizationId, fromDate, toDate)
      : Promise.resolve([]),
  ])

  // --- Calculations ---
  const sources = calcBookingSources(allBookings)
  const weeklyTrends = calcWeeklyTrend(periodBookings)

  const arrivedBookings = allBookings.filter(b => b.status === 'arrived')
  const hottestDays = features.rushHours ? calcHottestDays(arrivedBookings) : []
  const hottestHours = features.rushHours ? calcHottestHours(arrivedBookings) : []
  const groupDistribution = features.groupDistribution ? calcGroupSizeDistribution(allBookings) : []

  const threeMonthsAgo = subMonths(now, 3)
  const longTermBookings = allBookings.filter(b => new Date(b.booking_time) >= threeMonthsAgo)
  const longTermTrends = features.longTermTrends ? calcLongTermTrend(longTermBookings) : []

  const periodStats = features.periodComparison
    ? calcFullPeriodStats({ bookings: periodBookings, orders, from: fromDate, to: toDate })
    : null

  const customerMetrics = features.customerMetrics
    ? calcCustomerMetrics(customers)
    : null

  const whatsAppStats =
    features.whatsappUsageMeter && orgUsage
      ? calcWhatsAppStats(
          orgUsage.whatsapp_usage_count || 0,
          orgUsage.usage_cap_whatsapp || 0,
          orgUsage.current_billing_cycle_start ?? null,
          waMessages,
        )
      : null

  // totalBookings is fetched via count query above — do not recompute from allBookings
  const averageCovers = features.averageCovers ? calcAverageCovers(allBookings) : null
  const totalCustomers = features.customerMetrics ? customers.length : null

  return {
    planId,
    features,
    hasAnalyticsAddon,
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
    // Core — all plans
    sources,
    weeklyTrends,
    totalBookings,
    whatsAppStats,
    // Growth+
    periodStats,
    hottestDays,
    hottestHours,
    groupDistribution,
    averageCovers,
    totalCustomers,
    // Business
    longTermTrends,
    customerMetrics,
  }
}
