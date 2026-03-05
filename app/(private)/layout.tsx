import { SidebarProvider } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/server";
import { OrganizationProvider } from "@/components/providers/organization-provider";
import { LocationInitializer } from "@/components/private/location-initializer";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Sidebar from "@/components/private/sidebar";
import Navbar from "@/components/private/navbar";
import { getStarredPages } from "@/app/actions/starred-pages";
import RefundGate from "@/components/private/refund-gate";
import { PageTitleProvider } from "@/components/providers/page-title-context";
import { ThemeProvider } from "@/components/utility/theme-provider";

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
  if (user.user.app_metadata?.role === 'superadmin') redirect('/manage')

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

  if (!organizations || organizations.length === 0) {
    redirect('/onboarding')
  }
  const { data: locations } = await supabase
    .from("locations")
    .select("*, telnyx_regulatory_requirements:telnyx_regulatory_requirements!telnyx_regulatory_requirements_location_id_fkey(status)")
    .in("organization_id", organizations?.map((o) => o.id) || []);

  // Check if subscription was canceled (refunded) — gate user to billing only
  const isCanceled = organizations[0]?.stripe_status === "canceled"


  // Determine Active Location
  const cookieStore = await cookies()
  const activeLocationId = cookieStore.get("smartables-location-id")?.value
  const starredPages = await getStarredPages()

  return (
    <div className="fixed inset-0 h-full w-full">
      <SidebarProvider className="h-full w-full min-h-0" defaultOpen={true}>
        <OrganizationProvider
          initialOrganization={organizations && organizations.length > 0 ? organizations[0] : null}
        >
          <PageTitleProvider>
            <LocationInitializer locations={locations} activeLocationId={activeLocationId} />
            <div className="flex h-full w-full xl:p-4 xl:pt-0 xl:pl-2 bg-[#252525]">
              <Sidebar
                collapsible="none"
                className="hidden xl:flex bg-transparent"
                organizationId={organizations?.[0]?.id}
                activationStatus={locations?.[0]?.activation_status}
                managedAccountId={organizations?.[0]?.telnyx_managed_account_id}
                starredPages={starredPages}
                // @ts-ignore
                complianceStatus={locations?.[0]?.telnyx_regulatory_requirements?.status}
              />

              <div className="flex flex-1 flex-col h-full overflow-hidden xl:ml-2">
                <Navbar
                  className="bg-transparent"
                  organizationId={organizations?.[0]?.id}
                  activationStatus={locations?.[0]?.activation_status}
                  managedAccountId={organizations?.[0]?.telnyx_managed_account_id}
                  starredPages={starredPages}
                  // @ts-ignore
                  complianceStatus={locations?.[0]?.telnyx_regulatory_requirements?.status}
                />
                <main className="flex-1 overflow-y-auto border-2 xl:rounded-3xl bg-[#eeeeee] border-border h-full">
                  {isCanceled ? (
                    <RefundGate>{children}</RefundGate>
                  ) : (
                    children
                  )}
                </main>
              </div>
            </div>
          </PageTitleProvider>
        </OrganizationProvider>
      </SidebarProvider>
    </div>
  );
}
