"use client"

import { signup } from '@/utils/supabase/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import PasswordStrength, { isPasswordValid } from '@/components/utility/password-strength'
import { motion } from 'framer-motion'
import { Loader2, ArrowLeft } from 'lucide-react'
import { PLANS } from '@/lib/plans'
import PricingCard from '@/components/utility/pricing-card'
import { Switch } from '@/components/ui/switch'

function RegisterContent() {
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
                  <ArrowLeft className="h-4 w-4" /> Torna al login
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-4 mb-4">
              <Label
                onClick={() => setIsAnnual(false)}
                className={`text-base cursor-pointer transition-colors duration-200 ${!isAnnual ? 'font-bold text-foreground' : 'text-muted-foreground'}`}
              >
                Mensile
              </Label>
              <Switch
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
                className='data-[state=unchecked]:bg-neutral-200!'
              />
              <Label
                onClick={() => setIsAnnual(true)}
                className={`text-base cursor-pointer transition-colors duration-200 ${isAnnual ? 'font-bold text-foreground' : 'text-muted-foreground'}`}
              >
                Annuale{' '}
                <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  -20%
                </span>
              </Label>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {PLANS.map((planItem, index) => (
                <motion.div
                  key={planItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="h-full"
                >
                  <PricingCard plan={planItem} isAnnual={isAnnual} context="onboarding" />
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
              />
            </div>
            {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}
            <input type="hidden" name="plan" value={plan || ''} />
            <input type="hidden" name="interval" value={interval || ''} />
            <Button className="w-full font-semibold" type="submit" disabled={isLoading || !isPasswordValid(password)}>
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <RegisterContent />
    </Suspense>
  )
}
