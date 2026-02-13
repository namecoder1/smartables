import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import PageWrapper from '@/components/private/page-wrapper'
import MenusView from '@/app/(private)/(site)/manage-menus/menus-view'

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
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return <div>No organization found</div>
  const organizationId = profile.organization_id

  // 2. Fetch Locations
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at')

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
      menu_locations(location_id, is_active)
    `)
    .eq('organization_id', organizationId)
    .order('created_at')

  return (
    <MenusView menus={menus as any} organizationId={organizationId} locations={locations || []} />
  )
}

export default ManageMenus