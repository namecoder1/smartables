import ComplianceAlert from "@/components/utility/compliance-alert"
import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, formatDistanceToNow } from "date-fns"
import { SummaryCards } from "@/app/(private)/(site)/dashboard/summary-cards"
// SimpleLine removed
import { cookies } from "next/headers"
import { DonutPie } from "@/components/charts/donut-pie"
import { BookingProgressChart } from "@/components/charts/progress-bar"
import { User } from "lucide-react"
import { it } from "date-fns/locale"
import { Reservations } from "@/app/(private)/(site)/dashboard/reservations"
import PageWrapper from "@/components/private/page-wrapper"
import { DashboardRealtimeUpdater } from "@/components/dashboard/dashboard-realtime-updater"
import { EmptyChartState } from "@/components/analytics/empty-chart-state"

export const metadata = {
  title: 'Dashboard',
  description: 'Dashboard',
  openGraph: {
    title: 'Dashboard',
    description: 'Dashboard',
    type: 'website'
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch Organization & Locations
  const { data: { user } } = await supabase.auth.getUser()


  let organization = null
  let reservationsToday = 0
  let reservationsWeek = 0
  let coversToday = 0
  let todaysBookings: any[] = []
  let bookingsThisWeek: any[] = []
  let analysisBookings: any[] = []
  let locations: any[] = []
  let profile: any = null
  let activeLocationId: string | undefined = undefined

  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    profile = profileData

    if (profile?.organization_id) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single()

      organization = orgData

      const { data: locData } = await supabase
        .from('locations')
        .select('*')
        .eq('organization_id', profile.organization_id)

      locations = locData || []


      // Determine Active Location
      activeLocationId = (await cookies()).get("smartables-location-id")?.value

      // If no cookie or cookie invalid (optional check), fallback to first location
      if (!activeLocationId && locations.length > 0) {
        activeLocationId = locations[0].id
      }

      // Date calculations
      const now = new Date()
      const todayStart = startOfDay(now).toISOString()
      const todayEnd = endOfDay(now).toISOString()
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString() // Monday start
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString()

      // Build query for Weekly Stats (and filtering today from it)
      let query = supabase
        .from('bookings')
        .select('*')
        .eq('organization_id', profile.organization_id)

      if (activeLocationId) {
        query = query.eq('location_id', activeLocationId)
      }

      // We need TWO queries:
      // 1. Data for "Reservations Today", "Weekly", "Covers" -> specific ranges
      // 2. Data for "Most Popular Times" -> broad range (e.g. all time or last 3 months) to get statistically significant "popular" times.
      // However, fetching EVERYTHING might be heavy. Let's fetch last 90 days for popular times.

      // Query 1: This Week (for summary cards)
      const { data: weekData, error: weekError } = await query
        .gte('booking_time', weekStart)
        .lte('booking_time', weekEnd)

      if (weekError) console.error("Week Query Error:", weekError)

      bookingsThisWeek = weekData || []
      // Let's create a separate query for this to avoid overriding restrictions
      let allStatsQuery = supabase
        .from('bookings')
        .select('*')
        .eq('organization_id', profile.organization_id)

      if (activeLocationId) {
        allStatsQuery = allStatsQuery.eq('location_id', activeLocationId)
      }

      // For peak times, maybe last 90 days is good enough? 
      // If the user said "voglio vedere i giorni in cui ci sono PIU prenotazioni" it implies finding trends.
      // Let's limit to recent history + future to be safe, or just "all time" with a reasonable limit.
      // Or just fetch all. Let's try fetching a larger batch for stats.
      const { data: allBookingsData } = await allStatsQuery
        .gte('booking_time', new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString()) // Last 2 months?
        // Actually, let's just fetch all for now, assuming small dataset, or limit to 1000
        .limit(2000)

      analysisBookings = allBookingsData || []


      // Calculate Metrics
      reservationsWeek = bookingsThisWeek.length

      const todayBookingsFiltered = bookingsThisWeek.filter(b =>
        b.booking_time >= todayStart && b.booking_time <= todayEnd
      )
      // Note: "weekData" might not explicitly capture "today" if "today" is Sunday and weekstart is Monday... wait.
      // startOfWeek(now, { weekStartsOn: 1 }) -> Monday.
      // If today is Sunday, it is part of this week. CORRECT.
      // BUT if we are checking "reservationsToday", we should probably ensure our "week query" covers today.
      // If today is Monday, weekStart is today.
      // So filtering from weekData is fine.

      // WAIT: If we want "Today's" bookings regardless of week logic details (edge cases),
      // we can just filter from analysisBookings if it covers today, OR just trust weekData.
      // Let's filter today from the specifically fetched week data to be consistent with "reservationsWeek".

      reservationsToday = todayBookingsFiltered.length
      coversToday = todayBookingsFiltered.reduce((acc, curr) => acc + (curr.guests_count || 0), 0)
      todaysBookings = todayBookingsFiltered

      // DEBUG: Fetch raw bookings for Org to check Location IDs
      const { data: debugRawBookings } = await supabase
        .from('bookings')
        .select('id, location_id, booking_time, guest_name')
        .eq('organization_id', profile.organization_id)
        .limit(5)
    }
  }

  return (
    <PageWrapper>
      {organization && (
        <ComplianceAlert
          context="page"
          status={organization.activation_status || 'pending'}
          managedAccountId={locations.find(l => l.id === activeLocationId)?.telnyx_managed_account_id}
        />
      )}
      <div className="space-y-6">
        <div className="xl:hidden flex items-start">
          <h2 className="text-2xl font-bold tracking-tighter">Dashboard</h2>
          <p className="text-muted-foreground">Panoramica sulle attvitià</p>
        </div>
        <SummaryCards
          reservationsToday={reservationsToday}
          reservationsWeek={reservationsWeek}
          coversToday={coversToday}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Metodi prenotazioni</CardTitle>
              <CardDescription>
                Analizza le fonti da cui arrivano i tuoi clienti
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysisBookings.length > 0 ? (
                <DonutPie data={analysisBookings} />
              ) : (
                <EmptyChartState className="h-[250px] border-none bg-transparent" />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>I clienti di oggi</CardTitle>
              <CardDescription>
                Riepilogo delle prenotazioni odierne
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                {todaysBookings.length === 0 ? (
                  <EmptyChartState
                    message="Nessuna prenotazione per oggi."
                    className="h-[250px] border-none bg-transparent"
                  />
                ) : (
                  todaysBookings.map((booking) => (
                    <Card key={booking.id} className="mb-4 py-4 bg-background">
                      <CardHeader className="flex items-center gap-3 px-4">
                        <div className="bg-neutral-200/40 border dark:bg-neutral-800 w-fit p-2">
                          <User />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {booking.guest_name || "Ospite"}
                          </CardTitle>
                          <CardDescription>
                            {formatDistanceToNow(new Date(booking.booking_time), { addSuffix: true, locale: it })} • {booking.guests_count} persone
                          </CardDescription>
                        </div>
                      </CardHeader>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Giorni & orari più affollati</CardTitle>
              <CardDescription>
                Statistiche sui momenti di maggiore affluenza
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysisBookings.length > 0 ? (
                <BookingProgressChart data={analysisBookings} />
              ) : (
                <EmptyChartState className="h-[250px] border-none bg-transparent" />
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dettagli prenotazioni</CardTitle>
            <CardDescription>
              Lista dettagliata delle ultime prenotazioni
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analysisBookings.length > 0 ? (
              <Reservations data={analysisBookings} />
            ) : (
              <EmptyChartState className="h-[250px] border-none bg-transparent" />
            )}
          </CardContent>
        </Card>
      </div>
      <DashboardRealtimeUpdater
        organizationId={profile.organization_id}
        locationId={activeLocationId}
      />
    </PageWrapper>
  )
}