import React from 'react'
import { createClient } from '@/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './settings-view'

const SettingsPage = async () => {
  const supabase = await createClient()

  // 1. Get User & Organization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    // Handle case where user has no org (shouldn't happen in this route usually if guarded)
    return <div>No organization found</div>
  }

  const organizationId = profile.organization_id

  // 2. Fetch Locations
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at')

  // 3. Fetch Menus (Deep)
  const { data: menus } = await supabase
    .from('menus')
    .select(`
      *,
      id,
      name,
      description,
      is_active,
      created_at,
      content,
      menu_locations(location_id, is_active)
    `)
    .eq('organization_id', organizationId)
    .order('created_at')

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Impostazioni</h1>
        <p className="text-muted-foreground">Gestisci le informazioni della tua sede, i suoi menu e le varie categorie e elementi.</p>
      </div>

      <SettingsClient
        locations={locations || []}
        menus={menus || []}
        organizationId={organizationId}
      />
    </div>
  )
}

export default SettingsPage