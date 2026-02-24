"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS, it } from 'date-fns/locale'
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, User, Phone, Users, Clock, Info, Notebook } from "lucide-react"
import { cn } from "@/lib/utils"
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './calendar.css'
import { Booking, CalendarEvent } from '@/types/general'
import { BookingWithCustomer } from '@/types/components'
import DetailsSheet from '@/components/private/details-sheet'
import { useLocationStore } from '@/store/location-store'
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh'

const locales = {
  'it': it,
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})


import ReservationSheet from '@/components/utility/reservation-sheet'

// Custom Toolbar Component
const CustomToolbar = (toolbar: any) => {
  const goToBack = () => {
    toolbar.onNavigate('PREV')
  }

  const goToNext = () => {
    toolbar.onNavigate('NEXT')
  }

  const goToCurrent = () => {
    toolbar.onNavigate('TODAY')
  }

  const goToView = (view: View) => {
    toolbar.onView(view)
  }

  const label = () => {
    const date = toolbar.date
    const view = toolbar.view as View

    if (view === 'day') {
      return (
        <span className="capitalize text-lg font-semibold">
          {format(date, 'd MMMM yyyy', { locale: it })}
        </span>
      )
    }

    if (view === 'week') {
      const start = startOfWeek(date, { locale: it })
      const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000)
      return (
        <span className="capitalize text-lg font-semibold">
          {format(start, 'd MMM', { locale: it })} - {format(end, 'd MMM yyyy', { locale: it })}
        </span>
      )
    }

    return (
      <span className="capitalize text-lg font-semibold">
        {format(date, 'MMMM yyyy', { locale: it })}
      </span>
    )
  }

  return (
    <div className='bg-card rounded-t-2xl'>
      <div className="flex flex-col gap-2 p-2 border-b-2 md:flex-row md:items-center md:justify-between">
        <div className="md:hidden w-full text-center pb-2 border-b-2 border-border/50">
          {label()}
        </div>

        <div className="flex items-center justify-between w-full gap-4">
          <div className="flex items-center gap-1 p-1 border-2 bg-input/30 dark:bg-card rounded-xl">
            <Button variant="outline" size="icon" onClick={goToBack} className="h-8 w-8 border-2">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToCurrent} className="h-8 px-2 text-xs border-2">
              Oggi
            </Button>
            <Button variant="outline" size="icon" onClick={goToNext} className="h-8 w-8 border-2">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="hidden rounded-xl md:block flex-1 text-center min-w-[200px] text-lg font-semibold tracking-tight p-1.5 bg-input/30 dark:bg-card border-2 border-border w-fit">
            {label()}
          </div>

          <div className="flex items-center gap-1 p-1 bg-input/30 dark:bg-card border-2 border-border rounded-xl">
            <button
              onClick={() => goToView('month')}
              className={cn("h-7 px-2 text-xs border-2 rounded-lg border-transparent", toolbar.view === 'month' && "bg-primary/40 border-primary/70 text-foreground shadow-sm")}
            >
              Mese
            </button>
            <button
              onClick={() => goToView('week')}
              className={cn("h-7 px-2 text-xs border-2 rounded-lg border-transparent", toolbar.view === 'week' && "bg-primary/40 border-primary/70 text-foreground shadow-sm")}
            >
              Settimana
            </button>
            <button
              onClick={() => goToView('day')}
              className={cn("h-7 px-2 text-xs border-2 rounded-lg border-transparent", toolbar.view === 'day' && "bg-primary/40 border-primary/70 text-foreground shadow-sm")}
            >
              Giorno
            </button>
          </div>

        </div>
      </div>
      <div className='py-2 px-3 flex items-center justify-between'>
        <h3 className='font-semibold text-sm'>Legenda:</h3>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
            <span className='text-xs'>Cliente conosciuto</span>
          </div>
          <div className='flex items-center gap-2'>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <span className='text-xs'>Cliente sconosciuto</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Custom Event Component
const CustomEvent = ({ event }: { event: CalendarEvent }) => {
  return (
    <div className='flex flex-col h-full items-start justify-center px-1 text-xs gap-1 overflow-hidden'>
      <span className='font-semibold truncate'>{event.resource.guest_name}</span>
      <span className='opacity-90 whitespace-nowrap text-[10px]'>({event.resource.guests_count} pers.)</span>
    </div>
  )
}

const CalendarView = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<View>(Views.MONTH)
  const [date, setDate] = useState(new Date())
  const [selectedBooking, setSelectedBooking] = useState<BookingWithCustomer | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isReservationSheetOpen, setIsReservationSheetOpen] = useState(false)
  const [bookingToEdit, setBookingToEdit] = useState<BookingWithCustomer | null>(null)

  const { selectedLocationId } = useLocationStore()

  const fetchData = useCallback(async () => {
    if (!selectedLocationId) return

    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('location_id', selectedLocationId)
      const response = await fetch(`/api/supabase/bookings?${params.toString()}`)
      const data: Booking[] = await response.json()

      const mappedEvents: CalendarEvent[] = data
        .filter(b => b.booking_time) // Filter out nulls
        .map(booking => {
          const start = new Date(booking.booking_time)
          // Default duration 2 hours
          let end = new Date(start.getTime() + 2 * 60 * 60 * 1000)

          // Fix for events crossing midnight:
          // If the event ends on a different day than it starts, clamp it to 23:59:59 of the start day.
          // This ensures it stays visually on the "service day".
          if (end.getDate() !== start.getDate()) {
            end = new Date(start)
            end.setHours(23, 59, 59, 999)
          }

          return {
            id: booking.id,
            title: `${booking.guest_name} (${booking.guests_count}p)`,
            start,
            end,
            resource: booking
          }
        })
        .filter(event => !isNaN(event.start.getTime())) // Filter invalid dates

      setEvents(mappedEvents)
    } catch (error) {
      console.error("Failed to fetch bookings", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedLocationId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Effect to close sheet if selected booking is no longer in events (e.g. deleted by realtime)
  useEffect(() => {
    if (selectedBooking && events) {
      // Events wrap the booking in 'resource'
      const stillExists = events.find(e => e.resource.id === selectedBooking.id)
      if (!stillExists) {
        setIsSheetOpen(false)
        setSelectedBooking(null)
      }
    }
  }, [events, selectedBooking])

  useRealtimeRefresh('bookings', {
    filter: selectedLocationId ? `location_id=eq.${selectedLocationId}` : undefined,
    onUpdate: fetchData
  })

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#ef4444' // Default Red (No Customer)

    if (event.resource.customer_id) {
      backgroundColor = '#3b82f6' // Blue (Has Customer)
    }

    // Keep status-based overrides if needed, or stick to the strict rule?
    // The user said: "blu se ha customer_id, rosso se non ha customer_id"
    // This implies these are the primary colors.
    // However, we might want to keep 'cancelled' as distinct visually?
    // Let's stick to the user's request for now.

    return {
      style: {
        border: '1px solid #fff',
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        display: 'block',
        fontSize: '0.8rem'
      }
    }
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedBooking(event.resource)
    setIsSheetOpen(true)
  }

  const handleEdit = (booking: BookingWithCustomer) => {
    setBookingToEdit(booking)
    setIsSheetOpen(false)
    setTimeout(() => {
      setIsReservationSheetOpen(true)
    }, 150)
  }

  return (
    <div className="h-[calc(100vh-220px)] min-h-[600px] w-full relative rounded-xl">
      {isLoading && (
        <div className="absolute inset-0 bg-[#fff8e8] dark:bg-[#232119] backdrop-blur-xs rounded-xl z-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <div className="h-full w-full rounded-2xl border-0">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          className='rounded-2xl border-2 overflow-hidden'
          style={{ height: '100%', minHeight: '500px' }}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA, Views.WORK_WEEK]}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          onSelectEvent={handleSelectEvent}
          components={{
            toolbar: CustomToolbar,
            event: CustomEvent
          }}
          eventPropGetter={eventStyleGetter}
          culture='it'
          messages={{
            next: "Succ",
            previous: "Prec",
            today: "Oggi",
            month: "Mese",
            week: "Settimana",
            day: "Giorno"
          }}
        />
      </div>

      <DetailsSheet
        isSheetOpen={isSheetOpen}
        setIsSheetOpen={setIsSheetOpen}
        selectedBooking={selectedBooking}
        onBookingDeleted={fetchData}
        onEdit={handleEdit}
      />
      <ReservationSheet
        open={isReservationSheetOpen}
        onOpenChange={(isOpen) => {
          setIsReservationSheetOpen(isOpen)
          if (!isOpen) setBookingToEdit(null)
        }}
        onSuccess={fetchData}
        booking={bookingToEdit}
      />
    </div>
  )
}

export default CalendarView
