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
    <div className='mt-12 space-y-8'>
      <div className='flex flex-col md:flex-row items-center justify-between gap-6'>
        <div className="flex flex-col items-start">
          <h2 className="text-3xl font-bold tracking-tight">Piani e Prezzi</h2>
          <p className="text-muted-foreground">
            Scegli il piano più adatto alla tua attività.
            
          </p>
        </div>

        <div className='relative flex items-center rounded-xl p-1 bg-muted/50 border shadow-inner'>
          <button
            onClick={() => setIsAnnual(false)}
            className={cn(
              "relative z-10 px-6 py-2 text-sm font-medium transition-colors duration-200",
              !isAnnual ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Mensile
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={cn(
              "relative z-10 px-6 py-2 text-sm font-medium transition-colors duration-200",
              isAnnual ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Annuale
          </button>
          <motion.div
            className="absolute top-1 rounded-lg bottom-1 left-1 bg-background shadow-sm border"
            initial={false}
            animate={{
              x: isAnnual ? "100%" : "0%",
              width: "calc(50% - 4px)"
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-3 right-0 rounded-md md:-right-1 bg-green-500 text-white px-1 py-0.5 text-xs font-bold shadow-lg flex items-center gap-1.5 whitespace-nowrap"
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