'use client'

import { useEffect, useState } from 'react'
import PricingCard from '@/components/utility/pricing-card'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

const PlansSwitcher = ({
  plans,
  currentPriceId,
  stripeStatus,
}: {
  plans: any[]
  currentPriceId?: string | null
  stripeStatus?: string | null
}) => {
  const [isAnnual, setIsAnnual] = useState(false)

  useEffect(() => {
    function getPlanSpan() {
      const plan =  plans.find((plan) => plan.priceIdMonth || plan.priceIdYear === currentPriceId)
      if (plan?.priceIdMonth == currentPriceId) {
        setIsAnnual(false)
      }
      if (plan?.priceIdYear == currentPriceId) {
        setIsAnnual(true)
      }
    }
    getPlanSpan()
  }, [currentPriceId])

  return (
    <div className='mt-8 space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className="flex flex-col items-start">
          <h2 className="text-2xl font-bold tracking-tight">Piani e Prezzi</h2>
          <p className="text-sm text-muted-foreground">
            Scegli il piano più adatto alla tua attività.
          </p>
        </div>

        <div className='relative bg-muted/50 flex items-center rounded-lg p-1 border'>
          <button
            onClick={() => setIsAnnual(false)}
            className={cn(
              "relative z-10 px-5 py-1.5 text-sm font-medium transition-colors duration-200",
              !isAnnual ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Mensile
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={cn(
              "relative z-10 px-5 py-1.5 text-sm font-medium transition-colors duration-200",
              isAnnual ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Annuale
          </button>
          <motion.div
            className="absolute top-1 rounded-md bottom-1 left-1 bg-background shadow-sm border"
            initial={false}
            animate={{
              x: isAnnual ? "100%" : "0%",
              width: "calc(50% - 4px)"
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isAnnual ? 1 : 0, scale: isAnnual ? 1 : 0.8 }}
            className="absolute -top-2.5 right-1 rounded-full bg-emerald-500 text-white px-2 py-0.5 text-[10px] font-bold whitespace-nowrap pointer-events-none"
          >
            +2 Mesi
          </motion.div>
        </div>
      </div>

      <div className='grid lg:grid-cols-3 gap-4 items-start'>
        {plans.map((plan) => (
          <PricingCard key={plan.id} plan={plan} isAnnual={isAnnual} context="private"
            currentPriceId={currentPriceId} stripeStatus={stripeStatus} />
        ))}
      </div>
    </div>
  )
}

export default PlansSwitcher