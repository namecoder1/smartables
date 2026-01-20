'use client'

import { useOrganization } from "@/components/providers/organization-provider"
import { useEffect } from "react"

interface OrganizationPartial {
  id: string
  credits: number
  [key: string]: any
}

export function BalanceUpdater({ organization }: { organization: OrganizationPartial }) {
  const { organization: currentOrg, setOrganization } = useOrganization()

  useEffect(() => {
    if (!organization || !currentOrg) return

    // Only update if credits are different to avoid loops/unnecessary updates
    if (Number(currentOrg.credits) !== Number(organization.credits)) {
      setOrganization({ ...currentOrg, ...organization, credits: Number(organization.credits) })
    }
  }, [organization, currentOrg, setOrganization])

  return null
}
