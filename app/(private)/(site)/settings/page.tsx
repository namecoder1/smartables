import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import SettingsView from './settings'
import PageWrapper from '@/components/private/page-wrapper'

export const metadata: Metadata = {
  title: 'Impostazioni Sede'
}

const SettingsPage = async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role, accessible_locations')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return <div>No organization found</div>
  const organizationId = profile.organization_id

  let locationsQuery = supabase
    .from('locations')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at')

  if (profile.role !== "admin" && profile.accessible_locations && profile.accessible_locations.length > 0) {
    locationsQuery = locationsQuery.in('id', profile.accessible_locations)
  }

  const { data: locations } = await locationsQuery

  return (
    <PageWrapper>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Impostazioni</h1>
        <p className="text-muted-foreground">Gestisci le informazioni della tua sede, i suoi menu e le varie categorie e elementi.</p>
      </div>

      <SettingsView locations={locations || []} />
    </PageWrapper>
  )
}

export default SettingsPage