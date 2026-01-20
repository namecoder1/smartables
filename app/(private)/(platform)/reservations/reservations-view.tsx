"use client"

import React from 'react'
import ReservationSheet from '@/components/private/reservation-sheet'
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
  X,
} from "lucide-react"
import { formatDistanceToNow } from 'date-fns'
import { DropdownMenuContent } from "@/components/ui/dropdown-menu"
import { DropdownMenu, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import PageWrapper from '@/components/private/page-wrapper'

import { Check } from "lucide-react"
import { mapBookingStatus } from '@/lib/maps'
import { it } from 'date-fns/locale'
import DetailsSheet from '@/components/private/details-sheet'

import { Booking } from '@/types/general'
import { useLocationStore } from '@/store/location-store'
import ReservationsTable from '@/components/private/reservations-table'

const ReservationsView = () => {
  const [open, setOpen] = React.useState(false)
  const [data, setData] = React.useState<Booking[] | null>(null)
  const [viewFilter, setViewFilter] = React.useState<'asc' | 'desc'>('desc')
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)

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

  const handleRowClick = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsSheetOpen(true)
  }

  return (
    <PageWrapper>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Prenotazioni</h1>
        <p className='text-muted-foreground'>Gestisci, visualizza e modifica le prenotazioni per i tuoi tavoli</p>
      </div>
      <div>
        <div className='flex justify-between items-center mb-4'>
          <ButtonGroup>
            <ButtonGroup>
              <Button onClick={() => handleViewFilter(viewFilter)} variant="outline">Visualizzazione: {viewFilter === 'asc' ? 'Più recenti' : 'Più Vecchi'}</Button>
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
          </ButtonGroup>
          <Button onClick={() => setOpen(true)}>
            Aggiungi
          </Button>
        </div>
        <ReservationsTable 
          data={data} 
          selectedBooking={selectedBooking} 
          isSheetOpen={isSheetOpen} 
          handleRowClick={handleRowClick} 
          setOpen={() => setOpen(false)} 
        />

        <ReservationSheet open={open} onOpenChange={setOpen} onSuccess={fetchData} />
        <DetailsSheet
          isSheetOpen={isSheetOpen}
          setIsSheetOpen={setIsSheetOpen}
          selectedBooking={selectedBooking}
        />
      </div>
    </PageWrapper>
  )
}

export default ReservationsView