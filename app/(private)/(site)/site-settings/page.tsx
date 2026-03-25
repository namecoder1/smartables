import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import SettingsView from './settings-view'
import PageWrapper from '@/components/private/page-wrapper'
import { getFaqsByTopic } from '@/utils/sanity/queries'

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

  const [settingsFaqs, generalFaqs] = await Promise.all([
    getFaqsByTopic('settings'),
    getFaqsByTopic('general')
  ])

  const faqs = [...settingsFaqs, ...generalFaqs]

  return (
    <PageWrapper>
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight">Impostazioni & Dettagli</h1>
        <p className="text-muted-foreground max-w-2xl">Gestisci le informazioni della tua sede, l&apos;identità visiva e la presenza digitale.</p>
      </div>
      <SettingsView
        locations={locations || []}
        faqs={faqs}
      />
    </PageWrapper>
  )
}

export default SettingsPage