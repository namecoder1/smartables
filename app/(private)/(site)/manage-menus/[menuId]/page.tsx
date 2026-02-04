import { createClient } from '@/supabase/server'
import { redirect, notFound } from 'next/navigation'
import MenuEditor from './menu-editor'

interface PageProps {
  params: Promise<{
    menuId: string
  }>
}

export default async function MenuPage({ params }: PageProps) {
  const { menuId } = await params
  const supabase = await createClient()

  // 1. Get User & Organization (Security check)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return redirect('/settings')

  // 2. Fetch Menu
  const { data: menu } = await supabase
    .from('menus')
    .select('*, menu_locations(location_id, locations(slug, name))')
    .eq('id', menuId)
    .eq('organization_id', profile.organization_id)
    .single()

  if (menu && menu.content) {
    // Ensure content is processed as array if needed or just pass it
    // Sorting is implicitly handled if we trust the array order, but let's be safe if we rely on sort_order prop
    // For now, raw json is fine.
  }

  if (!menu) return notFound()

  return (
    <MenuEditor menu={menu} organizationId={profile.organization_id} />
  )
}
