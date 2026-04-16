'use client'

import { useLocationStore } from "@/store/location-store"
import { useEffect } from "react"
import { setLocationCookie } from "@/app/actions/set-location-cookie"

import { useRouter } from "next/navigation"

export function LocationInitializer({ locations, activeLocationId }: { locations: any[] | null, activeLocationId?: string }) {
  const router = useRouter()
  const setLocations = useLocationStore((state) => state.setLocations)
  const selectedLocationId = useLocationStore((state) => state.selectedLocationId)
  useEffect(() => {
    if (locations) {
      setLocations(locations)
    }
  }, [locations, setLocations])

  // Sync Cookie with Store
  useEffect(() => {
    if (selectedLocationId) {
      setLocationCookie(selectedLocationId)

      // If server rendered with a different location, refresh to sync
      if (activeLocationId && activeLocationId !== selectedLocationId) {
        router.refresh()
      } else if (!activeLocationId) {
        // If server had no location (first load), refresh to set it
        router.refresh()
      }
    }
  }, [selectedLocationId, activeLocationId, router])

  return null
}
