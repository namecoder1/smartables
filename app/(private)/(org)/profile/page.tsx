import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import ProfileView from './profile-view'

export const metadata: Metadata = {
  title: "Profilo",
  description: "Gestisci il tuo profilo",
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, organization_id, full_name, role, created_at, mailing_consent')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const profileData = {
    id: profile.id,
    full_name: profile.full_name,
    role: profile.role,
    created_at: profile.created_at,
    email: user.email || '',
    organization_id: profile.organization_id,
    mailing_consent: profile.mailing_consent ?? true,
  }

  return <ProfileView profile={profileData} />
}