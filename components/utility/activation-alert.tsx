import React from 'react'
import { ActivationModal } from './activation-modal'
import { createClient } from '@/supabase/server'

const ActivationAlert = async () => {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: userData, error: userError } = await supabase
    .from('organizations')
    .select('activation_status')
    .eq('created_by', user.id)
    .single()

  if (userError) {
    console.error(userError)
    return null
  }

  if (userData?.activation_status === 'active') {
    return null
  }

  return (
    <div className="mb-8">
      <ActivationModal />
    </div>
  )
}

export default ActivationAlert