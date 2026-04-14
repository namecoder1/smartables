'use client'

import { useEffect, useState } from 'react'
import { X, Smartphone, Share, MoreVertical, Plus } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

type Platform = 'ios' | 'android' | 'desktop' | null

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return null
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
  const isAndroid = /Android/.test(ua)
  if (isIOS) return 'ios'
  if (isAndroid) return 'android'
  return 'desktop'
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  )
}

const DISMISSED_KEY = 'smartables-pwa-banner-dismissed'

export function InstallPWABanner() {
  const [platform, setPlatform] = useState<Platform>(null)
  const [dismissed, setDismissed] = useState(true) // hidden by default until check
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [step, setStep] = useState<1 | 2>(1)

  useEffect(() => {
    if (isStandalone()) return
    if (sessionStorage.getItem(DISMISSED_KEY)) return

    const p = detectPlatform()
    setPlatform(p)
    setDismissed(false)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function handleDismiss() {
    sessionStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setDismissed(true)
      setDeferredPrompt(null)
    }
  }

  if (dismissed || !platform) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 xl:left-auto xl:right-6 xl:bottom-6 xl:w-80 z-50 bg-[#1a1a1a] border border-[#3B3B3B] rounded-2xl shadow-2xl p-4 text-white animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
            <Image src="/logo.png" width={28} height={28} alt="Smartables" />
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">Installa Smartables</p>
            <p className="text-xs text-white/50">Accesso rapido dal tuo schermo</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-white/40 hover:text-white/80 transition-colors mt-0.5 shrink-0"
          aria-label="Chiudi"
        >
          <X size={16} />
        </button>
      </div>

      {platform === 'ios' && (
        <div className="space-y-3">
          {step === 1 ? (
            <>
              <div className="bg-white/5 rounded-xl p-3 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Share size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold mb-0.5">Passo 1</p>
                  <p className="text-xs text-white/60">
                    Apri Safari e tocca l&apos;icona{' '}
                    <Share size={11} className="inline" />{' '}
                    <strong className="text-white">Condividi</strong> in basso al centro
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full h-9 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-white"
                onClick={() => setStep(2)}
              >
                Fatto, vai al passo 2
              </Button>
            </>
          ) : (
            <>
              <div className="bg-white/5 rounded-xl p-3 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Plus size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold mb-0.5">Passo 2</p>
                  <p className="text-xs text-white/60">
                    Scorri in basso e tocca{' '}
                    <strong className="text-white">&quot;Aggiungi alla schermata Home&quot;</strong>
                    , poi conferma con{' '}
                    <strong className="text-white">Aggiungi</strong>
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full h-9 rounded-xl text-xs font-semibold border-white/20 text-white hover:bg-white/10"
                onClick={handleDismiss}
              >
                Fatto!
              </Button>
            </>
          )}
        </div>
      )}

      {platform === 'android' && (
        <div className="space-y-3">
          {deferredPrompt ? (
            <Button
              size="sm"
              className="w-full h-9 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-white"
              onClick={handleInstall}
            >
              <Smartphone size={14} className="mr-1.5" />
              Installa l&apos;app
            </Button>
          ) : (
            <div className="bg-white/5 rounded-xl p-3 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <MoreVertical size={14} className="text-primary" />
              </div>
              <p className="text-xs text-white/60">
                Tocca <MoreVertical size={11} className="inline" />{' '}
                in alto a destra nel browser, poi{' '}
                <strong className="text-white">Aggiungi a schermata Home</strong>
              </p>
            </div>
          )}
        </div>
      )}

      {platform === 'desktop' && (
        <div className="space-y-3">
          <p className="text-xs text-white/60 leading-relaxed">
            Clicca sull&apos;icona di installazione{' '}
            <strong className="text-white">⊕</strong> nella barra degli indirizzi del
            browser per aggiungere Smartables come app sul tuo desktop.
          </p>
          {deferredPrompt && (
            <Button
              size="sm"
              className="w-full h-9 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-white"
              onClick={handleInstall}
            >
              <Smartphone size={14} className="mr-1.5" />
              Installa sul desktop
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
