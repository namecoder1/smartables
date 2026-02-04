"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ChevronRight } from "lucide-react"
import { routes, isRouteGroup, RouteEntry } from "@/lib/routes"

import {
  Sidebar,
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
import { LocationsSwitcher } from "./locations-switcher"

const PrivateSidebar = ({ className, ...props }: React.ComponentProps<typeof Sidebar>) => {
  const pathname = usePathname()

  // Combina tutte le routes in un unico array per la navigazione
  const allRoutes: RouteEntry[] = [...routes.platform, ...routes.organization]

  return (
    <Sidebar className={className} {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image src="/logo.png" alt="Logo" width={32} height={32} />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium text-foreground">Smartables</span>
                  <span className="text-xs text-muted-foreground">v1.0.0</span>
                </div>
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
        <LocationsSwitcher />
      </SidebarFooter>
    </Sidebar>
  )
}

export default PrivateSidebar