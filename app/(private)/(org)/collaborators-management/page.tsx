import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import CollaboratorsView from './collaborators-view'
import { redirect } from 'next/navigation'
import { getFaqsByTopic } from '@/utils/sanity/queries'

const ManageCollaborators = async () => {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!currentUserProfile?.organization_id) {
    return <div>Organizzazione non trovata</div>
  }

  // Use admin client to bypass RLS that restricts viewing other profiles
  const { data: collaborators } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .eq('organization_id', currentUserProfile.organization_id)
    .order('created_at', { ascending: false })

  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .eq('organization_id', currentUserProfile.organization_id)
    .order('name')


  const [collaboratorsFaqs] = await Promise.all([
    getFaqsByTopic('collaborators')
  ])

  return (
    <CollaboratorsView
      collaborators={collaborators || []}
      user={user}
      organizationLocations={locations || []}
      faqs={collaboratorsFaqs}
    />
  )
}
export default ManageCollaborators