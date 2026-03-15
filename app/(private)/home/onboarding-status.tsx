'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, ArrowRight, Circle, Clock, Phone, AlertCircle, Loader2, LayoutGrid, Smartphone, ChevronRight, BrainCog } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getOnboardingStatus, OnboardingData } from '@/actions/get-onboarding-status'
import { useRouter } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
import { FeatureStatus } from '@/actions/get-feature-status'
import Link from 'next/link'
import { Layout, Users, PhoneForwarded, Settings, Map, FileStack, Sparkles, CheckCircle2, PhoneIncoming, CalendarCheck, UtensilsCrossed } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface OnboardingStatusProps {
  initialData: OnboardingData;
  locationId: string | null;
  featureStatus: FeatureStatus;
  userName?: string;
}

export function OnboardingStatus({ initialData, locationId, featureStatus, userName }: OnboardingStatusProps) {
  const router = useRouter()
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(initialData);
  const supabase = createClient();

  useEffect(() => {
    if (!locationId) return;

    const channel = supabase
      .channel(`onboarding_status_${locationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "locations",
          filter: `id=eq.${locationId}`,
        },
        async () => {
          const newData = await getOnboardingStatus(locationId);
          setOnboardingData(newData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [locationId, supabase]);

  const steps = [
    { id: 'docs', label: 'Documenti Aziendali', description: 'Carica la visura e i documenti del legale rappresentante.', link: '/compliance', completed: onboardingData.documents, time: '2 min' },
    { id: 'phone', label: 'Acquisto Numero', description: 'Scegli il numero fisso o mobile per il tuo ristorante.', link: '/onboarding/phone', completed: onboardingData.phone, time: '1 min' },
    { id: 'voice', label: 'Verifica Vocale', description: 'Rispondi alla chiamata automatica per verificare il numero.', link: '/onboarding/voice', completed: onboardingData.voice, time: '2 min' },
    { id: 'brand', label: 'Personalizzazione', description: 'Imposta logo, colori e nome del tuo assistente.', link: '/whatsapp-management', completed: onboardingData.branding, time: '5 min' },
    { id: 'test', label: 'Test Finale', description: 'Invia un messaggio di prova per assicurarti che tutto funzioni.', link: '/onboarding/test', completed: onboardingData.test, time: '1 min' },
  ]

  const completedCount = steps.filter(s => s.completed).length
  const totalSteps = steps.length
  const progress = Math.min(100, Math.round((completedCount / totalSteps) * 100))

  const nextStepIndex = steps.findIndex(s => !s.completed)

  // Setup complete — HomeView handles the full dashboard state
  if (onboardingData.activationStatus === "verified" && onboardingData.test) {
    return null;
  }

  return (
    <Card className="border-2 shadow-sm py-0 gap-0 space-y-0">
      <CardHeader className="bg-muted/20 border-b-2 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Ciao, {userName || "Utente"} 👋
            </h1>
            <CardDescription className="text-base font-medium">Completa questi passaggi per attivare l'assistente AI.</CardDescription>
          </div>
          <div className="flex items-center gap-4 min-w-50">
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
                    <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center border border-green-200">
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
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                        {step.description}
                      </p>

                      {step.id === 'docs' && onboardingData.rejectionReason && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex gap-3 items-start animate-in fade-in zoom-in-95 duration-300">
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                          <div className="space-y-1 text-left">
                            <p className="text-xs font-bold text-red-800">Documenti Rifiutati da Telnyx</p>
                            <p className="text-xs text-red-700 leading-relaxed font-medium">{onboardingData.rejectionReason}</p>
                            <Button
                              variant="link"
                              className="h-auto p-0 text-red-800 hover:text-red-900 text-xs font-bold underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(step.link);
                              }}
                            >
                              Carica di nuovo i documenti
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Active Step Actions */}
                  {isActive && (
                    <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-4">
                        {step.id === 'voice' && (onboardingData.activationStatus === 'pending' || onboardingData.activationStatus === 'provisioning' || onboardingData.activationStatus === 'purchasing') ? (
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

const DashboardReadyState = ({ featureStatus, userName }: { featureStatus: FeatureStatus; userName?: string }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary/95 via-primary to-primary p-8 text-white xl:p-10 border-2 border-primary/20">
        <div className="absolute rounded-full top-0 right-0 -mr-16 -mt-16 h-64 w-64 bg-white/30 blur-3xl" />
        <div className="absolute rounded-full bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 bg-primary-foreground/20 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-bold uppercase tracking-wider text-primary-foreground/80">Benvenuto su Smartables</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight mb-3">
            Ciao, {userName || "Tobia"} 
          </h1>
          <p className="text-lg xl:text-xl text-primary-foreground/90 max-w-2xl font-medium leading-relaxed">
            Il tuo assistente è pronto. Oggi hai tutto sotto controllo per gestire al meglio il tuo ristorante.
          </p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatSummaryCard
          title="Stato Sistema"
          value="Attivo & Online"
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="green"
          description="Bot pronto per le chiamate"
        />
        <StatSummaryCard
          title="Chiamate Ricevute"
          value="0"
          icon={<PhoneIncoming className="w-5 h-5" />}
          color="blue"
          description="Totale chiamate di oggi"
        />
        <StatSummaryCard
          title="Prenotazioni"
          value="0"
          icon={<CalendarCheck className="w-5 h-5" />}
          color="amber"
          description="Gestite automaticamente"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Feature Completion Checklist */}
        <Card className="border-2 shadow-sm h-full py-0 gap-0">
          <CardHeader className="border-b-2 bg-muted/20 py-5 flex justify-between items-center gap-3">
            <CardTitle className="text-xl font-bold tracking-tight">Checklist Setup</CardTitle>
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/70 border-2 px-3 py-1 rounded-full">
              {(((featureStatus.hasMenu ? 1 : 0) + (featureStatus.hasFloors ? 1 : 0) + (featureStatus.hasTables ? 1 : 0)) / 3 * 100).toFixed(0)}%
            </div>
          </CardHeader>

          <div className="grid gap-2 p-2">
            <FeatureTaskCard
              completed={featureStatus.hasMenu}
              label="Crea il tuo Menu"
              description="Aggiungi i tuoi piatti per l'AI"
              link="/menus-management"
              icon={<UtensilsCrossed className="w-5 h-5" />}
              color="orange"
            />
            <FeatureTaskCard
              completed={featureStatus.hasFloors}
              label="Configura Sale"
              description="Definisci le aree del ristorante"
              link="/areas-management"
              icon={<Map className="w-5 h-5" />}
              color="blue"
            />
            <FeatureTaskCard
              completed={featureStatus.hasTables}
              label="Aggiungi Tavoli"
              description="Posiziona i tavoli sulle mappe"
              link="/areas-management"
              icon={<LayoutGrid className="w-5 h-5" />}
              color="indigo"
            />
          </div>
        </Card>

        {/* Next Steps & Settings */}
        <div className="space-y-8">
          <Card className="border-2 shadow-sm h-full py-0 gap-0">
            <CardHeader className='border-b-2 bg-muted/20 py-5 flex justify-between items-center gap-3'>
              <CardTitle className="text-xl font-bold tracking-tight">Prossimi Passi</CardTitle>
            </CardHeader>
            <div className="grid gap-2 p-2">
              {!featureStatus.hasTeam && (
                <ActionCard
                  title="Invita il tuo Team"
                  description="Collabora con i tuoi colleghi"
                  actionText="Invita"
                  link="/collaborators-management"
                  icon={<Users className="w-5 h-5" />}
                  color="purple"
                />
              )}
              <ActionCard
                title="Configura WhatsApp"
                description="Gestisci i flussi di messaggi"
                actionText="Vai"
                link="/bot-settings"
                icon={<Smartphone className="w-5 h-5" />}
                color="green"
              />
              <ActionCard
                title="Configura il bot"
                description="Gestisci la memoria del bot"
                actionText="Vai"
                link="/bot-memory"
                icon={<BrainCog className="w-5 h-5" />}
                color="green"
              />
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}

const StatSummaryCard = ({ title, value, icon, color, description }: { title: string; value: string; icon: React.ReactNode; color: 'green' | 'blue' | 'amber'; description: string }) => {
  const themes = {
    green: "bg-green-50 border-green-200/50 text-green-700",
    blue: "bg-blue-50 border-blue-200/50 text-blue-700",
    amber: "bg-amber-50 border-amber-200/50 text-amber-700",
  }
  const iconThemes = {
    green: "bg-green-500/10 text-green-600",
    blue: "bg-blue-500/10 text-blue-600",
    amber: "bg-amber-500/10 text-amber-600",
  }

  return (
    <Card className={cn("border-2 shadow-sm rounded-3xl overflow-hidden py-0", themes[color])}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn("p-2 rounded-xl", iconThemes[color])}>
            {icon}
          </div>
          <span className="text-sm font-bold opacity-80">{title}</span>
        </div>
        <div className="text-2xl font-black">{value}</div>
        <div className="text-xs font-bold opacity-70 mt-2">{description}</div>
      </CardContent>
    </Card>
  )
}

const FeatureTaskCard = ({ completed, label, description, link, icon, color }: { completed: boolean, label: string, description: string, link: string, icon: React.ReactNode, color: string }) => {
  return (
    <div className={cn(
      "group relative flex items-center justify-between p-3 rounded-2xl border-2 transition-all duration-300",
      completed
        ? "bg-card shadow-sm"
        : "bg-card border-card-foreground/5 shadow-xs hover:border-primary/30 hover:shadow-md"
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300",
          completed ? "bg-green-100 text-green-600 border-2 border-green-500" : "bg-primary/5 text-primary group-hover:scale-110"
        )}>
          {completed ? <Check className="h-6 w-6" /> : icon}
        </div>
        <div>
          <div className={cn("font-bold text-lg leading-tight", completed && "text-muted-foreground line-through")} style={{ textDecorationThickness: 2}}>
            {label}
          </div>
          <p className="text-sm text-muted-foreground font-medium leading-tight">
            {description}
          </p>
        </div>
      </div>
      {!completed && (
        <Button size="sm" className="rounded-xl font-bold shadow-lg" asChild>
          <Link href={link}>Configura</Link>
        </Button>
      )}
    </div>
  )
}

const ActionCard = ({ title, description, actionText, link, icon, color }: { title: string; description: string; actionText: string; link: string; icon: React.ReactNode; color: string }) => {
  return (
    <div className="flex items-center justify-between p-4 rounded-3xl bg-muted/40 border-2 hover:bg-muted transition-colors">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-2xl bg-white border shadow-sm flex items-center justify-center text-primary">
          {icon}
        </div>
        <div>
          <div className="font-bold text-sm leading-none mb-1">{title}</div>
          <div className="text-xs text-muted-foreground font-medium">{description}</div>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="font-bold hover:bg-card rounded-xl" asChild>
        <Link href={link}>{actionText}</Link>
      </Button>
    </div>
  )
}

const FeatureListItem = ({ completed, label, description, link }: { completed: boolean, label: string, description: string, link: string }) => {
  return (
    <div className="flex gap-4 items-start p-3 rounded-lg hover:bg-muted/30 transition-colors">
      <div className={cn(
        "mt-1 shrink-0 h-6 w-6 rounded-full flex items-center justify-center border",
        completed ? "bg-green-100 border-green-200 text-green-600" : "bg-muted border-muted-foreground/20 text-muted-foreground"
      )}>
        {completed ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className={cn("text-sm font-semibold", completed ? "text-muted-foreground line-through" : "text-foreground")}>
            {label}
          </span>
          {!completed && (
            <Button variant="link" size="sm" className="h-auto p-0 text-primary font-bold text-xs" asChild>
              <Link href={link}>Configura</Link>
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-tight">
          {description}
        </p>
      </div>
    </div>
  )
}
