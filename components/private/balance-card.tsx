'use client'

import { useOrganization } from "@/components/providers/organization-provider"

const BalanceCard = () => {
  const { organization } = useOrganization()

  return (
    <div className="bg-neutral-700/50 border border-neutral-600 p-4 w-full">
      <div className="flex flex-row items-center justify-between gap-2">
        <h3 className="text-white font-semibold">Saldo</h3>
        <p className="text-white font-bold text-lg">{organization?.credits.toFixed(2)}€</p>
      </div>
    </div>
  )
}

export default BalanceCard