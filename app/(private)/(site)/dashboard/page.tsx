import ComplianceAlert from "@/components/utility/compliance-alert"
import { createClient } from "@/utils/supabase/server"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, formatDistanceToNow } from "date-fns"
import { SummaryCards } from "@/app/(private)/(site)/dashboard/summary-cards"
import { cookies } from "next/headers"
import { DonutPie } from "@/components/charts/donut-pie"
import { BookingProgressChart } from "@/components/charts/progress-bar"
import { it } from "date-fns/locale"
import { Reservations } from "@/app/(private)/(site)/dashboard/reservations"
import PageWrapper from "@/components/private/page-wrapper"
import { DashboardRealtimeUpdater } from "@/components/dashboard/dashboard-realtime-updater"
import { EmptyChartState } from "@/components/analytics/empty-chart-state"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export const metadata = {
  title: 'Dashboard',
  description: 'Dashboard',
}

export default async function DashboardPage() {
  const supabase = await createClient()
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
      activeLocationId = (await cookies()).get("smartables-location-id")?.value

      if (!activeLocationId && locations.length > 0) {
        activeLocationId = locations[0].id
      }

      const now = new Date()
      const todayStart = startOfDay(now).toISOString()
      const todayEnd = endOfDay(now).toISOString()
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString()
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString()

      let query = supabase
        .from('bookings')
        .select('*')
        .eq('organization_id', profile.organization_id)

      if (activeLocationId) {
        query = query.eq('location_id', activeLocationId)
      }

      const { data: weekData } = await query
        .gte('booking_time', weekStart)
        .lte('booking_time', weekEnd)

      bookingsThisWeek = weekData || []

      let allStatsQuery = supabase
        .from('bookings')
        .select('*')
        .eq('organization_id', profile.organization_id)

      if (activeLocationId) {
        allStatsQuery = allStatsQuery.eq('location_id', activeLocationId)
      }

      const { data: allBookingsData } = await allStatsQuery
        .gte('booking_time', new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString())
        .limit(2000)

      analysisBookings = allBookingsData || []

      const todayBookingsFiltered = bookingsThisWeek.filter(b =>
        b.booking_time >= todayStart && b.booking_time <= todayEnd
      )

      reservationsWeek = bookingsThisWeek.length
      reservationsToday = todayBookingsFiltered.length
      coversToday = todayBookingsFiltered.reduce((acc, curr) => acc + (curr.guests_count || 0), 0)
      todaysBookings = todayBookingsFiltered
    }
  }

  return (
    <PageWrapper className="bg-zinc-50/50 dark:bg-black/20">
      {organization && (
        <ComplianceAlert
          context="page"
          status={organization.activation_status || 'pending'}
          managedAccountId={locations.find(l => l.id === activeLocationId)?.telnyx_managed_account_id}
        />
      )}

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between xl:hidden">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Panoramica</h2>
            <p className="text-zinc-500 font-medium dark:text-zinc-400">Ecco come sta andando il tuo ristorante oggi.</p>
          </div>
        </div>

        <SummaryCards
          reservationsToday={reservationsToday}
          reservationsWeek={reservationsWeek}
          coversToday={coversToday}
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 items-start">

          {/* Main Chart - Bento Card */}
          <BentoCard className="col-span-4 min-h-[400px]" title="Andamento Settimanale" description={`${reservationsToday} prenotazioni oggi`}>
            <div className="mt-6 h-full w-full">
              {analysisBookings.length > 0 ? (
                <BookingProgressChart data={analysisBookings} />
              ) : (
                <EmptyChartState className="h-[300px] border-none bg-transparent" />
              )}
            </div>
          </BentoCard>

          {/* Today's Customers List - Bento Card */}
          <BentoCard className="col-span-3 min-h-[400px]" title="Ospiti di Oggi" description={`${todaysBookings.length} prenotazioni confermate`}>
            <div className="mt-6 space-y-2">
              {todaysBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-zinc-400" />
                  </div>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Nessuna prenotazione per oggi</p>
                </div>
              ) : (
                todaysBookings.map((booking) => (
                  <div key={booking.id} className="group flex items-center p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-default">
                    <Avatar className="h-10 w-10 border-2 border-white dark:border-zinc-800 shadow-sm">
                      <AvatarFallback className="bg-zinc-100 text-zinc-600 font-bold text-xs dark:bg-zinc-800 dark:text-zinc-300">
                        {booking.guest_name ? booking.guest_name.substring(0, 2).toUpperCase() : 'G'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-0.5">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-none">{booking.guest_name || "Ospite"}</p>
                      <p className="text-xs text-zinc-500 font-medium">
                        {formatDistanceToNow(new Date(booking.booking_time), { addSuffix: true, locale: it })}
                      </p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
                        {booking.guests_count} ps
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </BentoCard>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 items-start">
          <BentoCard className="col-span-3" title="Canali Acquisizione" description='Analizza le fonti delle prenotazioni'>
            <div className="mt-6">
              {analysisBookings.length > 0 ? (
                <DonutPie data={analysisBookings} />
              ) : (
                <EmptyChartState className="h-[250px] border-none bg-transparent" />
              )}
            </div>
          </BentoCard>

          <BentoCard className="col-span-4 h-full" title="Tutte le Prenotazioni" description='Visualizza tutte le tue prenotazioni'>
            <div className="mt-6">
              {analysisBookings.length > 0 ? (
                <Reservations data={analysisBookings} />
              ) : (
                <EmptyChartState className="h-[250px] border-none bg-transparent" />
              )}
            </div>
          </BentoCard>
        </div>
      </div>

      {profile && (
        <DashboardRealtimeUpdater
          organizationId={profile.organization_id}
          locationId={activeLocationId}
        />
      )}
    </PageWrapper>
  )
}

function BentoCard({ children, className, title, description }: { children: React.ReactNode, className?: string, title: string, description?: string }) {
  return (
    <div className={cn("rounded-3xl bg-card shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] border-2", className)}>
      <div className="space-y-1 border-b p-6 bg-muted/30">
        <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h3>
        {description && <p className="text-sm text-zinc-500 font-medium dark:text-zinc-400">{description}</p>}
      </div>
      <div className="p-6 sm:p-8 pt-0">
        {children}
      </div>
    </div>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
    </svg>
  )
}