"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookingWithCustomer } from '@/types/components'
import ReservationsTable from '@/components/private/reservations-table'
import DetailsSheet from '@/components/private/details-sheet'
import ReservationSheet from '@/components/utility/reservation-sheet'

interface ReservationsProps {
  data: BookingWithCustomer[]
  context: 'default' | 'dashboard'
}

export function Reservations({ data, context }: ReservationsProps) {
  const router = useRouter()
  const [selectedBooking, setSelectedBooking] = useState<BookingWithCustomer | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isReservationSheetOpen, setIsReservationSheetOpen] = useState(false)
  const [bookingToEdit, setBookingToEdit] = useState<BookingWithCustomer | null>(null)

  const handleRowClick = (booking: BookingWithCustomer) => {
    setSelectedBooking(booking)
    setIsSheetOpen(true)
  }

  const handleEdit = (booking: BookingWithCustomer) => {
    setBookingToEdit(booking)
    setIsSheetOpen(false)
    setTimeout(() => {
      setIsReservationSheetOpen(true)
    }, 150)
  }

  const handleRefresh = () => {
    router.refresh()
  }

  return (
    <>
      <ReservationsTable
        data={data}
        context={context}
        selectedBooking={selectedBooking}
        isSheetOpen={isSheetOpen}
        handleRowClick={handleRowClick}
      />
      <DetailsSheet
        isSheetOpen={isSheetOpen}
        setIsSheetOpen={setIsSheetOpen}
        selectedBooking={selectedBooking}
        onEdit={handleEdit}
        onBookingDeleted={handleRefresh}
      />
      <ReservationSheet
        open={isReservationSheetOpen}
        onOpenChange={(isOpen) => {
          setIsReservationSheetOpen(isOpen)
          if (!isOpen) setBookingToEdit(null)
        }}
        onSuccess={handleRefresh}
        booking={bookingToEdit}
      />
    </>
  )
}
