"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ChevronRight } from "lucide-react"
import { adminRoutes, isRouteGroup, RouteEntry } from "@/lib/routes"

import {
  Sidebar as AppSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { logout } from "@/utils/supabase/actions"
import { Button } from "../ui/button"

const Sidebar = ({ className, ...props }: React.ComponentProps<typeof AppSidebar>) => {
  const pathname = usePathname()

  // Combina tutte le routes in un unico array per la navigazione
  const allRoutes: RouteEntry[] = [...adminRoutes]

  return (
    <AppSidebar className={className} {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/manage">
                <div className="flex aspect-square size-9 items-center justify-center rounded-lg">
                  <Image src="/logo.png" alt="Logo" width={40} height={40} />
                </div>
                <p className="text-2xl text-foreground font-bold tracking-tighter">Smartables</p>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {allRoutes.map((entry, idx) => {
              // Se è un link singolo (senza items)
              if (!isRouteGroup(entry)) {
                return (
                  <SidebarMenuItem key={idx}>
                    <SidebarMenuButton
                      tooltip={entry.label}
                      asChild
                      isActive={pathname === entry.url}
                    >
                      <Link href={entry.url}>
                        <entry.icon className="size-4" />
                        <span className="font-medium">{entry.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              }

              // Se è un gruppo collapsibile (con items)
              const hasActiveItem = entry.items.some((item) => pathname === item.url)

              return (
                <Collapsible
                  key={idx}
                  asChild
                  defaultOpen={true}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={entry.label}>
                        <span className="font-medium text-foreground">{entry.label}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-foreground!" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {entry.items.map((item, itemIdx) => (
                          <SidebarMenuSubItem key={itemIdx}>
                            <SidebarMenuSubButton asChild isActive={pathname === item.url}>
                              <Link href={item.url}>
                                <item.icon className="size-4" />
                                <span className="text-foreground">{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="w-full">
        <Button variant='destructive' onClick={logout} className='w-full hover:bg-destructive/90! hover:text-white!'>
          Logout
        </Button>
      </SidebarFooter>
    </AppSidebar>
  )
}

export default Sidebar