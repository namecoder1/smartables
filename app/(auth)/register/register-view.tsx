"use client"

import { signup } from '@/utils/supabase/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import PasswordStrength, { isPasswordValid } from '@/components/utility/password-strength'
import { motion } from 'motion/react'
import { Loader2, ArrowLeft, Check } from 'lucide-react'
import { PLANS } from '@/lib/plans'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

const E = [0.22, 1, 0.36, 1] as const
const D = 0.65
const fadeUp = { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { duration: D, ease: E } } }


const RegisterView = () => {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const plan = searchParams.get('plan')
  const interval = searchParams.get('interval')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // State for plan selection view
  const [isAnnual, setIsAnnual] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    await signup(formData);
    setTimeout(() => setIsLoading(false), 2000); // Fail-safe reset
  }

  // If no plan/interval selected, show the Plan Selection screen
  if (!plan || !interval) {
    return (
      <div className="fixed inset-0 z-100 overflow-y-auto bg-background/80 backdrop-blur-md">
        <div className="min-h-full flex flex-col items-center justify-start p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-7xl mx-auto bg-white/50 p-6 rounded-3xl shadow-2xl border-2 my-auto"
          >
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-4 text-foreground">Scegli il tuo piano ideale</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                  Seleziona il piano che meglio si adatta alle esigenze del tuo locale.
                  Potrai cambiarlo in qualsiasi momento.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 mb-6">
                <Link href="/login" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors px-4 py-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                  <ArrowLeft className="h-4 w-4" /> Indietro
                </Link>
              </div>
            </div>

            <motion.div variants={fadeUp} className='flex items-center gap-4 mx-auto w-fit mb-10'>
              <div className='relative bg-muted/50 flex items-center rounded-2xl p-1 border'>
                <button
                  onClick={() => setIsAnnual(false)}
                  data-testid="billing-monthly"
                  className={cn(
                    "relative z-10 px-5 py-1.5 text-sm font-medium transition-colors duration-200 text-black"
                  )}
                >
                  Mensile
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  data-testid="billing-annual"
                  className={cn(
                    "relative z-10 px-5 py-1.5 text-sm font-medium transition-colors duration-200 text-black",
                  )}
                >
                  Annuale
                </button>
                <motion.div
                  className="absolute top-1 rounded-xl bottom-1 left-1 bg-background shadow-sm border"
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
                  className="absolute -top-2.5 -right-6 rounded-full bg-emerald-500 text-white px-2 py-0.5 text-[10px] font-bold whitespace-nowrap pointer-events-none"
                >
                  +2 Mesi GRATIS
                </motion.div>
              </div>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {PLANS.map((planItem, index) => (
                <motion.div
                  key={planItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="h-full"
                >
                  <PricingCard plan={planItem} isAnnual={isAnnual} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // If plan is selected, show Registration Form
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='flex flex-col gap-6 w-full max-w-sm mx-auto'
    >
      <div className='mx-auto w-fit lg:hidden'>
        <Image src='/logo.png' alt='Logo Smartables' width={60} height={60} />
      </div>
      <div className='flex flex-col gap-2 text-center'>
        <h1 className='text-3xl font-bold tracking-tight'>Crea un account</h1>
        <p className='text-muted-foreground'>
          Hai scelto il piano <span className="font-semibold text-foreground capitalize">{plan}</span> ({interval === 'year' ? 'Annuale' : 'Mensile'})
        </p>
        <Link href="/register" className="text-xs text-primary hover:underline">
          Cambia piano
        </Link>
      </div>

      <div className="grid gap-6">
        <form action={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                placeholder="nome@esempio.com"
                required
                type="email"
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background"
                data-testid="register-email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <PasswordStrength
                id="password"
                name="password"
                placeholder='••••••••'
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="register-password"
              />
            </div>
            {error && <p className="text-sm font-medium text-destructive text-center" data-testid="register-error">{error}</p>}
            <input type="hidden" name="plan" value={plan || ''} />
            <input type="hidden" name="interval" value={interval || ''} />
            <Button className="w-full font-semibold" type="submit" disabled={isLoading || !isPasswordValid(password)} data-testid="register-submit">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrati
            </Button>
          </div>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Hai già un account?{' '}
          <Link className="underline underline-offset-4 hover:text-primary font-medium" href="/login">
            Accedi
          </Link>
        </div>
      </div>

      <p className='text-center text-xs text-muted-foreground mt-4'>
        &copy; {new Date().getFullYear()} Smartables.it
      </p>
    </motion.div>
  )
}

const PricingCard = ({
  plan,
  isAnnual
} : {
  plan: any,
  isAnnual: boolean
}) => {
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
        "flex flex-col h-full relative overflow-hidden transition-all duration-300",
          popular
            ? "border-primary shadow-lg shadow-primary/40 bg-primary rounded-3xl"
            : "bg-white border-2 hover:shadow-lg rounded-3xl"
        )}>
        <CardHeader className="pb-4">
          <div className="space-y-1">
            <h3 className={cn(
              "text-2xl font-bold tracking-tight text-black"
            )}>
              {name}
            </h3>
            <p className={cn("text-lg", popular ? "text-black" : "text-muted-foreground")}>
              {id === 'starter' && 'Per piccoli ristoranti o bar.'}
              {id === 'growth' && 'Per ristoranti in crescita.'}
              {id === 'business' && 'Per gruppi e catene.'}
            </p>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className={cn(
              "font-extrabold tracking-tight text-4xl text-black"
            )}>
              €{price}
            </span>
            <span className={cn(
              'font-medium text-black'
            )}>{period}</span>
          </div>
          {!showSetupFee && (
            <p className={cn('text-xs mt-2', popular ? 'text-white' : 'text-black')}>
              + €149 setup una tantum
            </p>
          )}
        </CardHeader>

        <CardContent className="flex-1">
          <ul className="space-y-4">
            {features.map((feature: string, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <div className={cn(
                  "mt-0.5 rounded-full p-0.5 shrink-0",
                  popular
                    ?  "bg-black text-white"
                    : "bg-primary/10 text-primary"
                )}>
                  <Check className="h-3 w-3" />
                </div>
                <p className="text-black">
                  {feature}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="pt-4">
          <Button
            className={cn(
              "w-full font-semibold h-11",
              popular ?
                "shadow-md hover:shadow-lg transition-all bg-black hover:bg-black!"
                : "bg-primary border-primary hover:bg-primary/90 hover:text-white"
            )}
            variant={popular ? 'default' : 'outline'}
            asChild
          >
            <Link href={`/register?plan=${id}&interval=${isAnnual ? 'year' : 'month'}`} data-testid={`plan-select-${id}`}>
              Seleziona {showSetupFee && "+ Setup"}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}


export default RegisterView