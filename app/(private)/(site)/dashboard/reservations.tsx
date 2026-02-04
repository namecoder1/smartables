"use client"

import React, { useState } from 'react'
import { BookingWithCustomer } from '@/types/components'
import ReservationsTable from '@/components/private/reservations-table'
import DetailsSheet from '@/components/private/details-sheet'

interface ReservationsProps {
  data: BookingWithCustomer[]
}

export function Reservations({ data }: ReservationsProps) {
  const [selectedBooking, setSelectedBooking] = useState<BookingWithCustomer | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const handleRowClick = (booking: BookingWithCustomer) => {
    setSelectedBooking(booking)
    setIsSheetOpen(true)
  }

  return (
    <>
      <ReservationsTable
        data={data}
        selectedBooking={selectedBooking}
        isSheetOpen={isSheetOpen}
        handleRowClick={handleRowClick}
      // Note: setOpen is for the "Add Reservation" sheet which we might not need here or can implement later if requested.
      // For now, leaving it undefined or passing a dummy if the table strictly required it (but we made it optional).
      />
      <DetailsSheet
        isSheetOpen={isSheetOpen}
        setIsSheetOpen={setIsSheetOpen}
        selectedBooking={selectedBooking}
      />
    </>
  )
}
