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
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return <div>No organization found</div>
  const organizationId = profile.organization_id

  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at')

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