'use client'

import Link from "next/link"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card"
import { Check, Loader2 } from "lucide-react"
import { motion } from "motion/react"
import { PLANS } from "@/lib/plans"
import { changeSubscription } from "@/utils/stripe/actions"
import { useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const PricingCard = ({
  plan,
  isAnnual,
  context,
  currentPriceId,
  stripeStatus,
}: {
  plan: any
  isAnnual: boolean
  context: 'public' | 'onboarding' | 'private'
  currentPriceId?: string | null
  stripeStatus?: string | null
}) => {
  const { popular, name, id, priceMonth, priceYear, features, buttonText } = plan
  const price = isAnnual ? priceYear : priceMonth
  const period = isAnnual ? '/anno' : '/mese'
  const showSetupFee = process.env.NEXT_PUBLIC_ENABLE_SETUP_FEE === 'true'
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Determine plan relationship for private context
  const targetPriceId = isAnnual ? plan.priceIdYear : plan.priceIdMonth
  const hasActiveSub = currentPriceId && stripeStatus === 'active'
  const isCurrentPlan = hasActiveSub && (plan.priceIdMonth === currentPriceId || plan.priceIdYear === currentPriceId)

  // Determine if this card is upgrade or downgrade relative to current plan
  let changeType: 'upgrade' | 'downgrade' | 'current' | 'none' = 'none'
  if (context === 'private' && hasActiveSub) {
    if (isCurrentPlan && targetPriceId === currentPriceId) {
      changeType = 'current'
    } else {
      const currentPlanIndex = PLANS.findIndex(
        (p) => p.priceIdMonth === currentPriceId || p.priceIdYear === currentPriceId,
      )
      const thisPlanIndex = PLANS.findIndex(
        (p) => p.priceIdMonth === targetPriceId || p.priceIdYear === targetPriceId,
      )
      if (thisPlanIndex > currentPlanIndex) {
        changeType = 'upgrade'
      } else if (thisPlanIndex < currentPlanIndex) {
        changeType = 'downgrade'
      } else {
        // Same tier, different interval (monthly ↔ annual)
        changeType = targetPriceId === plan.priceIdYear ? 'upgrade' : 'downgrade'
      }
    }
  }

  const handlePlanChange = () => {
    if (!targetPriceId) return
    startTransition(async () => {
      try {
        const result = await changeSubscription(targetPriceId)
        if (result.success) {
          toast.success(
            result.type === 'upgrade'
              ? 'Piano aggiornato con successo! La differenza è stata addebitata.'
              : 'Piano modificato. Il cambio sarà attivo dal prossimo ciclo di fatturazione.'
          )
          router.refresh()
        }
      } catch (error: any) {
        toast.error(error.message || 'Errore durante il cambio piano.')
      }
    })
  }

  // Determine button label and behavior
  const getButtonContent = () => {
    if (context !== 'private' || !hasActiveSub) {
      // Public / onboarding / no active sub: use Link as today
      return null
    }

    if (changeType === 'current') {
      return { label: 'Piano Attivo', disabled: true, onClick: undefined }
    }
    if (changeType === 'upgrade') {
      return { label: 'Upgrade', disabled: false, onClick: handlePlanChange }
    }
    if (changeType === 'downgrade') {
      return { label: 'Downgrade', disabled: false, onClick: handlePlanChange }
    }
    return null
  }

  const actionButton = getButtonContent()

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="h-full"
    >
      <Card className={cn(
        "flex flex-col h-full relative overflow-hidden transition-all duration-300",
        context === 'public'
          ? popular
            ? "border-primary shadow-lg shadow-primary/40 bg-primary rounded-3xl"
            : "bg-transparent border-border/10 hover:shadow-lg rounded-3xl"
          : context === 'onboarding'
            ? popular
              ? "border-primary shadow-lg shadow-primary/30 bg-linear-to-b from-primary/30 via-primary/10 to-white rounded-3xl"
              : "bg-neutral-50 border-border hover:shadow-lg rounded-3xl"
            : popular
              ? "border-primary/40 shadow-md"
              : "hover:border-muted-foreground/20",
        changeType === 'current' && "ring-2 ring-emerald-500/40 border-emerald-500/40 hover:ring-emerald-500/40 hover:border-emerald-500/40"
      )}>

        {changeType === 'current' && (
          <div className="absolute top-0 left-0">
            <div className="text-xs font-bold px-4 py-1 shadow-sm rounded-br-2xl bg-emerald-500 text-white">
              PIANO ATTIVO
            </div>
          </div>
        )}

        <CardHeader className="pb-4">
          <div className="space-y-1">
            <h3 className={cn(
              "text-2xl font-bold tracking-tight",
              context === 'public' && !popular ? 'text-white' : context === 'public' && popular ? 'text-black' : context === 'onboarding' && !popular ? 'text-foreground' : context === 'onboarding' && popular ? 'text-foreground' : 'text-foreground'
            )}>
              {name}
            </h3>
            <p className={cn("text-lg", context === 'public' && popular ? "text-black" : "text-muted-foreground")}>
              {id === 'starter' && 'Per piccoli ristoranti o bar.'}
              {id === 'growth' && 'Per ristoranti in crescita.'}
              {id === 'business' && 'Per gruppi e catene.'}
            </p>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className={cn(
              "font-extrabold tracking-tight",
              context === 'private' ? "text-3xl" : "text-4xl",
              context === 'public' && popular ? 'text-black' : 'text-white'
            )}>
              €{price}
            </span>
            <span className={cn(
              'font-medium',
              context === 'private' ? "text-black" :
              context === 'public' && popular ? 'text-black' : 'text-white'
            )}>{period}</span>
          </div>
          {showSetupFee && (
            <p className={cn("text-xs mt-2", context === 'public' ? "text-gray-500" : "text-muted-foreground")}>
              + €149 setup una tantum
            </p>
          )}
        </CardHeader>

        <CardContent className="flex-1">
          {context === 'private' && (
            <div className="w-full h-px mb-6 bg-border/50" />
          )}
          <ul className="space-y-4">
            {features.map((feature: string, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <div className={cn(
                  "mt-0.5 rounded-full p-0.5 shrink-0",
                  context === 'public' && popular
                    ?  "bg-black text-white"
                    : "bg-primary/10 text-primary"
                )}>
                  <Check className="h-3 w-3" />
                </div>
                <p className={context === 'public' && !popular ? "text-white/70" : popular ? "text-black" : "text-muted-foreground text-sm"}>
                  {feature}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="pt-4">
          {actionButton ? (
            <Button
              className={cn(
                "w-full font-semibold h-11",
                changeType === 'current'
                  ? "opacity-60"
                  : changeType === 'upgrade'
                    ? "shadow-md hover:shadow-lg transition-all"
                    : ""
              )}
              variant={changeType === 'upgrade' ? 'default' : changeType === 'current' ? 'secondary' : 'outline'}
              disabled={actionButton.disabled || isPending}
              onClick={actionButton.onClick}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Elaborazione...
                </>
              ) : (
                actionButton.label
              )}
            </Button>
          ) : (
            <Button
              className={cn(
                "w-full font-semibold h-11",
                popular && context === 'public' ?
                  "shadow-md hover:shadow-lg transition-all bg-black"
                  : "bg-primary border-primary hover:bg-primary/90 hover:text-white"
              )}
              variant={popular ? 'default' : 'outline'}
              asChild
            >
              <Link href={`/register?plan=${id}&interval=${isAnnual ? 'year' : 'month'}`}>
                {context === 'public' ? 'Seleziona' : buttonText} {showSetupFee && "+ Setup"}
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export default PricingCard
