"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ChevronRight, X, Pencil, Check } from "lucide-react"
import { routes, isRouteGroup, RouteEntry } from "@/lib/routes"
import { toggleStarredPage } from "@/app/actions/starred-pages"
import { useState, useEffect } from "react"

import {
  Sidebar as AppSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
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
import ComplianceAlert from "../utility/compliance-alert"

interface SidebarProps extends React.ComponentProps<typeof AppSidebar> {
  organizationId?: string
  activationStatus?: string
  managedAccountId?: string | null
  starredPages?: { id: string; url: string; title: string }[]
}

const Sidebar = ({ className, organizationId, activationStatus, managedAccountId, starredPages, ...props }: SidebarProps) => {
  const pathname = usePathname()
  const [isEditing, setIsEditing] = useState(false)

  // Combina tutte le routes in un unico array per la navigazione
  const allRoutes: RouteEntry[] = [...routes.platform, ...routes.organization]

  const activeGroup = allRoutes.find((route) =>
    isRouteGroup(route) && route.items.some((item) => pathname === item.url || pathname.startsWith(item.url + '/'))
  )

  const [openGroup, setOpenGroup] = useState<string | undefined>()

  useEffect(() => {
    setOpenGroup(undefined)
  }, [pathname])

  return (
    <AppSidebar className={className} {...props}>
      <SidebarHeader className="pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="py-8! pl-0! hover:bg-transparent" asChild>
              <Link href="/home">
                <div className="flex aspect-square size-12 items-center justify-center rounded-lg">
                  <Image src="/logo.png" alt="Logo" width={60} height={60} />
                </div>
                <p className="text-3xl text-white dark:text-foreground font-bold tracking-tighter">Smartables</p>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <LocationsSwitcher />
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="border-b-2 border-white/10">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/home' || pathname.startsWith('/home/')}>
                <Link href="/home">
                  <span className="font-medium text-white dark:text-foreground">Home</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        {starredPages && starredPages.length > 0 && (
          <SidebarGroup className="border-b-2 border-white/10">
            <div className="flex items-center justify-between mb-2 pr-2">
              <p className="text-md font-bold text-white dark:text-foreground tracking-tight">Preferiti</p>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-white/70 hover:text-white dark:text-foreground/70 dark:hover:text-foreground transition-colors"
              >
                {isEditing ? <Check size={14} /> : <Pencil size={14} />}
              </button>
            </div>
            <SidebarMenu>
              {starredPages.map((page) => (
                <SidebarMenuItem key={page.id} className="flex items-center">
                  <SidebarMenuButton asChild isActive={pathname === page.url || pathname.startsWith(page.url + '/')}>
                    <Link href={page.url}>
                      <span className="font-medium text-white dark:text-foreground">{page.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {isEditing && (
                    <SidebarMenuAction className="mt-1 mr-1 hover:bg-destructive" onClick={() => toggleStarredPage(page.title, page.url)}>
                      <X className="text-white dark:text-foreground" />
                    </SidebarMenuAction>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
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
                      isActive={pathname === entry.url || pathname.startsWith(entry.url + '/')}
                    >
                      <Link href={entry.url}>
                        <span className="font-medium text-white dark:text-foreground">{entry.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              }

              return (
                <Collapsible
                  key={idx}
                  asChild
                  open={entry.label === activeGroup?.label || openGroup === entry.label}
                  onOpenChange={(isOpen) => {
                    if (entry.label === activeGroup?.label) return
                    if (isOpen) setOpenGroup(entry.label)
                    else setOpenGroup(undefined)
                  }}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={entry.label} className="text-white dark:text-foreground">
                        <div className="flex items-center gap-2">
                          {entry.icon && <entry.icon className="text-white dark:text-foreground size-5" />}
                          <span className="font-medium text-white dark:text-foreground">{entry.label}</span>
                        </div>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-white dark:text-foreground!" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="border-none px-0">
                        {entry.items.map((item, itemIdx) => (
                          <SidebarMenuSubItem key={itemIdx}>
                            <SidebarMenuSubButton className="active:bg-primary/60" asChild isActive={pathname === item.url || pathname.startsWith(item.url + '/')}>
                              <Link href={item.url}>
                                <span className="text-white dark:text-foreground">{item.title}</span>
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
      <SidebarFooter className="w-full pb-0">

        {organizationId && activationStatus && (
          <div>
            <ComplianceAlert
              context="sidebar"
              status={activationStatus}
              managedAccountId={managedAccountId || null}
            />
          </div>
        )}
      </SidebarFooter>
    </AppSidebar>
  )
}

export default Sidebar