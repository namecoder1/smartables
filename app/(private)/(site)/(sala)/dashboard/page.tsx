import ComplianceAlert from "@/components/utility/compliance-alert"
import { createClient } from "@/utils/supabase/server"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, formatDistanceToNow, subDays } from "date-fns"
import { SummaryCards } from "./summary-cards"
import { cookies } from "next/headers"
import { DonutPie } from "@/components/charts/donut-pie"
import { BookingProgressChart } from "@/components/charts/progress-bar"
import { it } from "date-fns/locale"
import { Reservations } from "./reservations"
import PageWrapper from "@/components/private/page-wrapper"
import { DashboardRealtimeUpdater } from "@/components/dashboard/dashboard-realtime-updater"
import { EmptyChartState } from "@/components/analytics/empty-chart-state"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { DateTimePicker } from "@/components/ui/datetime-picker"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { DateNavigator } from "@/components/reservations/date-navigator"
import { DateInput } from "@/components/ui/date-input"
import DashboardView from "./dashboard-view"

export const metadata = {
  title: 'Dashboard',
  description: 'Dashboard',
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const { from, to } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let organization = null
  let reservationsToday = 0
  let reservationsWeek = 0
  let coversToday = 0
  let todaysBookings: any[] = []
  let bookingsThisWeek: any[] = []
  let analysisBookings: any[] = []
  let analysisOrders: any[] = []
  let ordersAmount = 0
  let locations: any[] = []
  let profile: any = null
  let activeLocationId: string | undefined = undefined

  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('organization_id, role, accessible_locations')
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

      let locationsQuery = supabase
        .from('locations')
        .select('*')
        .eq('organization_id', profile.organization_id)

      if (profile.role !== "admin" && profile.accessible_locations && profile.accessible_locations.length > 0) {
        locationsQuery = locationsQuery.in('id', profile.accessible_locations)
      }

      const { data: locData } = await locationsQuery

      locations = locData || []
      activeLocationId = (await cookies()).get("smartables-location-id")?.value

      if (!activeLocationId && locations.length > 0) {
        activeLocationId = locations[0].id
      }

      const now = new Date()
      // Use local day boundaries for metrics logic
      const todayStart = startOfDay(now).toISOString()
      const todayEnd = endOfDay(now).toISOString()
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString()
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString()

      // Standardize date range to include full days for the dashboard analysis charts
      const defaultStart = subDays(now, 30).toISOString()
      const filterStart = from ? startOfDay(new Date(from)).toISOString() : defaultStart
      const filterEnd = to ? endOfDay(new Date(to)).toISOString() : endOfDay(now).toISOString()

      // Weekly stats query (for summary metrics)
      const { data: weekData } = await supabase
        .from('bookings')
        .select('*, customer:customers(*)')
        .eq('location_id', activeLocationId)
        .gte('booking_time', weekStart)
        .lte('booking_time', weekEnd)

      bookingsThisWeek = weekData || []

      // Period analysis query (Bookings)
      const { data: allBookingsData } = await supabase
        .from('bookings')
        .select('*, customer:customers(*)')
        .eq('location_id', activeLocationId)
        .gte('booking_time', filterStart)
        .lte('booking_time', filterEnd)
        .limit(3000)

      analysisBookings = allBookingsData || []

      // Period analysis query (Orders)
      const { data: allOrdersData } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('location_id', activeLocationId)
        .gte('created_at', filterStart)
        .lte('created_at', filterEnd)

      analysisOrders = allOrdersData || []

      // Totals for the specified range
      ordersAmount = analysisOrders.reduce((acc, curr) => acc + (curr.total_amount || 0), 0)

      // Filter for today's specific metrics using the same boundaries
      const todayBookingsFiltered = bookingsThisWeek.filter(b =>
        b.booking_time >= todayStart && b.booking_time <= todayEnd
      )

      reservationsWeek = bookingsThisWeek.length
      reservationsToday = todayBookingsFiltered.length
      coversToday = todayBookingsFiltered.reduce((acc: number, curr: any) => acc + (curr.guests_count || 0), 0)
      todaysBookings = todayBookingsFiltered
    }
  }

  return (
    <PageWrapper>
      <DashboardView
        organization={organization}
        reservationsToday={reservationsToday}
        reservationsWeek={reservationsWeek}
        coversToday={coversToday}
        todaysBookings={todaysBookings}
        analysisBookings={analysisBookings}
        analysisOrders={analysisOrders}
        profile={profile}
        activeLocationId={activeLocationId}
        ordersAmount={ordersAmount}
      />
    </PageWrapper>
  )
}

function BentoCard({ children, className, title, description, context }: { children: React.ReactNode, className?: string, title: string, description?: string, context: 'default' | 'compact' }) {
  return (
    <div className={cn("rounded-3xl bg-card shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] border-2", className)}>
      <div className="space-y-0.5 border-b-2 p-6 py-5 bg-muted/30">
        <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h3>
        {description && <p className="text-sm text-zinc-500 font-medium dark:text-zinc-400">{description}</p>}
      </div>
      <div className={cn("pt-0", context === 'compact' ? 'p-0 ' : 'px-6 py-6')}>
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