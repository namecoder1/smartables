import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import TrialSidebar from '@/components/private/private-sidebar'
import TrialNavbar from '@/components/private/private-navbar'
import { OrganizationProvider } from '@/components/providers/organization-provider'
import { createClient } from '@/supabase/server'
import { redirect } from 'next/navigation'
import { LocationInitializer } from '@/components/private/location-initializer'

const TrialLayout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()

  if (!user || !user.user) redirect('/login')
  if (user?.user?.id === '0a82970f-1fc5-4a52-97a1-a8613de0e3f7') redirect('/manage')

  const { data: organizations } = await supabase.from("organizations").select("*").eq("created_by", user.user.id)
  const { data: locations } = await supabase.from("locations").select("*").in("organization_id", organizations?.map(o => o.id) || [])

  return (
    <div className="fixed inset-0 h-full w-full">
      <SidebarProvider className="h-full w-full min-h-0" defaultOpen={true}>
        <OrganizationProvider
          initialOrganization={organizations && organizations.length > 0 ? organizations[0] : null}
        >
          <LocationInitializer locations={locations} />
          <div className="flex h-full w-full p-2 gap-2 bg-background">
            <TrialSidebar
              collapsible="none"
              className="hidden lg:flex bg-transparent border-none"
            />

            <div className="flex flex-1 flex-col h-full overflow-hidden">
              <TrialNavbar className="bg-transparent border-none" />
              <main className="flex-1 overflow-y-auto bg-background border border-border p-8 shadow-sm m-2">
                {children}
              </main>
            </div>
          </div>
        </OrganizationProvider>
      </SidebarProvider>
    </div>
  )
}

export default TrialLayout