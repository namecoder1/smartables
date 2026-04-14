'use client'

import { Analytics } from '@vercel/analytics/next'
import { useConsentManager } from '@c15t/nextjs'

export function AnalyticsWithConsent() {
  const { hasConsentFor, hasConsented } = useConsentManager()

  if (!hasConsented()) return null
  if (!hasConsentFor('measurement')) return null

  return <Analytics />
}
