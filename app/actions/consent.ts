'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { headers } from 'next/headers'

type ConsentPreferences = Partial<Record<'necessary' | 'measurement' | 'functionality' | 'marketing' | 'experience', boolean>>

export async function saveConsentRecord(preferences: ConsentPreferences): Promise<void> {
  try {
    const supabase = createAdminClient()
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') ?? null

    await supabase.from('consent_records').insert({
      preferences,
      user_agent: userAgent,
    })
  } catch {
    // Non-blocking — a consent record failure must never break the UI
  }
}
