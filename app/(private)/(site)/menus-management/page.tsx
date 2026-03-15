import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import MenusView from './menus-view'
import { getFaqsByTopic } from '@/utils/sanity/queries'

export const metadata: Metadata = {
  title: 'Gestisci Menu',
  description: 'Gestisci i menu del tuo ristorante',
}

const ManageMenus = async () => {
  const supabase = await createClient()

  // 1. Get User & Organization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role, accessible_locations')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return <div>No organization found</div>
  const organizationId = profile.organization_id

  // 2. Fetch Locations
  let locationsQuery = supabase
    .from('locations')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at')

  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_price_id')
    .eq('id', organizationId)
    .single()


  if (profile.role !== "admin" && profile.accessible_locations && profile.accessible_locations.length > 0) {
    locationsQuery = locationsQuery.in('id', profile.accessible_locations)
  }

  const { data: locations } = await locationsQuery

  // 3. Fetch Menus (Deep)
  const { data: menus } = await supabase
    .from('menus')
    .select(`
      *,
      id,
      name,
      description,
      is_active,
      created_at,
      content,
      menu_locations(location_id, is_active, daily_from, daily_until)
    `)
    .eq('organization_id', organizationId)
    .order('created_at')

  const { data: subscriptionPlan } = await supabase
    .from('subscription_plans')
    .select('limits')
    .eq('stripe_price_id', org?.stripe_price_id)
    .single()

  const [menuFaqs] = await Promise.all([
    getFaqsByTopic('menus')
  ])

  return (
    <MenusView menus={menus as any} limits={subscriptionPlan?.limits} organizationId={organizationId} locations={locations || []} faqs={menuFaqs} />
  )
}

export default ManageMenus