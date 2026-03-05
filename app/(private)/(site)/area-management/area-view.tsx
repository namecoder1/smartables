'use client'

import { DateNavigator } from '@/components/reservations/date-navigator';
import ReservationsFloorPlan from '@/components/reservations/reservations-floor-plan';
import { useLocationStore } from '@/store/location-store';
import { Booking } from '@/types/general';
import { Loader2 } from 'lucide-react';
import React from 'react'

const AreaView = () => {
  const { selectedLocationId } = useLocationStore()
  const [data, setData] = React.useState<Booking[] | null>(null)
  const [viewFilter, setViewFilter] = React.useState<'asc' | 'desc'>('desc')
  const [statusFilter, setStatusFilter] = React.useState<'pending' | 'confirmed' | 'cancelled' | 'all'>('all')
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date())

  const fetchData = React.useCallback(async () => {
    if (!selectedLocationId) return

    const params = new URLSearchParams()
    params.append('sort', viewFilter)
    params.append('location_id', selectedLocationId)
    if (statusFilter && statusFilter !== 'all') {
      params.append('status', statusFilter)
    }
    const response = await fetch(`/api/supabase/bookings?${params.toString()}`)
    const data = await response.json()
    setData(data)
  }, [viewFilter, statusFilter, selectedLocationId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  if (!selectedLocationId) return <div>Seleziona un locale</div>
  
  
  if (!data) return <div className="flex items-center justify-center p-10"><Loader2 className="animate-spin" /></div>


  return (
    <div>
      <DateNavigator date={selectedDate} setDate={setSelectedDate} variant='areas' />
      <ReservationsFloorPlan
        variant='reservations'
        locationId={selectedLocationId}
        selectedDate={selectedDate}
        bookings={data.filter(booking => {
          const bookingDate = new Date(booking.booking_time);
          return (
            bookingDate.getDate() === selectedDate.getDate() &&
            bookingDate.getMonth() === selectedDate.getMonth() &&
            bookingDate.getFullYear() === selectedDate.getFullYear()
          );
        })}
        onAssignmentChange={fetchData}
      />
    </div>
  )
}

export default AreaView