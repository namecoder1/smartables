import { createClient } from '@/supabase/server'
import { redirect } from 'next/navigation'
import Settings from './settings'
import { Metadata } from 'next'

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
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Impostazioni</h1>
        <p className="text-muted-foreground">Gestisci le informazioni della tua sede, i suoi menu e le varie categorie e elementi.</p>
      </div>

      <Settings locations={locations || []} />
    </div>
  )
}

export default SettingsPage