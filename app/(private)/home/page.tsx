import React from 'react'
import { OnboardingStatus } from '@/app/(private)/home/onboarding-status'
import { getOnboardingStatus, type OnboardingData } from '@/actions/get-onboarding-status'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageSquare, Mail, ExternalLink, LifeBuoy } from 'lucide-react'
import { ResourcesSection } from '@/app/(private)/home/resources-section'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PageWrapper from '@/components/private/page-wrapper'

const HomePage = async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch user's locations/organizations
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, full_name, role, accessible_locations')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return <div>No Organization Found</div>
  }

  let locationQuery = supabase
    .from('locations')
    .select('id')
    .eq('organization_id', profile.organization_id)

  if (profile.role !== "admin" && profile.accessible_locations && profile.accessible_locations.length > 0) {
    locationQuery = locationQuery.in('id', profile.accessible_locations)
  }

  const { data: location } = await locationQuery.limit(1).single()

  let onboardingData: OnboardingData = {
    documents: false,
    phone: false,
    voice: false,
    branding: false,
    test: false,
    phoneNumber: null,
    activationStatus: "pending"
  }

  if (location) {
    onboardingData = await getOnboardingStatus(location.id)
  }

  return (
    <PageWrapper>
      {/* Header Banner */}
      <Greetings profile={profile} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Content (Onboarding) */}
        <div className="lg:col-span-8">
          <OnboardingStatus data={onboardingData} />
        </div>

        {/* Sidebar (Resources & Support) */}
        <div className="lg:col-span-4 space-y-6">
          <ResourcesSection />
          <SupportSection />
        </div>
      </div>
    </PageWrapper>
  )
}

const Greetings = ({ profile }: { profile: any }) => {
  const firstName = profile.full_name?.split(' ')[0] || "Utente"

  return (
    <div className='relative overflow-hidden rounded-xl xl:border-2 xl:py-6'>
      <div className="absolute inset-0 hidden xl:block">
        {/* Note: In a real app we'd use Next.js Image optimization, but for now standard img tag with object-cover works great */}
        <img src="/home.jpg" alt="Restaurant Background" className="w-full h-full object-cover opacity-20 dark:opacity-10" />
        <div className="absolute inset-0 bg-linear-to-t from-background/90 to-transparent" />
      </div>

      <div className="relative z-10 border-b pb-4 xl:border-none xl:pb-10 xl:p-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Ciao, {firstName}
        </h1>
        <p className="text-muted-foreground xl:mt-2 max-w-2xl text-lg">
          Benvenuto nella tua dashboard. Ecco cosa abbiamo in programma per oggi.
        </p>
      </div>
    </div>
  )
}

const SupportSection = () => {
  return (
    <Card className='border-2 shadow-sm py-0 gap-0'>
      <CardHeader className="py-6 border-b-2 bg-muted/20 flex items-center gap-3">
        <LifeBuoy className="w-5 h-5 text-muted-foreground" />
        <CardTitle className="text-lg font-semibold">
          Centro Assistenza
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className='grid grid-cols-1 2xl:grid-cols-2 gap-4'>
          <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 gap-3 border-2 bg-card hover:bg-muted/50" asChild>
            <Link href="#">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <div className="font-semibold text-sm">Live Chat</div>
                <div className="text-xs text-muted-foreground">Parla con un esperto</div>
              </div>
            </Link>
          </Button>

          <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 gap-3 border-2 bg-card hover:bg-muted/50" asChild>
            <Link href="mailto:support@smartables.app">
              <Mail className="h-5 w-5 text-purple-600" />
              <div className="text-left">
                <div className="font-semibold text-sm">Email Support</div>
                <div className="text-xs text-muted-foreground">Risposta in 24h</div>
              </div>
            </Link>
          </Button>
        </div>

        <div className="pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Domande Frequenti
          </h4>
          <ul className="space-y-2">
            {[
              "Come reimpostare la password?",
              "Guida alla verifica dell'account",
              "Gestione dei metodi di pagamento",
            ].map((item, i) => (
              <li key={i}>
                <Link href="#" className="flex items-center justify-between text-sm text-foreground/80 hover:text-primary transition-colors py-1">
                  <span>{item}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
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