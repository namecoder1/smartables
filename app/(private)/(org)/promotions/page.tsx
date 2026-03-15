import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PromotionsView from './promotions-view'
import { getFaqsByTopic } from '@/utils/sanity/queries'

export const metadata = {
  title: "Promozioni",
  description: "Gestisci le promozioni per i tuoi menu e sedi.",
}

export const dynamic = 'force-dynamic'

export default async function PromotionsPage() {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()

  if (!user?.user) redirect('/login')

  // Get organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.user.id)
    .single()

  let orgQuery = supabase.from('organizations').select('id')
  if (profile?.organization_id) {
    orgQuery = orgQuery.eq('id', profile.organization_id)
  } else {
    orgQuery = orgQuery.eq('created_by', user.user.id)
  }
  const { data: orgs } = await orgQuery
  const organizationId = orgs?.[0]?.id
  if (!organizationId) redirect('/onboarding')

  // Fetch promotions with relations
  const { data: promotions } = await supabase
    .from('promotions')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  // Fetch locations and menus for scope display
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('organization_id', organizationId)

  const { data: menus } = await supabase
    .from('menus')
    .select('*')
    .eq('organization_id', organizationId)

  const [promoFaqs] = await Promise.all([
    getFaqsByTopic('promos')
  ])

  return (
    <PromotionsView
      promotions={promotions || []}
      locations={locations || []}
      menus={menus || []}
      organizationId={organizationId}
      faqs={promoFaqs}
    />
  )
}