'use client'

import { useLocationStore } from "@/store/location-store"
import { useEffect, useRef } from "react"
import { setLocationCookie } from "@/app/actions/set-location-cookie"

export function LocationInitializer({ locations }: { locations: any[] | null }) {
  const setLocations = useLocationStore((state) => state.setLocations)
  const selectedLocationId = useLocationStore((state) => state.selectedLocationId)
  const initialized = useRef(false)

  if (!initialized.current && locations) {
    setLocations(locations)
    initialized.current = true
  }

  useEffect(() => {
    if (locations) {
      setLocations(locations)
    }
  }, [locations, setLocations])

  // Sync Cookie with Store
  useEffect(() => {
    if (selectedLocationId) {
      setLocationCookie(selectedLocationId)
    }
  }, [selectedLocationId])

  return null
}
