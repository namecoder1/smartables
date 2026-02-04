"use client"

import { useEffect, useState } from "react"
import { ChevronsUpDown, Plus } from "lucide-react"
import { useOrganization } from "@/components/providers/organization-provider"
import { useLocationStore } from "@/store/location-store"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Link from "next/link"
import { setLocationCookie } from "@/app/actions/set-location-cookie"
import { useRouter } from "next/navigation"

export const LocationsSwitcher = () => {
  const router = useRouter()
  const { organization } = useOrganization()
  const { locations, selectedLocationId, selectLocation } = useLocationStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Filter locations for the active organization
  const orgLocations = locations.filter(l => l.organization_id === organization?.id)

  if (!orgLocations || orgLocations.length === 0) return null

  const activeLocation = orgLocations.find(l => l.id === selectedLocationId) || orgLocations[0]
  const otherLocations = orgLocations.filter(l => l.id !== activeLocation?.id)

  // Safety check
  if (!activeLocation) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="w-full flex items-center gap-2 bg-background dark:bg-[#1e1e1e] p-3 border rounded-none border-border"
            >
              <div className="flex aspect-square size-9 items-center justify-center bg-[#FD9710] text-white">
                <div className="font-bold">
                  {activeLocation.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-foreground">{activeLocation.name}</span>
                <span className="truncate text-xs text-muted-foreground">Clicca per cambiare sede</span>
              </div>
              <ChevronsUpDown className="ml-auto" size={16} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className=" border min-w-56 w-full p-0 bg-background dark:bg-[#1e1e1e]"
            align="start"
            side="top"
            sideOffset={4}
          >
            {orgLocations.length > 1 ? (
              <div className="p-2">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Locations
                </div>
                {otherLocations.map((loc) => (
                  <div
                    key={loc.id}
                    className="flex cursor-pointer items-center gap-2 px-2 py-2 text-sm outline-none"
                    onClick={async () => {
                      selectLocation(loc.id)
                      await setLocationCookie(loc.id)
                      router.refresh()
                    }}
                  >
                    <div className="flex size-6 items-center justify-center border text-white">
                      {loc.name.charAt(0).toUpperCase()}
                    </div>
                    <span className='text-white'>{loc.name}</span>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="p-2">
              <Link
                href="/manage-activities"
                className="flex w-full cursor-pointer items-center gap-2 px-2 py-2 text-sm border border-transparent outline-none hover:bg-muted/40 hover:border-border"
              >
                <div className="flex size-6 items-center justify-center bg-[#FD9710]">
                  <Plus className="size-4" color="white" />
                </div>
                <div className="font-medium">Aggiungi sede</div>
              </Link>
            </div>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
