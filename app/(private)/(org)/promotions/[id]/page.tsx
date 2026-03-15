import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PromotionEditView from './promotion-edit-view'

export const metadata = {
  title: "Promozione",
  description: "Crea o modifica una promozione.",
}

export const dynamic = 'force-dynamic'

export default async function PromotionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const isNew = id === 'new'
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

  // Fetch promotion if editing
  let promotion = null
  if (!isNew) {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      redirect('/promotions')
    }
    promotion = data
  }

  // Fetch locations and menus
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('organization_id', organizationId)

  const { data: menus } = await supabase
    .from('menus')
    .select('*')
    .eq('organization_id', organizationId)

  return (
    <PromotionEditView
      promotion={promotion}
      locations={locations || []}
      menus={menus || []}
      organizationId={organizationId}
      isNew={isNew}
    />
  )
}