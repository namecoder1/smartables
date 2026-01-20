import { submitOnboarding } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WeeklyHoursSelector } from '@/components/utility/weekly-hours-selector'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { createClient } from '@/supabase/server'
import { redirect } from 'next/navigation'
import { Store, MapPin, Info } from 'lucide-react'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: organizations } = await supabase
    .from('organizations')
    .select('id')
    .eq('created_by', user.id)

  if (organizations && organizations.length > 0) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50/50 p-4 dark:bg-gray-900/50">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* Info Box for Multi-location context */}
        <div className="flex items-start gap-4 rounded-lg border border-blue-100 bg-blue-50/50 p-4 text-blue-900 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="space-y-1">
            <p className="font-medium">Hai piu di una sede?</p>
            <p className="text-sm opacity-90">
              Inserisci i dettagli essenziali del tuo ristorante principale.
              Se hai piu di una sede, puoi facilmente aggiungere altre locazioni in seguito.
            </p>
          </div>
        </div>

        <Card className="border-none shadow-xl ring-1 ring-gray-900/5 dark:ring-white/10">
          <CardHeader className="space-y-1 text-center sm:text-left">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Crea il tuo profilo del ristorante
            </CardTitle>
            <CardDescription className="text-base">
              Inserisci i dettagli essenziali del tuo ristorante principale.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-8" action={submitOnboarding}>
              
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="restaurantName" className="text-sm font-medium">
                    Nome del ristorante
                  </Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 will-change-transform dark:text-gray-400" />
                    <Input
                      id="restaurantName"
                      name="restaurantName"
                      placeholder="e.g. La Bella Vita"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">
                    Indirizzo
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 will-change-transform dark:text-gray-400" />
                    <Input
                      id="address"
                      name="address"
                      placeholder="e.g. Via Roma, 123, Roma"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border bg-gray-50/50 p-4 dark:bg-gray-800/50">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Orari di Apertura</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Inserisci i tuoi orari di apertura settimanali.
                  </p>
                </div>
                <WeeklyHoursSelector context="onboarding" />
              </div>

              <div className="pt-2">
                <Button className="w-full text-base font-medium shadow-md transition-all hover:shadow-lg sm:w-fit" size="lg" type="submit">
                  Completa il setup
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

