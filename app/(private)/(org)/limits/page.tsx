import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import PageWrapper from '@/components/private/page-wrapper'
import LimitsView from './limits-view'
import { Metadata } from 'next'
import type { AddonConfig, PlanLimits } from '@/types/general'
import { getFaqsByTopic } from '@/utils/sanity/queries'

export const metadata: Metadata = {
  title: 'Limiti',
  description: 'Gestisci i limiti del tuo account',
}

export const dynamic = 'force-dynamic'

export type LimitsUsage = {
  staff: number
  locations: number
  menus: number
  zones: number
  bookings: number
  storageBytes: number
  contactsWa: number
  kbChars: number
}

const LimitsPage = async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return <div>Organizzazione non trovata.</div>

  const orgId = profile.organization_id

  // ── Fetch org fields ────────────────────────────────────────────────────────
  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_price_id, billing_tier, addons_config, usage_cap_whatsapp, whatsapp_usage_count, total_storage_used, current_billing_cycle_start')
    .eq('id', orgId)
    .single()

  // ── Fetch plan limits ───────────────────────────────────────────────────────
  const { data: plan } = org?.stripe_price_id
    ? await supabase
        .from('subscription_plans')
        .select('limits')
        .eq('stripe_price_id', org.stripe_price_id)
        .single()
    : { data: null }

  // ── Fetch all location IDs for zone/zone counting ───────────────────────────
  const { data: locationRows } = await supabase
    .from('locations')
    .select('id')
    .eq('organization_id', orgId)

  const locationIds = locationRows?.map(l => l.id) ?? []

  const cycleStart = org?.current_billing_cycle_start ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [
    { count: staffCount },
    { count: menuCount },
    { count: zoneCount },
    { count: bookingCount },
    { data: kbEntries },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('menus').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    locationIds.length > 0
      ? supabase.from('restaurant_zones').select('id', { count: 'exact', head: true }).in('location_id', locationIds)
      : Promise.resolve({ count: 0, data: null, error: null }),
    supabase.from('bookings').select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('booking_time', cycleStart),
    supabase.from('knowledge_base').select('title, content').eq('organization_id', orgId),
  ])

  const kbChars = (kbEntries ?? []).reduce(
    (sum, e) => sum + (e.title?.length ?? 0) + (e.content?.length ?? 0), 0,
  )

  const usage: LimitsUsage = {
    staff: staffCount ?? 0,
    locations: locationIds.length,
    menus: menuCount ?? 0,
    zones: zoneCount ?? 0,
    bookings: bookingCount ?? 0,
    storageBytes: org?.total_storage_used ?? 0,
    contactsWa: org?.whatsapp_usage_count ?? 0,
    kbChars,
  }

  const addonsConfig: AddonConfig = org?.addons_config ?? {
    extra_staff: 0,
    extra_contacts_wa: 0,
    extra_storage_mb: 0,
    extra_locations: 0,
    extra_kb_chars: 0,
    extra_analytics: 0,
  }

  const planLimits: PlanLimits | null = plan?.limits ?? null
  const billingTier: string = org?.billing_tier ?? 'starter'
  const effectiveWaCap: number = org?.usage_cap_whatsapp ?? 400
  const hasActiveSubscription = !!org?.stripe_price_id

  const addonPriceIds: Record<string, string | undefined> = {
    STRIPE_PRICE_ADDON_STAFF: process.env.STRIPE_PRICE_ADDON_STAFF,
    STRIPE_PRICE_ADDON_CONTACTS_WA: process.env.STRIPE_PRICE_ADDON_CONTACTS_WA,
    STRIPE_PRICE_ADDON_STORAGE: process.env.STRIPE_PRICE_ADDON_STORAGE,
    STRIPE_PRICE_ADDON_LOCATION: process.env.STRIPE_PRICE_ADDON_LOCATION,
    STRIPE_PRICE_ADDON_KB: process.env.STRIPE_PRICE_ADDON_KB,
    STRIPE_PRICE_ADDON_ANALYTICS: process.env.STRIPE_PRICE_ADDON_ANALYTICS,
  }

  const [limitsFaqs] = await Promise.all([
    getFaqsByTopic('limits')
  ])

  return (
    <PageWrapper>
      <LimitsView
        usage={usage}
        addonsConfig={addonsConfig}
        planLimits={planLimits}
        billingTier={billingTier}
        effectiveWaCap={effectiveWaCap}
        hasActiveSubscription={hasActiveSubscription}
        addonPriceIds={addonPriceIds}
        faqs={limitsFaqs}
      />
    </PageWrapper>
  )
}

export default LimitsPage
