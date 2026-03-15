import { Metadata } from 'next'
import AreasView from './areas-view'
import { getFaqsByTopic } from '@/utils/sanity/queries'
import { createClient } from '@/utils/supabase/server'
import { getAuthContext } from '@/lib/auth'
import { Organization } from '@/types/general'

export const metadata: Metadata = {
  title: 'Gestione sala',
  description: 'Gestisci le zone e i tavoli del tuo locale',
}

const ManageAreasPage = async () => {
  const supabase = await createClient()
  const { organization }: { organization: Organization } = await getAuthContext()

  const { data: subscriptionPlan } = await supabase
    .from('subscription_plans')
    .select('limits')
    .eq('stripe_price_id', organization.stripe_price_id)
    .single()

  console.log(organization.stripe_price_id)

  const [areasFaqs] = await Promise.all([
    getFaqsByTopic('areas')
  ])

  return (
    <AreasView faqs={areasFaqs} limits={subscriptionPlan?.limits} />
  )
}

export default ManageAreasPage