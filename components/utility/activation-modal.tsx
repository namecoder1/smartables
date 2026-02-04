"use client"

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PartyPopper } from "lucide-react"
import { PhoneInput } from '../ui/phone-input'

export const ActivationModal = ({ trigger }: { trigger?: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOtp = async () => {
    setError('')
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Errore durante l\'invio del codice')
      }

      setStep('otp')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setError('')
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp })
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Codice non valido')
      }

      // Success! Close modal and maybe refresh page
      setIsOpen(false)
      window.location.reload() // Reload to update UI state (credits etc)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <div className="w-full bg-linear-to-r border-none ring-0 from-[#FF9710] to-[#c45012] rounded-xl p-6 shadow-xl text-white flex flex-col items-center justify-center gap-4 cursor-pointer hover:scale-[1.01] transition-transform duration-200 ring-offset-2 focus-visible:ring-2">
            <div className="bg-white/20 p-4 rounded-full">
              <PartyPopper className="w-8 h-8 text-white" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-2xl font-bold">Attiva il tuo account e riscatta i tuoi 10€</h3>
              <p className="text-white/80 max-w-md mx-auto">
                Il tuo account è quasi pronto. Attivalo ora per iniziare a usare la piattaforma e ricevere il bonus di benvenuto.
              </p>
            </div>
            <Button variant="secondary" size="lg" className="mt-2 font-semibold shadow-lg">
              Attiva Ora
            </Button>
          </div>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Attiva il tuo account</DialogTitle>
          <DialogDescription>
            {step === 'phone'
              ? "Inserisci il tuo numero di telefono (incluso prefisso internazionale, es. +39) per ricevere il codice di verifica."
              : "Inserisci il codice di 6 cifre che hai ricevuto su WhatsApp."
            }
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}
        <div className='w-full justify-center'>
          {step === 'phone' ? (
            <div className="space-y-4">
              <PhoneInput
                id='phone'
                defaultCountry='IT'
                value={phoneNumber}
                onChange={(val) => setPhoneNumber(val || '')}
              />
              <Button onClick={handleSendOtp} disabled={isLoading || !phoneNumber} className="w-full">
                {isLoading ? "Invio in corso..." : "Invia Codice WhatsApp"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="123456"
                maxLength={6}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-center tracking-widest text-lg ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <Button onClick={handleVerifyOtp} disabled={isLoading || otp.length < 6} className="w-full">
                {isLoading ? "Verifica in corso..." : "Verifica e Attiva"}
              </Button>
              <button
                onClick={() => setStep('phone')}
                className="text-sm text-muted-foreground underline w-full text-center hover:text-foreground"
              >
                Cambia numero
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
