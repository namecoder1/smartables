import { createClient } from "@/utils/supabase/server"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subDays } from "date-fns"
import { cookies } from "next/headers"
import PageWrapper from "@/components/private/page-wrapper"
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

      if (profile.role !== "admin" && profile.role !== "owner" && profile.accessible_locations && profile.accessible_locations.length > 0) {
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
