import { SidebarProvider } from "@/components/ui/sidebar";
import { createClient } from "@/supabase/server";
import { OrganizationProvider } from "@/components/providers/organization-provider";
import { LocationInitializer } from "@/components/private/location-initializer";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import Sidebar from "@/components/private/sidebar";
import Navbar from "@/components/private/navbar";

export const metadata = {
  title: {
    template: '%s | Smartables',
    default: 'Smartables'
  },
  description: 'Smartables is a platform for managing your activities and bookings.',
  openGraph: {
    title: {
      template: '%s | Smartables',
      default: 'Smartables'
    },
    description: 'Smartables is a platform for managing your activities and bookings.',
    type: 'website'
  }
}

export default async function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()

  // 1. Get User
  if (!user || !user.user) redirect('/login')
  if (user?.user?.id === '0a82970f-1fc5-4a52-97a1-a8613de0e3f7') redirect('/manage')

  // 2. Fetch Profile to get assigned organization (for staff)
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.user.id)
    .single()

  // 3. Fetch Organization (either created by user OR assigned to user)
  let query = supabase.from("organizations").select("*")

  if (profile?.organization_id) {
    query = query.eq("id", profile.organization_id)
  } else {
    query = query.eq("created_by", user.user.id)
  }

  const { data: organizations } = await query
  const { data: locations } = await supabase.from("locations").select("*").in("organization_id", organizations?.map(o => o.id) || [])

  return (
    <div className="fixed inset-0 h-full w-full">
      <SidebarProvider className="h-full w-full min-h-0" defaultOpen={true}>
        <OrganizationProvider
          initialOrganization={organizations && organizations.length > 0 ? organizations[0] : null}
        >
          <LocationInitializer locations={locations} />
          <div className="flex h-full w-full lg:p-4 lg:pl-2 bg-[#fcfaee] dark:bg-[#0a0a0a]">
            <Sidebar
              collapsible="none"
              className="hidden lg:flex bg-transparent border-none"
            />

            <div className="flex flex-1 flex-col h-full overflow-hidden">
              <Navbar className="bg-transparent border-none py-2 sm:py-0" />
              <main className="flex-1 overflow-y-auto bg-background border border-border lg:m-2 h-full">
                {children}
              </main>
              <Toaster richColors position="top-center" />
            </div>
          </div>
        </OrganizationProvider>
      </SidebarProvider>
    </div>
  );
}
