"use client"

import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh"

export function DashboardRealtimeUpdater({ organizationId, locationId }: { organizationId: string, locationId?: string }) {
  // Listen for changes in bookings to update dashboard stats
  useRealtimeRefresh('bookings', {
    filter: locationId ? `location_id=eq.${locationId}` : `organization_id=eq.${organizationId}`
  })

  // Listen for changes in customers (for "Clienti di oggi" if needed, though they usually come with bookings)
  useRealtimeRefresh('customers', {
    filter: `organization_id=eq.${organizationId}`
  })

  return null
}
