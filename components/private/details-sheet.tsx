import { useState, useEffect } from 'react'
import { BookingWithCustomer } from '@/types/components'
import { CalendarEvent, GoogleCalendarResource } from '@/types/general'
import { format, isTomorrow, isToday } from 'date-fns'
import { it } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { deleteBooking } from '@/utils/supabase/actions'
import ActionSheet from '../utility/action-sheet'
import { Phone, Grid, Calendar, Link2, Link2Off, Loader2, Clock, Users, ExternalLink } from 'lucide-react'
import { mapStatusLabel } from '@/lib/utils'
import { formatPhoneNumber } from 'react-phone-number-input'
import { linkGoogleEvent, unlinkGoogleEvent, fetchGcalEventForBooking } from '@/app/actions/google-calendar'
import { toast } from 'sonner'

interface DetailsSheetProps {
  isSheetOpen: boolean
  setIsSheetOpen: (open: boolean) => void
  selectedBooking: BookingWithCustomer | null
  onBookingDeleted?: () => void
  onEdit?: (booking: BookingWithCustomer) => void
  // Optional: pass loaded GCal events so the user can link directly from this sheet
  googleEvents?: CalendarEvent[]
  onLinked?: () => void
}

const DetailsSheet = ({
  isSheetOpen,
  setIsSheetOpen,
  selectedBooking,
  onBookingDeleted,
  onEdit,
  googleEvents = [],
  onLinked,
}: DetailsSheetProps) => {
  const [linking, setLinking] = useState<string | null>(null)
  const [unlinking, setUnlinking] = useState(false)
  const [showLinkList, setShowLinkList] = useState(false)
  const [fetchedGcalEvent, setFetchedGcalEvent] = useState<any>(null)

  const linkedEventFromProps = selectedBooking?.google_event_id
    ? googleEvents.find(ge => ge.id === `gcal_${selectedBooking.google_event_id}`)
    : null

  // Auto-fetch the linked GCal event when not provided via googleEvents prop
  useEffect(() => {
    if (!selectedBooking?.google_event_id || linkedEventFromProps) {
      setFetchedGcalEvent(null)
      return
    }
    let cancelled = false
    fetchGcalEventForBooking(selectedBooking.location_id!, selectedBooking.google_event_id)
      .then(res => {
        if (!cancelled && res.success) setFetchedGcalEvent(res.data)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [selectedBooking?.id, selectedBooking?.google_event_id, linkedEventFromProps])

  // Resolved linked event: prefer the one from props (already in calendar), fall back to fetched
  const resolvedLinkedEvent = linkedEventFromProps ?? (fetchedGcalEvent
    ? {
        id: `gcal_${selectedBooking!.google_event_id}`,
        title: fetchedGcalEvent.summary ?? '(Nessun titolo)',
        start: new Date(fetchedGcalEvent.start?.dateTime ?? fetchedGcalEvent.start?.date),
        end: new Date(fetchedGcalEvent.end?.dateTime ?? fetchedGcalEvent.end?.date),
        resource: { isGoogleEvent: true as const, ...fetchedGcalEvent } as GoogleCalendarResource,
      } as CalendarEvent
    : null)

  const nearbyGcalEvents = selectedBooking
    ? googleEvents.filter((ge) => {
        if (ge.allDay) return false
        if (ge.id === `gcal_${selectedBooking.google_event_id}`) return false
        const bookingMs = new Date(selectedBooking.booking_time).getTime()
        const evStart = ge.start.getTime()
        const evEnd = ge.end.getTime()
        // Show events within ±2h of the booking start time
        return Math.abs(evStart - bookingMs) <= 2 * 60 * 60 * 1000 || (evStart <= bookingMs && bookingMs <= evEnd)
      })
    : []

  const handleUnlinkGcal = async () => {
    if (!selectedBooking) return
    setUnlinking(true)
    try {
      await unlinkGoogleEvent(selectedBooking.id)
      toast.success('Collegamento Google Calendar rimosso')
      onLinked?.()
    } catch {
      toast.error('Errore nella rimozione del collegamento')
    } finally {
      setUnlinking(false)
    }
  }

  const handleLinkGcal = async (googleEventId: string) => {
    if (!selectedBooking) return
    setLinking(googleEventId)
    try {
      await linkGoogleEvent(selectedBooking.id, googleEventId)
      toast.success('Prenotazione collegata a Google Calendar')
      setShowLinkList(false)
      onLinked?.()
    } catch {
      toast.error('Errore nel collegamento')
    } finally {
      setLinking(null)
    }
  }

  const actionButtons = selectedBooking ? (
    <>
      <Button
        variant="outline"
        className="w-full sm:w-auto rounded-xl px-6 font-semibold"
        onClick={() => {
          if (onEdit) {
            onEdit(selectedBooking)
          }
        }}
      >
        Modifica
      </Button>
      <Button
        variant="destructive"
        className="w-full sm:w-auto rounded-xl px-6 font-semibold"
        onClick={async () => {
          const res = await deleteBooking(selectedBooking.id)
          if (res?.error) {
            console.error(res.error)
          } else {
            setIsSheetOpen(false)
            if (onBookingDeleted) onBookingDeleted()
          }
        }}
      >
        Elimina
      </Button>
    </>
  ) : null;

  return (
    <ActionSheet
      open={isSheetOpen}
      onOpenChange={setIsSheetOpen}
      title="Dettaglio Prenotazione"
      description="Informazioni e gestione della prenotazione"
      actionButtons={actionButtons}
    >
      {selectedBooking && (
        <div className="flex flex-col space-y-5">
          <div className="bg-white rounded-3xl border border-border shadow-sm">
            <div className="flex items-center justify-between border-b bg-zinc-100/50 rounded-t-3xl px-4 py-5 shadow-sm">
              <p className='text-sm font-bold uppercase tracking-wider'>Stato Prenotazione</p>
              <div className={`px-4 py-1.5 rounded-full ${selectedBooking.status === "confirmed" ? "bg-[#cdf1bf]" :
                selectedBooking.status === "arrived" ? "bg-blue-100" :
                  "bg-zinc-100"
                }`}>
                <span className={`text-[12px] font-bold uppercase tracking-wider ${selectedBooking.status === "confirmed" ? "text-[#287907]" :
                  selectedBooking.status === "arrived" ? "text-blue-700" :
                    "text-zinc-600"
                  }`}>
                  {mapStatusLabel(selectedBooking.status)}
                </span>
              </div>
            </div>
            <div className='p-6'>
              <div className="flex justify-between items-center border-b pb-4 mb-4">
                <div>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Cliente</p>
                  <h4 className="text-2xl font-bold text-foreground tracking-tight">{selectedBooking.guest_name}</h4>
                  <p className="text-sm font-light text-foreground tracking-tight mt-2">{formatPhoneNumber(selectedBooking.guest_phone)}</p>
                </div>
                <a href={`tel:${selectedBooking.guest_phone}`} className="flex items-center justify-center w-12 h-12 bg-[#cdf1bf]/30 rounded-full border border-[#cdf1bf]/50 ml-2 hover:bg-[#cdf1bf]/50 transition-colors">
                  <Phone className="w-5 h-5 text-[#287907]" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col justify-center border-r pr-5">
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Data e Ora</p>
                  <div className="flex flex-col">
                    <p className="text-3xl font-extrabold tracking-tighter text-foreground">
                      {format(new Date(selectedBooking.booking_time), "HH:mm")}
                    </p>
                    <p className="text-sm font-bold mt-0.5 capitalize text-zinc-500">
                      {isToday(new Date(selectedBooking.booking_time)) ? "Oggi" : isTomorrow(new Date(selectedBooking.booking_time)) ? "Domani" : format(new Date(selectedBooking.booking_time), "EEE d MMMM", { locale: it })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col justify-between">
                  <p className="text-sm font-bold uppercase tracking-wider mb-2">Ospiti</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-black tracking-tighter text-foreground">
                      {selectedBooking.guests_count}
                    </p>
                    <span className="text-sm font-bold text-zinc-500 uppercase">persone</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-black tracking-tighter text-foreground">
                      {selectedBooking.children_count || 0}
                    </p>
                    <span className="text-sm font-bold text-zinc-500 uppercase">bambini</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="rounded-3xl border border-border">
            <p className="text-sm bg-zinc-100/50 font-bold rounded-t-3xl px-4 py-5 uppercase tracking-wider border-b">Note Prenotazione</p>
            <p className="text-base p-4 leading-relaxed font-medium text-muted-foreground">{selectedBooking.notes || "Nessuna nota comunicata."}</p>
          </div>

          <div className="rounded-3xl border border-border">
            <p className="text-sm bg-zinc-100/50 font-bold rounded-t-3xl px-4 py-5 uppercase tracking-wider border-b">Intolleranze / Allergie</p>
            <p className="text-base p-4 leading-relaxed font-medium text-muted-foreground">{selectedBooking.allergies || "Nessuna allergia comunicata."}</p>
          </div>

          {/* Google Calendar link */}
          <div className="rounded-3xl border-2 border-border">
            <div className="flex items-center justify-between bg-zinc-100/50 rounded-t-3xl px-4 py-4 border-b">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-500" />
                <p className="text-sm font-bold uppercase tracking-wider">Google Calendar</p>
              </div>
              {selectedBooking.google_event_id && (
                <Badge variant="secondary" className="text-violet-600 bg-violet-50 border-violet-200 text-[10px]">
                  <Link2 className="w-2.5 h-2.5 mr-1" />
                  Collegato
                </Badge>
              )}
            </div>
            <div className="p-4">
              {selectedBooking.google_event_id ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 p-2 border-2 rounded-xl bg-card">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {resolvedLinkedEvent ? resolvedLinkedEvent.title : '(evento non caricato)'}
                      </p>
                      {resolvedLinkedEvent && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {format(resolvedLinkedEvent.start, 'HH:mm')} – {format(resolvedLinkedEvent.end, 'HH:mm')}
                        </p>
                      )}
                      {resolvedLinkedEvent && (resolvedLinkedEvent.resource as GoogleCalendarResource).htmlLink && (
                        <a
                          href={(resolvedLinkedEvent.resource as GoogleCalendarResource).htmlLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-violet-600 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Apri in Google Calendar
                        </a>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-2 rounded-xl h-8 text-destructive hover:text-destructive shrink-0"
                      onClick={handleUnlinkGcal}
                      disabled={unlinking}
                    >
                      {unlinking ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Link2Off className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              ) : nearbyGcalEvents.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {!showLinkList ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-2 rounded-xl w-full gap-2"
                      onClick={() => setShowLinkList(true)}
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      Collega a evento GCal vicino
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {nearbyGcalEvents.map((ge) => (
                        <div key={ge.id} className="flex items-center gap-2 p-2 border-2 rounded-xl bg-card">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{ge.title}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {format(ge.start, "HH:mm")} – {format(ge.end, "HH:mm")}
                              <Users className="w-3 h-3 ml-2" />
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-2 rounded-xl h-7 shrink-0"
                            onClick={() => handleLinkGcal(String(ge.id).replace('gcal_', ''))}
                            disabled={!!linking}
                          >
                            {linking === String(ge.id).replace('gcal_', '') ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Link2 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nessun evento GCal nelle vicinanze.
                </p>
              )}
            </div>
          </div>

          {/* Extra / Stats Cliente */}
          {selectedBooking.customer && (
            <div className="rounded-3xl border border-border">
              <p className="text-sm bg-zinc-100/50 font-bold rounded-t-3xl px-4 py-5 uppercase tracking-wider border-b">Statistiche Cliente</p>
              <div className="grid grid-cols-2 gap-2 p-4">
                <div>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Visite Totali</span>
                  <span className="font-bold text-2xl tracking-tight">{selectedBooking.customer.total_visits}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Ultima visita</span>
                  <span className="font-bold text-lg tracking-tight">
                    {selectedBooking.customer.last_visit
                      ? format(new Date(selectedBooking.customer.last_visit), 'd MMM yy', { locale: it })
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between flex-wrap gap-4 px-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Canale</span>
              <span className="text-sm font-bold text-foreground px-3 py-1 bg-zinc-100 rounded-lg capitalize">
                {selectedBooking.source ? selectedBooking.source.replace('_', ' ') : 'Sconosciuta'}
              </span>
            </div>

            {selectedBooking.table_id && (
              <div className="flex items-center bg-[#cdf1bf]/30 px-3 py-1.5 rounded-full border border-[#cdf1bf]/50">
                <Grid className="w-4 h-4 text-[#287907] mr-1.5" />
                <span className="text-[#287907] font-bold text-[11px] uppercase tracking-wider">Tavolo Assegnato</span>
              </div>
            )}
          </div>

        </div>
      )}
    </ActionSheet>
  )
}

export default DetailsSheet
