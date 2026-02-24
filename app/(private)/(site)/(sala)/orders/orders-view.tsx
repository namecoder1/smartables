'use client'

import OrdersList from '@/components/orders/orders-list'
import { Button } from '@/components/ui/button'
import { useLocationStore } from '@/store/location-store'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const OrdersView = () => {
  const { selectedLocationId } = useLocationStore()

  if (!selectedLocationId) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
  }

  return (
      <OrdersList locationId={selectedLocationId} />
  )
}

export default OrdersView