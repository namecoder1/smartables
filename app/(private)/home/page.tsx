import React from 'react'
import { OnboardingStatus } from '@/app/(private)/home/onboarding-status'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HelpCircle, Mail, MessageSquare, ExternalLink } from 'lucide-react'
import { ResourcesSection } from '@/app/(private)/home/resources-section'
import { getOnboardingStatus } from '@/actions/get-onboarding-status'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

const HomePage = async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch user's locations/organizations
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return <div>No Organization Found</div>
  }

  const { data: location } = await supabase
    .from('locations')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single()

  let onboardingData = {
    documents: false,
    phone: false,
    voice: false,
    branding: false,
    whatsapp: false
  }

  if (location) {
    onboardingData = await getOnboardingStatus(location.id)
  }

  return (
    <div className='min-h-screen p-6 space-y-8 anime-fade-in'>
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-border/40">
        <Greetings />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Onboarding & Resources */}
        <div className="lg:col-span-8 space-y-6">
          <section>
            <OnboardingStatus data={onboardingData} />
          </section>

          <section>
            <ResourcesSection />
          </section>
        </div>

        {/* Right Column: Support & Help */}
        <div className="lg:col-span-4 space-y-6 sticky top-6">
          <SupportSection />
        </div>
      </div>
    </div>
  )
}


const Greetings = () => {
  // We can add dynamic greeting based on time of day here if we want to be fancy,
  // but for now, let's keep it static but polished.
  return (
    <div className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Bentornato su Smartables
      </h1>
      <p className="text-muted-foreground text-base max-w-2xl">
        Ecco una panoramica delle attività del tuo ristorante.
      </p>
    </div>
  )
}

const SupportSection = () => {
  return (
    <Card className='border-border/60 shadow-sm bg-card h-fit'>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Centro Assistenza
        </CardTitle>
        <CardDescription>
          Hai bisogno di aiuto per la configurazione?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contact Options */}
        <div className="grid grid-cols-1 gap-3">
          <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 gap-3 bg-background hover:bg-muted/50" asChild>
            <Link href="#">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 flex items-center justify-center shrink-0">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <span className="font-semibold text-sm">Live Chat</span>
                <span className="text-xs text-muted-foreground font-normal">Parla con un esperto</span>
              </div>
            </Link>
          </Button>

          <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 gap-3 bg-background hover:bg-muted/50" asChild>
            <Link href="mailto:support@smartables.app">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4" />
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <span className="font-semibold text-sm">Email Support</span>
                <span className="text-xs text-muted-foreground font-normal">Risposta in 24h</span>
              </div>
            </Link>
          </Button>
        </div>

        <div className="h-px bg-border/50" />

        {/* FAQ Preview */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Domande Frequenti
          </h4>
          <ul className="space-y-2">
            {[
              "Come reimpostare la password?",
              "Guida alla verifica dell'account",
              "Gestione dei metodi di pagamento",
              "Aggiungere un nuovo membro nel team"
            ].map((item, i) => (
              <li key={i}>
                <Link href="#" className="flex items-center justify-between text-sm text-foreground/80 hover:text-primary transition-colors group py-1">
                  <span>{item}</span>
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}



export default HomePage