'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, ArrowRight, Circle, Clock, Phone, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OnboardingData } from '@/actions/get-onboarding-status'
import { useRouter } from 'next/navigation'
import { Progress } from '@/components/ui/progress'

interface OnboardingStatusProps {
  data: OnboardingData
}

export const OnboardingStatus = ({ data }: OnboardingStatusProps) => {
  const router = useRouter()

  const steps = [
    { id: 'docs', label: 'Documenti Aziendali', description: 'Carica la visura e i documenti del legale rappresentante.', link: '/compliance', completed: data.documents, time: '2 min' },
    { id: 'phone', label: 'Acquisto Numero', description: 'Scegli il numero fisso o mobile per il tuo ristorante.', link: '/onboarding/phone', completed: data.phone, time: '1 min' },
    { id: 'voice', label: 'Verifica Vocale', description: 'Rispondi alla chiamata automatica per verificare il numero.', link: '/onboarding/voice', completed: data.voice, time: '2 min' },
    { id: 'brand', label: 'Personalizzazione', description: 'Imposta logo, colori e nome del tuo assistente.', link: '/onboarding/brand', completed: data.branding, time: '5 min' },
    { id: 'test', label: 'Test Finale', description: 'Invia un messaggio di prova per assicurarti che tutto funzioni.', link: '/onboarding/test', completed: data.test, time: '1 min' },
  ]

  const completedCount = steps.filter(s => s.completed).length
  const totalSteps = steps.length
  const progress = Math.min(100, Math.round((completedCount / totalSteps) * 100))

  const nextStepIndex = steps.findIndex(s => !s.completed)
  const isComplete = nextStepIndex === -1 && completedCount === totalSteps

  if (isComplete) {
    return <DashboardReadyState />
  }

  return (
    <Card className="border-2 shadow-sm py-0 gap-0 space-y-0">
      <CardHeader className="bg-muted/20 border-b-2 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold tracking-tight">Configura il tuo ristorante</CardTitle>
            <CardDescription>Completa questi passaggi per attivare l'assistente AI.</CardDescription>
          </div>
          <div className="flex items-center gap-4 min-w-[200px]">
            <div className="flex-1 text-right">
              <span className="text-sm font-medium text-foreground bg-muted px-2 py-1 rounded-full">{progress}%</span>
              <Progress value={progress} className="h-2 w-full mt-2.5" />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-2 px-0">
        <div className="flex flex-col">
          {steps.map((step, index) => {
            const isActive = index === nextStepIndex;
            const isCompleted = step.completed;
            const isLocked = !isCompleted && !isActive;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex gap-4 p-6 border-b-2 last:border-0 transition-colors",
                  isActive ? "bg-primary/5" : "bg-card",
                  !isActive && !isLocked && "hover:bg-muted/20 cursor-pointer"
                )}
                onClick={() => !isLocked && !isActive && router.push(step.link)}
              >
                {/* Status Icon */}
                <div className="shrink-0 mt-0.5">
                  {isCompleted ? (
                    <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 flex items-center justify-center border border-green-200 dark:border-green-800">
                      <Check className="h-4 w-4" />
                    </div>
                  ) : isActive ? (
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center ring-4 ring-primary/20">
                      <span className="text-xs font-bold">{index + 1}</span>
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted border border-muted-foreground/20 flex items-center justify-center text-muted-foreground">
                      <span className="text-xs font-medium">{index + 1}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <h4 className={cn("font-medium text-base", isCompleted ? "text-muted-foreground" : "text-foreground")}>
                      {step.label}
                    </h4>
                    {isActive && (
                      <span className="inline-flex items-center text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full w-fit">
                        In corso
                      </span>
                    )}
                  </div>

                  {!isCompleted && (
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                      {step.description}
                    </p>
                  )}

                  {/* Active Step Actions */}
                  {isActive && (
                    <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-4">
                        {step.id === 'voice' && (data.activationStatus === 'pending' || data.activationStatus === 'provisioning' || data.activationStatus === 'purchasing') ? (
                          <div className="flex flex-col gap-2">
                            <Button disabled className="font-medium bg-muted text-muted-foreground w-fit">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Approvazione Documenti in Corso...
                            </Button>
                            <p className="text-xs text-amber-600/80 font-medium">Attendi la notifica di sblocco da Telnyx (24-48h)</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <Button onClick={() => router.push(step.link)} className="font-medium">
                              Continua
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              {step.time}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

const DashboardReadyState = () => {
  return (
    <Card className="border shadow-sm bg-card overflow-hidden">
      <div className="bg-green-500/10 border-b border-green-500/20 p-6 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0 border border-green-200">
          <Check className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-green-900 dark:text-green-100">Assistente Attivo</h2>
          <p className="text-green-700 dark:text-green-300 text-sm">Il tuo ristorante è pronto per ricevere chiamate automatiche.</p>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border bg-muted/10">
            <div className="text-sm font-medium text-muted-foreground">Chiamate Oggi</div>
            <div className="text-2xl font-bold mt-1">0</div>
          </div>
          <div className="p-4 rounded-lg border bg-muted/10">
            <div className="text-sm font-medium text-muted-foreground">Prenotazioni</div>
            <div className="text-2xl font-bold mt-1">0</div>
          </div>
          <div className="p-4 rounded-lg border bg-muted/10">
            <div className="text-sm font-medium text-muted-foreground">Stato Linea</div>
            <div className="text-2xl font-bold mt-1 text-green-600 flex items-center gap-2">
              Online <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
