'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { checkSubscriptionStatus } from './actions'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner' // Assuming sonner is used for toasts based on other files

interface Props {
  initialPriceId?: string
}

export function BillingSuccessCheck({ initialPriceId }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    const success = searchParams.get('success')

    if (success === 'true') {
      setIsChecking(true)

      const interval = setInterval(async () => {
        try {
          const { priceId, status } = await checkSubscriptionStatus()

          // If the price ID has changed or if we initiated a checkout but had no plan before
          // We consider it a success if the status is active or trialing
          if (priceId !== initialPriceId && (status === 'active' || status === 'trialing')) {
            clearInterval(interval)
            // We don't need to clear timeout explicitly if we redirect, 
            // but it's good practice. However, we can't access 'timeout' variable 
            // before it's defined if we use 'const timeout = ...'.
            // Since we redirect, the component will unmount and the cleanup function will run.
            toast.success("Piano aggiornato con successo!")
            router.replace('/billing')
            router.refresh()
          }
        } catch (error) {
          console.error("Error checking status:", error)
        }
      }, 1000)

      // Safety timeout after 15 seconds
      const timeout = setTimeout(() => {
        clearInterval(interval)
        setIsChecking(false)
        router.replace('/billing')
        router.refresh()
      }, 15000)

      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }
  }, [searchParams, initialPriceId, router])

  if (!isChecking) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <div className="bg-card border shadow-lg rounded-xl p-8 flex flex-col items-center gap-4 max-w-sm text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Attivazione in corso...</h3>
          <p className="text-muted-foreground text-sm">
            Stiamo confermando il tuo abbonamento. Potrebbe richiedere qualche secondo.
          </p>
        </div>
      </div>
    </div>
  )
}
