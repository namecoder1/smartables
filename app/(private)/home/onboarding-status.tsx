'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Lock, ChevronRight, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OnboardingData } from '@/actions/get-onboarding-status'
import { useRouter } from 'next/navigation'

interface StepProps {
  label: string
  completed: boolean
  isNext: boolean
  index: number
  total: number
  isLast: boolean
}

const Step = ({ label, completed, isNext, index, total, isLast }: StepProps) => (
  <div className={cn(
    "flex items-center relative",
    !isLast && "flex-1"
  )}>
    <div className="relative z-10 flex flex-col items-center gap-2 group">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300",
        completed
          ? "bg-primary border-primary text-primary-foreground"
          : isNext
            ? "border-primary ring-4 ring-primary/10 text-primary bg-background"
            : "border-muted-foreground/30 text-muted-foreground bg-muted/10"
      )}>
        {completed ? (
          <Check className="h-4 w-4" />
        ) : (
          <span className="text-xs font-medium">{index + 1}</span>
        )}
      </div>
      <span className={cn(
        "absolute top-10 whitespace-nowrap text-xs font-medium transition-colors",
        completed ? "text-primary" : isNext ? "text-foreground" : "text-muted-foreground"
      )}>
        {label}
      </span>
    </div>

    {!isLast && (
      <div className={cn(
        "h-[2px] flex-1 mx-2 transition-colors duration-500",
        completed ? "bg-primary" : "bg-muted"
      )} />
    )}
  </div>
)

export const OnboardingStatus = ({ data }: { data: OnboardingData }) => {
  const router = useRouter()
  const steps = [
    { label: 'Documenti', fullLabel: 'Documenti', link: '/compliance', completed: data.documents },
    { label: 'Telefono', fullLabel: 'Telefono', link: '/onboarding/phone', completed: data.phone },
    { label: 'Voce', fullLabel: 'Verifica', link: '/onboarding/voice', completed: data.voice },
    { label: 'Brand', fullLabel: 'Branding', link: '/onboarding/brand', completed: data.branding },
    { label: 'WhatsApp', fullLabel: 'Bot WhatsApp', link: '/onboarding/whatsapp', completed: data.whatsapp },
  ]

  const nextStepIndex = steps.findIndex(s => !s.completed)
  const currentStep = steps[nextStepIndex]

  return (
    <Card className="border-border/60 shadow-sm overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">Stato Attivazione</CardTitle>
            <CardDescription>
              Configura il tuo assistente AI in pochi passaggi.
            </CardDescription>
          </div>
          {currentStep && (
            <Button size="sm" onClick={() => router.push(currentStep.link)} className="gap-2">
              Completa ora <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-10">
        {/* Stepper */}
        <div className="flex items-center w-full px-4">
          {steps.map((step, index) => (
            <Step
              key={index}
              {...step}
              index={index}
              total={steps.length}
              isNext={index === nextStepIndex}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>

        {/* Info Box */}
        {currentStep && (
          <div className="bg-input/30 border border-border/50 rounded-lg p-4 flex gap-4 items-start">
            <div className="bg-input/40 p-2 rounded-md shadow-sm border border-border/50 shrink-0">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-sm flex items-center gap-2">
                Passaggio {nextStepIndex + 1}: {currentStep.fullLabel}
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                  In corso
                </span>
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {getStepDescription(currentStep.label)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getStepDescription(label: string) {
  switch (label) {
    case 'Documenti': return "Carica i documenti aziendali richiesti per ottenere il tuo numero locale."
    case 'Telefono': return "Scegli un numero di telefono locale per il tuo assistente AI."
    case 'Voce': return "Personalizza la voce e il tono del tuo assistente."
    case 'Brand': return "Imposta logo e colori per un'esperienza coerente."
    case 'WhatsApp': return "Collega WhatsApp Business per le comunicazioni automatiche."
    default: return "Completa questo passaggio per procedere con l'attivazione."
  }
}
