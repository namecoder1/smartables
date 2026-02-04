'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * This component handles the refresh after a successful Stripe checkout.
 * Since the webhook might take a moment to process, we refresh the page
 * after a short delay to show the updated subscription data.
 */
export function RefreshOnSuccess() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasRefreshed = useRef(false)

  useEffect(() => {
    const success = searchParams.get('success')

    if (success === 'true' && !hasRefreshed.current) {
      hasRefreshed.current = true

      // Wait for webhook to process, then refresh + clean URL
      const timer = setTimeout(() => {
        router.replace('/billing')
        router.refresh()
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [searchParams, router])

  return null
}
