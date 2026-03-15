import PageWrapper from '@/components/private/page-wrapper'
import React from 'react'
import KnowledgeBaseView from './knowledge-base-view'
import { getAuthContext } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'
import FaqSection from '@/components/private/faq-section'
import { BrainCog } from 'lucide-react'
import NoItems from '@/components/utility/no-items'
import { BASE_KB_CHARS_BY_TIER, DEFAULT_BASE_KB_CHARS } from '@/lib/addons'
import type { AddonConfig } from '@/types/general'
import { getFaqsByTopic } from '@/utils/sanity/queries'

const BotMemory = async () => {
  const { organizationId } = await getAuthContext()
  const supabase = await createClient()

  const [{ data: locations }, { data: org }, { data: kbEntries }] = await Promise.all([
    supabase.from('locations').select('id').eq('organization_id', organizationId).limit(1),
    supabase.from('organizations').select('billing_tier, addons_config').eq('id', organizationId).single(),
    supabase.from('knowledge_base').select('title, content').eq('organization_id', organizationId),
  ])

  const locationId = locations?.[0]?.id || ''
  const billingTier: string = org?.billing_tier ?? 'starter'
  const addonsConfig: AddonConfig = org?.addons_config ?? {
    extra_staff: 0, extra_contacts_wa: 0, extra_storage_mb: 0,
    extra_locations: 0, extra_kb_chars: 0, extra_analytics: 0,
  }

  const baseKbChars = BASE_KB_CHARS_BY_TIER[billingTier] ?? DEFAULT_BASE_KB_CHARS
  const kbCharsLimit = baseKbChars + addonsConfig.extra_kb_chars
  const kbCharsUsed = (kbEntries ?? []).reduce(
    (sum, e) => sum + (e.title?.length ?? 0) + (e.content?.length ?? 0), 0,
  )

  const [memoryFaqs] = await Promise.all([
    getFaqsByTopic('ai')
  ])

  return (
    <KnowledgeBaseView
      organizationId={organizationId}
      locationId={locationId}
      kbCharsLimit={kbCharsLimit}
      initialKbCharsUsed={kbCharsUsed}
      faqs={memoryFaqs}
    />
  )
}

export default BotMemory
