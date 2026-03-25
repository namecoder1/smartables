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
  Plus,
  Grid2X2,
} from "lucide-react"
import { DropdownMenuContent } from "@/components/ui/dropdown-menu"
import { DropdownMenu, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { Check } from "lucide-react"
import { startOfWeek as fnsStartOfWeek, endOfWeek as fnsEndOfWeek, isSameDay as fnsIsSameDay } from 'date-fns'
import { mapBookingStatus } from '@/lib/maps'
import DetailsSheet from '@/components/private/details-sheet'

import { Booking } from '@/types/general'
import { BookingWithCustomer } from '@/types/components'
import { useLocationStore } from '@/store/location-store'
import ReservationsTable from '@/components/private/reservations-table'
import { getUserRole } from '@/app/actions/profile'

import { DateNavigator } from '@/components/reservations/date-navigator'
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh'
import GridReservations from '@/components/reservations/grid-reservations'
import OverviewCards from '@/components/private/overview-cards'
import PageWrapper from '@/components/private/page-wrapper'
import { FaqContent } from '@/components/private/faq-section'
import { SanityFaq } from '@/utils/sanity/queries'

const ReservationsView = ({
  faqs
} : {
  faqs: SanityFaq[]
}) => {
  const [open, setOpen] = React.useState(false)
  const [data, setData] = React.useState<Booking[] | null>(null)
  const [isAdmin, setIsAdmin] = React.useState(false)

  React.useEffect(() => {
    getUserRole().then(role => setIsAdmin(role === 'admin' || role === 'owner'))
  }, [])
  const [viewFilter, setViewFilter] = React.useState<'asc' | 'desc'>('desc')
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = React.useState<BookingWithCustomer | null>(null)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list')
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

    // Fetch for the entire week to support stats
    const start = fnsStartOfWeek(selectedDate, { weekStartsOn: 1 }) // Monday
    const end = fnsEndOfWeek(selectedDate, { weekStartsOn: 1 }) // Sunday

    params.append('start', start.toISOString())
    params.append('end', end.toISOString())

    const response = await fetch(`/api/supabase/bookings?${params.toString()}`)
    const data = await response.json()
    setData(data)
  }, [viewFilter, statusFilter, selectedLocationId, selectedDate])

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
    setTimeout(() => {
      setOpen(true) // Open create/edit sheet
    }, 150)
  }

  const dailyData = React.useMemo(() => {
    if (!data) return []
    return data.filter(b => fnsIsSameDay(new Date(b.booking_time), selectedDate))
  }, [data, selectedDate])

  return (
    <PageWrapper>
      <div className='header-container'>
        <div className='items-start flex-col flex gap-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Vista Prenotazioni</h1>
          <p className='text-muted-foreground'>Gestisci le prenotazioni in tempo reale.</p>
        </div>
        <FaqContent variant='minimized' className='w-fit' title='Aiuto' faqs={faqs} />
      </div>
      <OverviewCards
        data={[
          {
            title: 'Totale oggi',
            value: dailyData.length,
            description: `prenotazion${dailyData.length === 1 ? 'e' : 'i'}`,
            icon: <TicketCheck className="text-primary size-6 2xl:size-8" />,
          },
          {
            title: 'Questa settimana',
            value: data?.length || 0,
            description: `prenotazion${data?.length === 1 ? 'e' : 'i'}`,
            icon: <TicketCheck className="text-primary size-6 2xl:size-8" />,
          },
          {
            title: 'Coperti oggi',
            value: dailyData.reduce((acc, b) => acc + (b.guests_count || 0), 0),
            description: 'totali',
            icon: <TicketCheck className="text-primary size-6 2xl:size-8" />,
          },

        ]}
      />
      <div className='flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4'>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonGroup>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
            >
              <LayoutList className="h-4 w-4 sm:mr-2" />
              <span className='hidden sm:block'>Lista</span>
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
            >
              <Grid2X2 className="h-4 w-4 sm:mr-2" />
              <span className='hidden sm:block'>Griglia</span>
            </Button>
          </ButtonGroup>

          <ButtonGroup>
            <Button onClick={() => handleViewFilter(viewFilter)} variant="outline">
              <span className="hidden sm:inline mr-1">Ordine:</span> {viewFilter === 'asc' ? 'Più recenti' : 'Più Vecchi'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={statusFilter ? "default" : "outline"} aria-label="More Options">
                  <ListFilterIcon className="sm:mr-2 h-4 w-4" />
                  <span className='hidden sm:block'>
                    {statusFilter ? `Filtro: ${mapBookingStatus(statusFilter)}` : 'Filtra'}
                  </span>
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
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-between xl:justify-end">
          <DateNavigator date={selectedDate} setDate={setSelectedDate} variant='reservations' />
          <Button onClick={() => {
            setBookingToEdit(null)
            setOpen(true)
          }}>
            <Plus className="h-4 w-4" />
            <span className='hidden sm:block'>Aggiungi</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {viewMode === 'list' ? (
          <ReservationsTable
            data={dailyData}
            selectedBooking={selectedBooking}
            isSheetOpen={isSheetOpen}
            handleRowClick={handleRowClick}
            context='default'
            isAdmin={isAdmin}
            onDelete={fetchData}
          />
        ) : (
          selectedLocationId && dailyData && (
            <GridReservations data={dailyData} handleRowClick={handleRowClick} />
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
    </PageWrapper>
  )
}

export default ReservationsView