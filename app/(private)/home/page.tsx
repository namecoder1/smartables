import { redirect } from 'next/navigation'
import { subDays } from 'date-fns'
import { createClient } from '@/utils/supabase/server'
import { getOrganizationById } from '@/lib/queries/organizations'
import { getLocationsByOrg } from '@/lib/queries/locations'
import PageWrapper from '@/components/private/page-wrapper'
import { OnboardingStatus } from '@/app/(private)/home/onboarding-status'
import HomeView from '@/app/(private)/home/home-view'
import { ResourcesSection } from '@/app/(private)/home/resources-section'
import { getOnboardingStatus, type OnboardingData } from '@/actions/get-onboarding-status'
import { getFeatureStatus, type FeatureStatus } from '@/actions/get-feature-status'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home',
  description: 'Dashboard principale con panoramica delle attività recenti, stato dell\'onboarding e accesso rapido alle risorse.',
  openGraph: {
    title: 'Home',
    description: 'Dashboard principale con panoramica delle attività recenti, stato dell\'onboarding e accesso rapido alle risorse.',
  }
}

const HomePage = async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, full_name, role, accessible_locations')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return <div>Organizzazione non trovata.</div>

  const orgId = profile.organization_id
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString()

  // ── Parallel data fetching ───────────────────────────────────────────────
  const [
    org,
    locations,
    { data: bookings },
    { data: orders },
  ] = await Promise.all([
    getOrganizationById(supabase, orgId),

    getLocationsByOrg(supabase, orgId),

    supabase
      .from('bookings')
      .select('booking_time, guests_count, source, status')
      .eq('organization_id', orgId)
      .gte('booking_time', thirtyDaysAgo)
      .limit(1000),

    supabase
      .from('orders')
      .select('created_at, total_amount')
      .eq('organization_id', orgId)
      .gte('created_at', thirtyDaysAgo)
      .limit(1000),
  ])

  // Fetch plan limits using the org's price ID
  const { data: plan } = org?.stripe_price_id
    ? await supabase
        .from('subscription_plans')
        .select('limits')
        .eq('stripe_price_id', org.stripe_price_id)
        .single()
    : { data: null }

  // ── Primary location (role-aware) ────────────────────────────────────────
  let locationQuery = supabase
    .from('locations')
    .select('id')
    .eq('organization_id', orgId)

  if (profile.role !== 'admin' && profile.role !== 'owner' && profile.accessible_locations?.length > 0) {
    locationQuery = locationQuery.in('id', profile.accessible_locations)
  }

  const { data: primaryLocation } = await locationQuery.limit(1).single()

  // ── Onboarding + feature status ──────────────────────────────────────────
  let onboardingData: OnboardingData = {
    documents: false, phone: false, voice: false, branding: false, test: false,
    rejectionReason: null, phoneNumber: null, activationStatus: 'pending',
  }
  let featureStatus: FeatureStatus = {
    hasMenu: false, hasFloors: false, hasTables: false, hasTeam: false,
  }

  if (primaryLocation) {
    ;[onboardingData, featureStatus] = await Promise.all([
      getOnboardingStatus(primaryLocation.id),
      getFeatureStatus(primaryLocation.id, orgId),
    ])
  }

  const isActivated = onboardingData.activationStatus === 'verified' && onboardingData.test
  const firstName = profile.full_name?.split(' ')[0] || 'Utente'

  return (
    <PageWrapper>
      <div className="gap-6 items-start">
        <div className="space-y-6">
          {!isActivated ? (
            <OnboardingStatus
              initialData={onboardingData}
              locationId={primaryLocation?.id || null}
              featureStatus={featureStatus}
              userName={firstName}
            />
          ) : (
            <HomeView
              firstName={firstName}
              org={{
                slug: org?.slug ?? '',
                whatsapp_usage_count: org?.whatsapp_usage_count ?? 0,
                usage_cap_whatsapp: org?.usage_cap_whatsapp ?? 400,
                addons_config: org?.addons_config ?? null,
                billing_tier: org?.billing_tier ?? 'starter',
              }}
              bookings={bookings ?? []}
              orders={orders ?? []}
              featureStatus={featureStatus}
              resourcesSection={<ResourcesSection />}
            />
          )}
        </div>
      </div>
    </PageWrapper>
  )
}



export default HomePage
