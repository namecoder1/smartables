import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { decryptConnectors } from '@/lib/business-connectors'
import ConnectionsView from './connections-view'
import { getFaqsByTopic } from '@/utils/sanity/queries'

export const metadata: Metadata = {
  title: 'Connessioni',
  description: 'Gestisci le connessioni con servizi esterni'
}

const ConnectionsPage = async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role, accessible_locations')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return <div>No organization found</div>

  let locationsQuery = supabase
    .from('locations')
    .select('id, business_connectors')
    .eq('organization_id', profile.organization_id)
    .order('created_at')

  if (profile.role !== 'admin' && profile.role !== 'owner' && profile.accessible_locations?.length > 0) {
    locationsQuery = locationsQuery.in('id', profile.accessible_locations)
  }

  const { data: locations } = await locationsQuery
  const firstLocation = locations?.[0]

  if (!firstLocation) return <div>Nessuna sede trovata</div>

  let googleReviewUrl: string | null = null
  let googleCalendarConnected = false
  let googleCalendarId: string | null = null
  let googleCalendarName: string | null = null
  let theforkConnected = false
  let theforkRestaurantId: string | null = null

  if (firstLocation.business_connectors) {
    try {
      const connectors = decryptConnectors(firstLocation.business_connectors as string)
      googleReviewUrl = connectors.google_review_url ?? null
      googleCalendarConnected = !!connectors.google_calendar_access_token
      googleCalendarId = connectors.google_calendar_id ?? null
      googleCalendarName = connectors.google_calendar_name ?? null
      theforkConnected = !!connectors.thefork_api_key
      theforkRestaurantId = connectors.thefork_restaurant_id ?? null
    } catch {
      // Key not set or data corrupted — silently ignore
    }
  }

  const [connectionsFaqs] = await Promise.all([
    getFaqsByTopic('connections')
  ])

  return (
    <ConnectionsView
      faqs={connectionsFaqs}
      locationId={firstLocation.id}
      googleReviewUrl={googleReviewUrl}
      googleCalendarConnected={googleCalendarConnected}
      googleCalendarId={googleCalendarId}
      googleCalendarName={googleCalendarName}
      theforkConnected={theforkConnected}
      theforkRestaurantId={theforkRestaurantId}
    />
  )
}

export default ConnectionsPage
