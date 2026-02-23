"use client"

import React from 'react'
import ReservationSheet from '@/components/utility/reservation-sheet'
import {
  ButtonGroup,
} from "@/components/ui/button-group"
import { Button } from '@/components/ui/button'
import {
  ClockFading,
  ListFilterIcon,
  TicketCheck,
  TicketX,
  UserRoundCheck,
  UserRoundX,
  LayoutList,
  Map as MapIcon,
  Plus,
  ScrollText,
} from "lucide-react"
import { DropdownMenuContent } from "@/components/ui/dropdown-menu"
import { DropdownMenu, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { Check } from "lucide-react"
import { mapBookingStatus } from '@/lib/maps'
import DetailsSheet from '@/components/private/details-sheet'

import { Booking } from '@/types/general'
import { BookingWithCustomer } from '@/types/components'
import { useLocationStore } from '@/store/location-store'
import ReservationsTable from '@/components/private/reservations-table'
import ReservationsFloorPlan from '@/components/reservations/reservations-floor-plan'
import OrdersList from '@/components/orders/orders-list'

import { DateNavigator } from '@/components/reservations/date-navigator'
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh'

const ReservationsView = () => {
  const [open, setOpen] = React.useState(false)
  const [data, setData] = React.useState<Booking[] | null>(null)
  const [viewFilter, setViewFilter] = React.useState<'asc' | 'desc'>('desc')
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = React.useState<BookingWithCustomer | null>(null)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<'list' | 'map' | 'orders'>('list')
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date())

  const handleViewFilter = (prev: 'asc' | 'desc') => {
    setViewFilter(prev === 'asc' ? 'desc' : 'asc')
  }

  const { selectedLocationId } = useLocationStore()

  const fetchData = React.useCallback(async () => {
    if (!selectedLocationId) return

    const params = new URLSearchParams()
    params.append('sort', viewFilter)
    params.append('location_id', selectedLocationId)
    if (statusFilter) {
      params.append('status', statusFilter)
    }
    const response = await fetch(`/api/supabase/bookings?${params.toString()}`)
    const data = await response.json()
    setData(data)
  }, [viewFilter, statusFilter, selectedLocationId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // Effect to close sheet if selected booking is no longer in data (e.g. deleted by realtime)
  React.useEffect(() => {
    if (selectedBooking && data) {
      const stillExists = data.find(b => b.id === selectedBooking.id)
      if (!stillExists) {
        setIsSheetOpen(false)
        setSelectedBooking(null)
      } else {
        // Optional: Update selected booking with fresh data (e.g. status change)
        // casting to any because Booking vs BookingWithCustomer types might mismatch slightly
        // or just keep it simple. If we want live updates in the sheet:
        // setSelectedBooking(stillExists as BookingWithCustomer)
      }
    }
  }, [data, selectedBooking])

  useRealtimeRefresh('bookings', {
    filter: selectedLocationId ? `location_id=eq.${selectedLocationId}` : undefined,
    onUpdate: fetchData
  })

  const handleRowClick = (booking: BookingWithCustomer) => {
    setSelectedBooking(booking)
    setIsSheetOpen(true)
  }



  const [bookingToEdit, setBookingToEdit] = React.useState<BookingWithCustomer | null>(null)

  const handleEdit = (booking: BookingWithCustomer) => {
    setBookingToEdit(booking)
    setIsSheetOpen(false) // Close details
    setOpen(true) // Open create/edit sheet
  }

  return (
    <div>


      <div className='flex justify-between items-center mb-4'>
        <div className="flex gap-2">
          <ButtonGroup>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              size="icon"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              onClick={() => setViewMode('map')}
              size="icon"
            >
              <MapIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'orders' ? 'default' : 'outline'}
              onClick={() => setViewMode('orders')}
              size="icon"
            >
              <ScrollText className="h-4 w-4" />
            </Button>
          </ButtonGroup>

          {viewMode === 'list' && (
            <ButtonGroup>
              <Button onClick={() => handleViewFilter(viewFilter)} variant="outline">Ordine: {viewFilter === 'asc' ? 'Più recenti' : 'Più Vecchi'}</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={statusFilter ? "default" : "outline"} aria-label="More Options">
                    <ListFilterIcon className="ml-2 h-4 w-4" />
                    {statusFilter ? `Filtro: ${mapBookingStatus(statusFilter)}` : 'Filtra'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start'>
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                      <ListFilterIcon className="mr-2 h-4 w-4" />
                      <span>Tutti</span>
                      {!statusFilter && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                      <ClockFading className="mr-2 h-4 w-4" />
                      <span>In attesa</span>
                      {statusFilter === 'pending' && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('confirmed')}>
                      <TicketCheck className="mr-2 h-4 w-4" />
                      <span>Approvato</span>
                      {statusFilter === 'confirmed' && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('cancelled')}>
                      <TicketX className="mr-2 h-4 w-4" />
                      <span>Cancellato</span>
                      {statusFilter === 'cancelled' && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('noshow')}>
                      <UserRoundX className="mr-2 h-4 w-4" />
                      <span>Non arrivato</span>
                      {statusFilter === 'noshow' && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('arrived')}>
                      <UserRoundCheck className="mr-2 h-4 w-4" />
                      <span>Arrivato</span>
                      {statusFilter === 'arrived' && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
          )}

          {viewMode === 'map' && (
            <DateNavigator date={selectedDate} setDate={setSelectedDate} />
          )}

        </div>
        <Button onClick={() => {
          setBookingToEdit(null)
          setOpen(true)
        }}>
          <Plus className="h-4 w-4 md:hidden " />
          <span className='hidden md:block'>Aggiungi</span>
        </Button>
      </div>

      {viewMode === 'list' ? (
        <ReservationsTable
          data={data}
          selectedBooking={selectedBooking}
          isSheetOpen={isSheetOpen}
          handleRowClick={handleRowClick}
          setOpen={() => setOpen(false)}
        />
      ) : viewMode === 'map' ? (
        selectedLocationId && data && (
          <ReservationsFloorPlan
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
        )
      ) : (
        selectedLocationId && (
          <OrdersList locationId={selectedLocationId} />
        )
      )}

      <ReservationSheet
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen)
          if (!isOpen) setBookingToEdit(null)
        }}
        onSuccess={fetchData}
        booking={bookingToEdit}
      />
      <DetailsSheet
        isSheetOpen={isSheetOpen}
        setIsSheetOpen={setIsSheetOpen}
        selectedBooking={selectedBooking}
        onBookingDeleted={fetchData}
        onEdit={handleEdit}
      />
    </div>
  )
}

export default ReservationsView