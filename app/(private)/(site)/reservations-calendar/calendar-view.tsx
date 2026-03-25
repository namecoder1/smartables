"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar'
import withDragAndDrop, { EventInteractionArgs } from 'react-big-calendar/lib/addons/dragAndDrop'
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths } from 'date-fns'
import { enUS, it } from 'date-fns/locale'
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import './calendar.css'
import { Booking, CalendarEvent, GoogleCalendarResource } from '@/types/general'
import { BookingWithCustomer } from '@/types/components'
import DetailsSheet from '@/components/private/details-sheet'
import GCalEventSheet from '@/components/private/gcal-event-sheet'
import { useLocationStore } from '@/store/location-store'
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh'
import { moveBooking } from '@/app/actions/google-calendar'
import { toast } from 'sonner'

import ReservationSheet from '@/components/utility/reservation-sheet'

function isGcalResource(r: Booking | GoogleCalendarResource): r is GoogleCalendarResource {
  return (r as GoogleCalendarResource).isGoogleEvent === true
}

function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d)
}

const locales = { 'it': it, 'en-US': enUS }

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

// DnD-enabled calendar
const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar)

// ── Custom Toolbar ────────────────────────────────────────────────────────────
const CustomToolbar = (toolbar: any) => {
  const label = () => {
    const date = toolbar.date
    const view = toolbar.view as View

    if (view === 'day') {
      return <span className="capitalize text-lg font-semibold">{format(date, 'd MMMM yyyy', { locale: it })}</span>
    }
    if (view === 'week') {
      const start = startOfWeek(date, { locale: it })
      const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000)
      return <span className="capitalize text-lg font-semibold">{format(start, 'd MMM', { locale: it })} - {format(end, 'd MMM yyyy', { locale: it })}</span>
    }
    return <span className="capitalize text-lg font-semibold">{format(date, 'MMMM yyyy', { locale: it })}</span>
  }

  return (
    <div className='bg-[#e2e2e2] rounded-t-xl'>
      <div className="flex flex-col gap-2 p-2 border-b-2 border-black/5 md:flex-row md:items-center md:justify-between">
        <div className="md:hidden w-full text-center py-1 border-2 border-black/10 bg-white rounded-xl">{label()}</div>
        <div className="flex items-center justify-between w-full gap-4">
          <div className="flex items-center gap-1 p-1 border-2 border-black/15 bg-input/30 dark:bg-card rounded-xl">
            <Button variant="outline" size="icon" onClick={() => toolbar.onNavigate('PREV')} className="h-8 w-8 border-2">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => toolbar.onNavigate('TODAY')} className="h-8 px-2 text-xs border-2">Oggi</Button>
            <Button variant="outline" size="icon" onClick={() => toolbar.onNavigate('NEXT')} className="h-8 w-8 border-2">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="hidden rounded-xl md:block flex-1 text-center min-w-50 text-lg font-semibold tracking-tight p-1.5 bg-input/30 dark:bg-card border-2 border-border w-fit">{label()}</div>
          <div className="flex items-center gap-1 p-1 bg-input/30 dark:bg-card border-2 border-border rounded-xl">
            {(['month', 'week', 'day'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => toolbar.onView(v)}
                className={cn("h-7 px-2 text-xs border-2 rounded-lg border-transparent", toolbar.view === v && "bg-primary/40 border-primary/70 text-foreground shadow-sm")}
              >
                {{ month: 'Mese', week: 'Settimana', day: 'Giorno', agenda: 'Agenda', work_week: 'Lavorativa' }[v]}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className='py-2 px-3 flex items-center justify-between'>
        <h3 className='font-semibold text-sm'>Legenda:</h3>
        <div className='flex items-center gap-4 flex-wrap'>
          <div className='flex items-center gap-2'>
            <div style={{ width: 10, height: 10, borderRadius: '3px', backgroundColor: '#3b82f6' }} />
            <span className='text-xs'>Prenotazione</span>
          </div>
          {toolbar.googleCalendarName && (
            <div className='flex items-center gap-2'>
              <div style={{ width: 10, height: 10, borderRadius: '3px', backgroundColor: '#8b5cf6' }} />
              <span className='text-xs'>Evento GCal ({toolbar.googleCalendarName})</span>
            </div>
          )}
          {toolbar.linkedCount > 0 && (
            <div className='flex items-center gap-2'>
              <div style={{ width: 10, height: 10, borderRadius: '3px', backgroundColor: '#ef4444' }} />
              <span className='text-xs text-red-600 font-medium'>{toolbar.linkedCount} prenotazion{toolbar.linkedCount === 1 ? 'e collegata' : 'i collegate'} a GCal</span>
            </div>
          )}
          {toolbar.conflictCount > 0 && (
            <div className='flex items-center gap-2'>
              <div style={{ width: 10, height: 10, borderRadius: '3px', backgroundColor: '#7c3aed', outline: '2px solid #f97316', outlineOffset: '1px' }} />
              <span className='text-xs text-orange-600 font-medium'>{toolbar.conflictCount} evento GCal in conflitto con prenotazion{toolbar.conflictCount === 1 ? 'e' : 'i'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Custom Event ──────────────────────────────────────────────────────────────
const CustomEvent = ({ event }: { event: CalendarEvent }) => {
  if (isGcalResource(event.resource)) {
    return (
      <div className='flex h-full items-center px-1 text-xs overflow-hidden'>
        <span className='font-semibold truncate'>{event.title}</span>
      </div>
    )
  }
  return (
    <div className='flex flex-col h-full items-start justify-center px-1 text-xs gap-1 overflow-hidden'>
      <span className='font-semibold truncate'>{(event.resource as Booking).guest_name}</span>
      <span className='opacity-90 whitespace-nowrap text-[10px]'>({(event.resource as Booking).guests_count} pers.)</span>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  googleCalendarId?: string | null
  googleCalendarName?: string | null
}

// ── CalendarView ──────────────────────────────────────────────────────────────
const CalendarView = ({ googleCalendarId = null, googleCalendarName = null }: Props) => {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<View>(Views.MONTH)
  const [date, setDate] = useState(new Date())

  // Sheet states
  const [selectedBooking, setSelectedBooking] = useState<BookingWithCustomer | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isReservationSheetOpen, setIsReservationSheetOpen] = useState(false)
  const [bookingToEdit, setBookingToEdit] = useState<BookingWithCustomer | null>(null)
  const [selectedGcalEvent, setSelectedGcalEvent] = useState<GoogleCalendarResource | null>(null)
  const [isGcalSheetOpen, setIsGcalSheetOpen] = useState(false)

  const { selectedLocationId } = useLocationStore()

  // ── Fetch bookings ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!selectedLocationId) return
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ location_id: selectedLocationId })
      const response = await fetch(`/api/supabase/bookings?${params.toString()}`)
      const data: Booking[] = await response.json()

      const mappedEvents: CalendarEvent[] = data
        .filter(b => b.booking_time)
        .map(booking => {
          const start = new Date(booking.booking_time)
          let end = booking.booking_end_time
            ? new Date(booking.booking_end_time)
            : new Date(start.getTime() + 2 * 60 * 60 * 1000)
          // Clamp to end of day if it overflows midnight
          if (!booking.booking_end_time && end.getDate() !== start.getDate()) {
            end = new Date(start)
            end.setHours(23, 59, 59, 999)
          }
          return { id: booking.id, title: `${booking.guest_name} (${booking.guests_count}p)`, start, end, resource: booking }
        })
        .filter(ev => !isNaN(ev.start.getTime()))

      setEvents(mappedEvents)
    } catch (error) {
      console.error("Failed to fetch bookings", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedLocationId])

  // ── Fetch Google events ─────────────────────────────────────────────────────
  const fetchGoogleEvents = useCallback(async () => {
    if (!selectedLocationId || !googleCalendarId) {
      setGoogleEvents([])
      return
    }
    try {
      const rangeStart = startOfMonth(date)
      const rangeEnd = endOfMonth(addMonths(date, 1))
      const params = new URLSearchParams({
        locationId: selectedLocationId,
        calendarId: googleCalendarId,
        timeMin: rangeStart.toISOString(),
        timeMax: rangeEnd.toISOString(),
      })
      const res = await fetch(`/api/google/calendar/events?${params.toString()}`)
      const data = await res.json()

      const mapped: CalendarEvent[] = (data.events ?? [])
        .filter((ev: any) => ev.start && !ev.start.date) // skip all-day events (birthdays, holidays, etc.)
        .map((ev: any) => {
          const start = new Date(ev.start.dateTime)
          const end = new Date(ev.end.dateTime ?? ev.start.dateTime)
          return {
            id: `gcal_${ev.id}`,
            title: ev.summary ?? '(Nessun titolo)',
            start,
            end,
            allDay: false,
            resource: { isGoogleEvent: true as const, ...ev } as GoogleCalendarResource,
          }
        })
        .filter((ev: CalendarEvent) => !isNaN(ev.start.getTime()))

      setGoogleEvents(mapped)
    } catch {
      setGoogleEvents([])
    }
  }, [selectedLocationId, googleCalendarId, date])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchGoogleEvents() }, [fetchGoogleEvents])

  // Close booking sheet if deleted via realtime
  useEffect(() => {
    if (selectedBooking && events) {
      if (!events.find(e => e.resource.id === selectedBooking.id)) {
        setIsSheetOpen(false)
        setSelectedBooking(null)
      }
    }
  }, [events, selectedBooking])

  useRealtimeRefresh('bookings', {
    filter: selectedLocationId ? `location_id=eq.${selectedLocationId}` : undefined,
    onUpdate: fetchData
  })

  // ── Drag & Drop handlers ────────────────────────────────────────────────────
  const handleEventDrop = useCallback(async ({ event, start, end }: EventInteractionArgs<CalendarEvent>) => {
    const newStart = toDate(start)
    const newEnd = toDate(end)

    if (isGcalResource(event.resource)) {
      // Optimistic update
      setGoogleEvents(prev => prev.map(e => e.id === event.id ? { ...e, start: newStart, end: newEnd } : e))
      try {
        const res = await fetch('/api/google/calendar/update-event', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locationId: selectedLocationId,
            calendarId: googleCalendarId,
            eventId: event.resource.id,
            start: newStart.toISOString(),
            end: newEnd.toISOString(),
          }),
        })
        if (!res.ok) throw new Error()
        toast.success('Evento spostato')
      } catch {
        toast.error('Errore nel salvataggio')
        fetchGoogleEvents()
      }
    } else {
      const booking = event.resource as Booking
      const prevEvents = events
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, start: newStart, end: newEnd } : e))
      try {
        await moveBooking(booking.id, newStart, newEnd)
        toast.success('Prenotazione spostata')
      } catch {
        toast.error('Errore nel salvataggio')
        setEvents(prevEvents)
      }
    }
  }, [selectedLocationId, googleCalendarId, events, fetchGoogleEvents])

  // ── Resize handler ──────────────────────────────────────────────────────────
  const handleEventResize = useCallback(async ({ event, start, end }: EventInteractionArgs<CalendarEvent>) => {
    const newStart = toDate(start)
    const newEnd = toDate(end)

    if (isGcalResource(event.resource)) {
      setGoogleEvents(prev => prev.map(e => e.id === event.id ? { ...e, start: newStart, end: newEnd } : e))
      try {
        const res = await fetch('/api/google/calendar/update-event', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locationId: selectedLocationId,
            calendarId: googleCalendarId,
            eventId: event.resource.id,
            start: newStart.toISOString(),
            end: newEnd.toISOString(),
          }),
        })
        if (!res.ok) throw new Error()
        toast.success('Durata aggiornata')
      } catch {
        toast.error('Errore nel salvataggio')
        fetchGoogleEvents()
      }
    } else {
      const booking = event.resource as Booking
      const prevEvents = events
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, start: newStart, end: newEnd } : e))
      try {
        await moveBooking(booking.id, newStart, newEnd)
        toast.success('Durata prenotazione aggiornata')
      } catch {
        toast.error('Errore nel salvataggio')
        setEvents(prevEvents)
      }
    }
  }, [selectedLocationId, googleCalendarId, events, fetchGoogleEvents])

  // ── Event selection ─────────────────────────────────────────────────────────
  const handleSelectEvent = (event: CalendarEvent) => {
    if (isGcalResource(event.resource)) {
      setSelectedGcalEvent(event.resource)
      setIsGcalSheetOpen(true)
    } else {
      setSelectedBooking(event.resource as BookingWithCustomer)
      setIsSheetOpen(true)
    }
  }

  const handleEdit = (booking: BookingWithCustomer) => {
    setBookingToEdit(booking)
    setIsSheetOpen(false)
    setTimeout(() => setIsReservationSheetOpen(true), 150)
  }

  // ── Link & conflict detection ─────────────────────────────────────────────────
  // GCal event IDs that are linked to a booking (computed first — used to exclude from conflicts)
  const linkedGcalIds = useMemo(() => {
    const ids = new Set<string>()
    for (const ev of events) {
      const booking = ev.resource as Booking
      if (booking.google_event_id) ids.add(`gcal_${booking.google_event_id}`)
    }
    return ids
  }, [events])

  // GCal event IDs that overlap with a booking AND are NOT linked to it
  const conflictingGcalIds = useMemo(() => {
    const ids = new Set<string>()
    for (const ge of googleEvents) {
      if (ge.allDay) continue
      if (linkedGcalIds.has(String(ge.id))) continue // linked events are intentional, not conflicts
      for (const ev of events) {
        if (ge.start < ev.end && ge.end > ev.start) {
          ids.add(String(ge.id))
          break
        }
      }
    }
    return ids
  }, [googleEvents, events, linkedGcalIds])

  // ── Accessors ───────────────────────────────────────────────────────────────
  // Drag & resize only in week/day views — month is read-only
  const draggableAccessor = () => view === Views.WEEK || view === Views.DAY
  const resizableAccessor = (event: CalendarEvent) =>
    (view === Views.WEEK || view === Views.DAY) && !event.allDay

  const eventStyleGetter = (event: CalendarEvent) => {
    if (isGcalResource(event.resource)) {
      const hasConflict = conflictingGcalIds.has(String(event.id))
      const isLinked = linkedGcalIds.has(String(event.id))
      return {
        style: {
          border: hasConflict ? '2px solid #f97316' : isLinked ? '2px solid #22c55e' : '1px solid #fff',
          backgroundColor: hasConflict ? '#7c3aed' : '#8b5cf6',
          borderRadius: '6px',
          opacity: 0.85,
          color: 'white',
          display: 'block',
          fontSize: '0.8rem',
        }
      }
    }
    const booking = event.resource as Booking
    const isLinked = !!booking.google_event_id
    const backgroundColor = isLinked ? '#ef4444' : '#3b82f6'
    return {
      style: {
        border: '1px solid #fff',
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        display: 'block',
        fontSize: '0.8rem',
      }
    }
  }

  // Bookings list for the GCal sheet (raw Booking objects)
  const allBookings = events.map(e => e.resource as Booking)

  const handleLinked = () => {
    fetchData()
    fetchGoogleEvents()
  }

  return (
    <div className="h-[calc(100vh-220px)] min-h-150 w-full relative rounded-xl">
      {isLoading && (
        <div className="absolute inset-0 bg-card border-2 backdrop-blur-xs rounded-xl z-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <div className="h-full w-full rounded-2xl border-0">
        <DnDCalendar
          localizer={localizer}
          events={[...events, ...googleEvents.filter(ge => !linkedGcalIds.has(String(ge.id)))]}
          startAccessor="start"
          endAccessor="end"
          className='rounded-2xl border-2 overflow-hidden'
          style={{ height: '100%', minHeight: '500px' }}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          onSelectEvent={handleSelectEvent}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          draggableAccessor={draggableAccessor}
          resizableAccessor={resizableAccessor}
          resizable
          step={15}
          timeslots={4}
          scrollToTime={new Date(1970, 1, 1, 8, 0)}
          components={{
            toolbar: (props: any) => (
              <CustomToolbar {...props} googleCalendarName={googleCalendarName} conflictCount={conflictingGcalIds.size} linkedCount={linkedGcalIds.size} />
            ),
            event: CustomEvent,
          }}
          eventPropGetter={eventStyleGetter}
          culture='it'
          messages={{
            next: "Succ",
            previous: "Prec",
            today: "Oggi",
            month: "Mese",
            week: "Settimana",
            day: "Giorno",
            agenda: "Agenda",
            noEventsInRange: "Nessun evento in questo periodo",
          }}
        />
      </div>

      <DetailsSheet
        isSheetOpen={isSheetOpen}
        setIsSheetOpen={setIsSheetOpen}
        selectedBooking={selectedBooking}
        onBookingDeleted={fetchData}
        onEdit={handleEdit}
        googleEvents={googleEvents}
        onLinked={handleLinked}
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
      <GCalEventSheet
        event={selectedGcalEvent}
        bookings={allBookings}
        open={isGcalSheetOpen}
        onClose={() => setIsGcalSheetOpen(false)}
        onLinked={handleLinked}
      />
    </div>
  )
}

export default CalendarView
