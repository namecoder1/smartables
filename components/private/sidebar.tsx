"use client"

import { BookCopy, BookDashed, Calendar, ChartSpline, CreditCard, Home, Inbox, ListTodo, LogOut, Search, Settings, Store, UserRound } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LocationsSwitcher } from "./locations-switcher"
import { logout } from "@/supabase/actions"
import { Button } from "../ui/button"
import { ModeToggle } from "../ui/mode-toggle"
import BalanceCard from "./balance-card"

const items = {
  platform: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Prenotazioni",
      url: "/reservations",
      icon: ListTodo,
    },
    {
      title: "Calendario",
      url: "/calendar",
      icon: Calendar,
    },
    {
      title: "Analisi",
      url: "/analytics",
      icon: ChartSpline,
    },
    {
      title: "Impostazioni",
      url: "/settings",
      icon: Settings,
    },
  ],
  organization: [
    {
      title: "Gestisci le attività",
      url: "/manage-activities",
      icon: Store,
    },
    {
      title: "Fatturazione",
      url: "/billing",
      icon: CreditCard,
    },
    {
      title: "Impostazioni generali",
      url: "/general-settings",
      icon: Settings,
    },
    {
      title: "Guida Veloce",
      url: "/faq",
      icon: BookCopy,
    }
  ],
}

const PrivateSidebar = () => {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader>
        <LocationsSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-md text-white border-b border-[#2F2F2F] pb-2 rounded-none">
            Piattaforma
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu>
              {items.platform.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton size='md' asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-md text-white border-b border-[#2F2F2F] pb-2 rounded-none">
            Organizzazione
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu>
              {items.organization.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton size='md' asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="flex flex-col w-full items-center justify-center gap-2">
        <BalanceCard />
        <div className="flex flex-row w-full items-center justify-center gap-2">
          <form action={logout} className="w-1/2">
            <Button variant='destructive' type="submit" className="w-full">
              <LogOut />
              Logout
            </Button>
          </form>
          <ModeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

export default PrivateSidebar