"use client"

import { login } from '@/supabase/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import PasswordInput from '@/components/ui/password-input'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    await login(formData);
    setTimeout(() => setIsLoading(false), 2000); // Fail-safe reset
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='flex flex-col gap-6 w-full max-w-sm mx-auto'
    >
      <div className='flex flex-col gap-2 text-center'>
        <h1 className='text-3xl font-bold tracking-tight'>Bentornato</h1>
        <p className='text-muted-foreground'>
          Inserisci le tue credenziali per accedere al tuo account
        </p>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  Password dimenticata?
                </Link>
              </div>
              <PasswordInput
                id="password"
                name="password"
                placeholder='••••••••'
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background"
              />
            </div>
            {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}
            <Button className="w-full font-semibold" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Accedi
            </Button>
          </div>
        </form>

        {/* Divider for future social login */}
        {/* <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Oppure continua con
            </span>
          </div>
        </div> */}

        <div className="text-center text-sm text-muted-foreground">
          Non hai un account?{' '}
          <Link className="underline underline-offset-4 hover:text-primary font-medium" href="/register">
            Registrati
          </Link>
        </div>
      </div>

      <p className='text-center text-xs text-muted-foreground mt-4'>
        &copy; {new Date().getFullYear()} Smartables.it
      </p>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <LoginContent />
    </Suspense>
  )
}
