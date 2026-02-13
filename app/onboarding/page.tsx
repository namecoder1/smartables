import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingForm } from './onboarding-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Onboarding",
  description: "Onboarding",
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function OnboardingPage({ searchParams }: Props) {
  const params = await searchParams
  const plan = params.plan as string | undefined
  const interval = params.interval as string | undefined
  const error = params.error as string | undefined
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: organizations } = await supabase
    .from('organizations')
    .select('id')
    .eq('created_by', user.id)

  if (organizations && organizations.length > 0 && user.id !== '0a82970f-1fc5-4a52-97a1-a8613de0e3f7') redirect('/home')

  return (
    <div className="flex min-h-screen w-full">
      <OnboardingForm plan={plan} interval={interval} error={error} />
    </div>
  )
}


