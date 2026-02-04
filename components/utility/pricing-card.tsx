'use client'

import Link from "next/link"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card"
import { Check } from "lucide-react"
import { motion } from "motion/react"

const PricingCard = ({ plan, isAnnual, context }: { plan: any, isAnnual: boolean, context: 'public' | 'private' }) => {
  const { popular, name, id, priceMonth, priceYear, features, buttonText } = plan
  const price = isAnnual ? priceYear : priceMonth
  const period = isAnnual ? '/anno' : '/mese'
  const showSetupFee = process.env.NEXT_PUBLIC_ENABLE_SETUP_FEE === 'true'

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="h-full"
    >
      <Card className={cn(
        "flex flex-col h-full relative overflow-hidden transition-all duration-300 bg-[#f4f4f4]",
        context === 'public'
          ? popular
            ? "border-primary shadow-lg shadow-primary/30 bg-linear-to-b from-primary/30 via-primary/10 to-white"
            : "bg-neutral-50/50 border-neutral-200 hover:border-blue-200 hover:shadow-lg"
          : popular
            ? "border-primary/50 shadow-lg shadow-primary/10 bg-linear-to-b from-primary/5 to-transparent"
            : "hover:border-primary/20 hover:shadow-lg"
      )}>
        {popular && (
          <div className="absolute top-0 right-0">
            <div className={cn(
              "text-xs font-bold px-4 py-1 shadow-sm",
              context === 'public' ? "bg-primary text-white" : "bg-primary text-primary-foreground"
            )}>
              POPOLARE
            </div>
          </div>
        )}

        <CardHeader className="pb-4">
          <div className="space-y-1">
            <h3 className={cn(
              "text-xl font-bold tracking-tight",
              context === 'public' ? 'text-neutral-900' : 'text-foreground'
            )}>
              {name}
            </h3>
            <p className={cn("text-sm", context === 'public' ? "text-gray-500" : "text-muted-foreground")}>
              {id === 'starter' && 'Per piccoli ristoranti o bar.'}
              {id === 'pro' && 'Per ristoranti in crescita.'}
              {id === 'business' && 'Per gruppi e catene.'}
            </p>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className={cn(
              "text-4xl font-extrabold tracking-tight",
              context === 'public' ? 'text-neutral-900' : 'text-foreground'
            )}>
              €{price}
            </span>
            <span className={cn("font-medium", context === 'public' ? "text-gray-500" : "text-muted-foreground")}>{period}</span>
          </div>
          {isAnnual && (
            <p className="text-xs font-semibold text-emerald-600 mt-1">
              Risparmi €{(priceMonth * 12) - priceYear} all&apos;anno
            </p>
          )}
          {showSetupFee && (
            <p className={cn("text-xs mt-2", context === 'public' ? "text-gray-500" : "text-muted-foreground")}>
              + €149 setup una tantum
            </p>
          )}
        </CardHeader>

        <CardContent className="flex-1">
          <div className={cn("w-full h-px mb-6", context === 'public' ? "bg-gray-200" : "bg-border/50")} />
          <ul className="space-y-4">
            {features.map((feature: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <div className={cn(
                  "mt-0.5 rounded-full p-0.5 shrink-0",
                  context === 'public'
                    ? feature.startsWith('No')
                      ? "bg-gray-100 text-gray-400"
                      : "bg-primary text-primary-foreground"
                    : feature.startsWith('No')
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/10 text-primary"
                )}>
                  <Check className="h-3 w-3" />
                </div>
                <span className={context === 'public' ? "text-gray-600" : "text-muted-foreground"}>
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="pt-4">
          <Button
            className={cn(
              "w-full font-semibold h-11",
              popular
                ? "shadow-md hover:shadow-lg transition-all"
                : ""
            )}
            variant={popular ? 'default' : 'outline'}
            asChild
          >
            <Link href={`/register?plan=${id}&interval=${isAnnual ? 'year' : 'month'}`}>
              {buttonText} {showSetupFee && "+ Setup"}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export default PricingCard
