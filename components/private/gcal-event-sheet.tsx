"use client";

import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Calendar,
  MapPin,
  Clock,
  ExternalLink,
  Link2,
  Link2Off,
  Loader2,
  User,
  Users,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Booking, GoogleCalendarResource } from "@/types/general";
import { linkGoogleEvent, unlinkGoogleEvent } from "@/app/actions/google-calendar";
import { createBookingFromGcalEvent } from "@/app/actions/bookings";
import { useLocationStore } from "@/store/location-store";
import { toast } from "sonner";

interface Props {
  event: GoogleCalendarResource | null;
  bookings: Booking[];
  open: boolean;
  onClose: () => void;
  onLinked: () => void;
}

function formatEventTime(resource: GoogleCalendarResource) {
  const isAllDay = !!resource.start.date;
  if (isAllDay) {
    const d = new Date(resource.start.date!);
    return format(d, "d MMMM yyyy", { locale: it });
  }
  const start = new Date(resource.start.dateTime!);
  const end = new Date(resource.end.dateTime ?? resource.start.dateTime!);
  return `${format(start, "d MMM yyyy · HH:mm", { locale: it })} – ${format(end, "HH:mm")}`;
}

export default function GCalEventSheet({ event, bookings, open, onClose, onLinked }: Props) {
  const [linking, setLinking] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  // Import form state
  const [showImport, setShowImport] = useState(false);
  const [importName, setImportName] = useState("");
  const [importPhone, setImportPhone] = useState("");
  const [importGuests, setImportGuests] = useState("2");
  const [importing, setImporting] = useState(false);

  const { selectedLocationId } = useLocationStore();

  if (!event) return null;

  const linkedBooking = bookings.find((b) => b.google_event_id === event.id);

  const eventDate = event.start.date
    ? new Date(event.start.date)
    : new Date(event.start.dateTime!);

  const sameDayBookings = bookings.filter((b) => {
    const bt = new Date(b.booking_time);
    return (
      bt.getFullYear() === eventDate.getFullYear() &&
      bt.getMonth() === eventDate.getMonth() &&
      bt.getDate() === eventDate.getDate() &&
      b.google_event_id !== event.id
    );
  });

  const handleLink = async (bookingId: string) => {
    setLinking(bookingId);
    try {
      await linkGoogleEvent(bookingId, event.id);
      toast.success("Prenotazione collegata");
      onLinked();
    } catch {
      toast.error("Errore nel collegamento");
    } finally {
      setLinking(null);
    }
  };

  const handleUnlink = async (bookingId: string) => {
    setUnlinking(bookingId);
    try {
      await unlinkGoogleEvent(bookingId);
      toast.success("Collegamento rimosso");
      onLinked();
    } catch {
      toast.error("Errore nella rimozione");
    } finally {
      setUnlinking(null);
    }
  };

  const handleImport = async () => {
    if (!selectedLocationId || !importName.trim() || !importGuests) return;
    const guestsCount = parseInt(importGuests, 10);
    if (isNaN(guestsCount) || guestsCount < 1) return;

    const bookingTime = event.start.dateTime ?? event.start.date;
    if (!bookingTime) {
      toast.error("Impossibile determinare l'orario dell'evento");
      return;
    }

    setImporting(true);
    try {
      const result = await createBookingFromGcalEvent({
        locationId: selectedLocationId,
        guestName: importName.trim(),
        guestPhone: importPhone.trim(),
        guestsCount,
        bookingTime: new Date(bookingTime).toISOString(),
        googleEventId: event.id,
        notes: event.description,
      });

      if (!result.success) {
        toast.error(result.error ?? "Errore nella creazione");
        return;
      }

      toast.success("Prenotazione creata e collegata all'evento");
      setShowImport(false);
      setImportName("");
      setImportPhone("");
      setImportGuests("2");
      onLinked();
      onClose();
    } finally {
      setImporting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { setShowImport(false); onClose(); } }}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0 overflow-y-auto">
        {/* Header */}
        <SheetHeader className="p-6 border-b-2">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <Calendar className="w-4 h-4 text-violet-500" />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <SheetTitle className="text-left leading-tight">
                {event.summary ?? "(Nessun titolo)"}
              </SheetTitle>
              <p className="text-sm text-muted-foreground capitalize">
                {formatEventTime(event)}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-6">
          {/* Event details */}
          <div className="flex flex-col gap-2.5">
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{event.location}</span>
              </div>
            )}
            {event.description && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span className="whitespace-pre-wrap line-clamp-4">{event.description}</span>
              </div>
            )}
            {event.htmlLink && (
              <a
                href={event.htmlLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-violet-600 hover:underline w-fit"
              >
                <ExternalLink className="w-3 h-3" />
                Apri in Google Calendar
              </a>
            )}
          </div>

          {/* Linked booking */}
          {linkedBooking && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Prenotazione collegata</h3>
                <Badge
                  variant="secondary"
                  className="text-violet-600 bg-violet-50 border-violet-200 text-[10px]"
                >
                  <Link2 className="w-2.5 h-2.5 mr-1" />
                  Collegato
                </Badge>
              </div>
              <BookingCard
                booking={linkedBooking}
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-2 rounded-xl h-8 text-destructive hover:text-destructive shrink-0"
                    onClick={() => handleUnlink(linkedBooking.id)}
                    disabled={unlinking === linkedBooking.id}
                  >
                    {unlinking === linkedBooking.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Link2Off className="w-3.5 h-3.5" />
                    )}
                  </Button>
                }
              />
            </div>
          )}

          {/* Same-day bookings to link */}
          {!event.start.date && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold">
                {linkedBooking
                  ? "Altre prenotazioni in questa giornata"
                  : "Collega a una prenotazione"}
              </h3>

              {sameDayBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nessuna prenotazione trovata per questo giorno.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {sameDayBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      action={
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-2 rounded-xl h-8 shrink-0"
                          onClick={() => handleLink(booking.id)}
                          disabled={!!linking}
                        >
                          {linking === booking.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Link2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Import as booking */}
          {!linkedBooking && !event.start.date && (
            <div className="flex flex-col gap-3 border-2 rounded-2xl p-4">
              <button
                className="flex items-center justify-between w-full text-left"
                onClick={() => setShowImport((v) => !v)}
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-semibold">Importa come prenotazione</span>
                </div>
                {showImport ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {showImport && (
                <div className="flex flex-col gap-3 pt-1">
                  <p className="text-xs text-muted-foreground">
                    Crea una prenotazione Smartables collegata a questo evento.
                    L'orario ({formatEventTime(event)}) viene usato automaticamente.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Nome *</Label>
                      <Input
                        value={importName}
                        onChange={(e) => setImportName(e.target.value)}
                        placeholder="Mario Rossi"
                        className="h-8 text-sm border-2"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Coperti *</Label>
                      <Input
                        type="number"
                        min={1}
                        value={importGuests}
                        onChange={(e) => setImportGuests(e.target.value)}
                        className="h-8 text-sm border-2"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Telefono (opzionale)</Label>
                    <Input
                      value={importPhone}
                      onChange={(e) => setImportPhone(e.target.value)}
                      placeholder="+39 333 1234567"
                      className="h-8 text-sm border-2"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={handleImport}
                    disabled={importing || !importName.trim() || !importGuests}
                  >
                    {importing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                    ) : (
                      <Download className="w-3.5 h-3.5 mr-2" />
                    )}
                    Crea prenotazione
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function BookingCard({
  booking,
  action,
}: {
  booking: Booking;
  action: React.ReactNode;
}) {
  const time = format(new Date(booking.booking_time), "HH:mm");
  return (
    <div className="flex items-center gap-3 p-3 border-2 rounded-2xl bg-card">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">{booking.guest_name}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {time}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" />
            {booking.guests_count} pers.
          </span>
        </div>
      </div>
      {action}
    </div>
  );
}
