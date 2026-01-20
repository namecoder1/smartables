"use client"

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
            <SidebarMenuButton
              size="xl"
              className="data-[state=open]:bg-sidebar-accent bg-[#2F2F2F] border rounded-none border-[#2F2F2F] px-2"
            >
              <div className="flex aspect-square size-9 items-center justify-center bg-neutral-950/40 text-white">
                <div className="font-bold">
                  {activeLocation.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{activeLocation.name}</span>
                <span className="truncate text-xs text-neutral-400">{organization?.name}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] bg-[#2F2F2F] border border-[#2F2F2F] min-w-56 p-0"
            align="start"
            side="right"
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
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none"
                    onClick={async () => {
                      selectLocation(loc.id)
                      await setLocationCookie(loc.id)
                      router.refresh()
                    }}
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border text-white">
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
                className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none hover:bg-[#2F2F2F90] hover:text-white"
              >
                <div className="flex size-6 items-center justify-center rounded-md border border-neutral-600 bg-neutral-950/40">
                  <Plus className="size-4" color="white" />
                </div>
                <div className="font-medium text-white">Aggiungi sede</div>
              </Link>
            </div>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
