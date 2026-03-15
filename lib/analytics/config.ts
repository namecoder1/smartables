import type { AnalyticsFeatures } from './types'

const PLAN_FEATURES: Record<string, AnalyticsFeatures> = {
  starter: {
    periodComparison: false,
    rushHours: false,
    groupDistribution: false,
    longTermTrends: false,
    customerMetrics: false,
    whatsappDetailedAnalytics: false,
    exportCsv: false,
    averageCovers: false,
    whatsappUsageMeter: true,
  },
  growth: {
    periodComparison: true,
    rushHours: true,
    groupDistribution: true,
    longTermTrends: false,
    customerMetrics: false,
    whatsappDetailedAnalytics: true,
    exportCsv: false,
    averageCovers: true,
    whatsappUsageMeter: true,
  },
  business: {
    periodComparison: true,
    rushHours: true,
    groupDistribution: true,
    longTermTrends: true,
    customerMetrics: true,
    whatsappDetailedAnalytics: true,
    exportCsv: true,
    averageCovers: true,
    whatsappUsageMeter: true,
  },
}

/**
 * Returns the analytics features for a plan.
 * If the user is on the Starter plan but has purchased the Analytics Pro add-on,
 * they get Growth-level analytics features.
 */
export function getAnalyticsFeatures(
  planId: string | null | undefined,
  hasAnalyticsAddon?: boolean,
): AnalyticsFeatures {
  const effectivePlanId =
    planId === 'starter' && hasAnalyticsAddon ? 'growth' : planId
  if (effectivePlanId && PLAN_FEATURES[effectivePlanId]) return PLAN_FEATURES[effectivePlanId]
  return PLAN_FEATURES.starter
}

export const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  growth: 'Growth',
  business: 'Business',
}

export const PLAN_NEXT_LABEL: Record<string, string> = {
  starter: 'Growth',
  growth: 'Business',
}
