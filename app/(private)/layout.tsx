import PrivateSidebar from "@/components/private/sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { createClient } from "@/supabase/server";
import { OrganizationProvider } from "@/components/providers/organization-provider";
import { LocationInitializer } from "@/components/private/location-initializer";
import { redirect } from "next/navigation";
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

  if (!user) {
    redirect('/login')
  }

  const { data: organizations } = await supabase.from("organizations").select("*").eq("created_by", user?.user?.id)

  const { data: locations } = await supabase.from("locations").select("*").in("organization_id", organizations?.map(o => o.id) || [])

  return (
    <SidebarProvider>
      <OrganizationProvider initialOrganization={organizations && organizations.length > 0 ? organizations[0] : null}>
        <LocationInitializer locations={locations} />
        <PrivateSidebar />
        <SidebarInset>
          <Navbar />
          {children}
        </SidebarInset>
      </OrganizationProvider>
    </SidebarProvider>
  );
}
