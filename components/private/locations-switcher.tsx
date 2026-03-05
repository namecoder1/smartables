"use client"

import { useEffect, useState } from "react"
import { ChevronsUpDown, Plus } from "lucide-react"
import { useOrganization } from "@/components/providers/organization-provider"
import { useLocationStore } from "@/store/location-store"
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Link from "next/link"
import { setLocationCookie } from "@/app/actions/set-location-cookie"
import { useRouter } from "next/navigation"
import Image from "next/image"

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

  console.log(activeLocation.branding?.logo_url)

  return (
    <SidebarMenuItem>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="w-full flex items-center gap-2 bg-card/10 p-3 border-2 rounded-xl border-border/10"
          >
            {activeLocation.branding?.logo_url ? (
              <div className="border rounded-lg">
                <Image src={activeLocation.branding.logo_url} alt={activeLocation.name} width={36} height={36} className="rounded-md bg-white" />
              </div>
            ) : (
              <div className="flex aspect-square rounded-lg size-9 items-center justify-center bg-[#FD9710] text-white">
                <div className="font-bold">
                  {activeLocation.name.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold text-white">{activeLocation.name}</span>
              <span className="truncate text-xs text-white/70">Clicca per cambiare sede</span>
            </div>
            <ChevronsUpDown className="ml-auto text-white" size={16} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="border border-border/20  min-w-56 w-full p-0 bg-[#3B3B3B]"
          align="center"
          side="right"
          sideOffset={4}
        >
          {orgLocations.length > 1 ? (
            <div className="p-2">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Le tue sedi
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
                  {loc.branding?.logo_url ? (
                    <div className="border rounded-lg">
                      <Image src={loc.branding.logo_url} alt={loc.name} width={36} height={36} className="rounded-md bg-white" />
                    </div>
                  ) : (
                    <div className="flex aspect-square rounded-lg size-9 items-center justify-center bg-[#FD9710] text-white">
                      <div className="font-bold">
                        {loc.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                  <span className='text-white'>{loc.name}</span>
                </div>
              ))}
            </div>
          ) : null}
          <div className="p-2">
            <Link
              href="/manage-activities"
              className="flex w-full cursor-pointer rounded-lg items-center gap-2 p-3 text-sm border border-transparent outline-none hover:bg-[#3B3B3B] hover:border-border/20"
            >
              <div className="flex rounded-md size-6 items-center justify-center bg-[#FD9710]">
                <Plus className="size-4" color="white" />
              </div>
              <div className="font-medium text-white">Aggiungi sede</div>
            </Link>
          </div>
        </PopoverContent>
      </Popover>
    </SidebarMenuItem>
  )
}
