"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, MapPin, Users, Clock, CheckCircle, Smartphone, User, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { createPublicBooking } from "@/app/actions/public-booking";
import { toast } from "sonner";
import { PhoneInput } from "@/components/ui/phone-input";
import Link from "next/link";

// Helper to determine text color based on background color
function getContrastColor(hexColor: string) {
  // Convert hex to RGB
  const r = parseInt(hexColor.substring(1, 3), 16);
  const g = parseInt(hexColor.substring(3, 5), 16);
  const b = parseInt(hexColor.substring(5, 7), 16);

  // Calculate brightness (YIQ formula)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

  return yiq >= 128 ? '#000000' : '#ffffff';
}

export function BookingForm({
  locationId,
  organizationId,
  primaryColor,
  locationName,
  locationSlug,
  openingHours
}: {
  locationId: string,
  organizationId: string,
  primaryColor: string,
  locationName: string,
  locationSlug: string,
  openingHours?: any // Using any for now to avoid import issues if type not exported, but ideally WeeklyHours
}) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>("");
  const [guests, setGuests] = useState<string>("2");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  // Helper to map JS Date day index to our Italian day keys
  const getDayKey = (d: Date) => {
    const days = [
      "domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"
    ];
    return days[d.getDay()];
  };

  // Helper to check if a day is open
  const isDayOpen = (d: Date) => {
    if (!openingHours) return true; // If no hours defined, assume open
    const dayKey = getDayKey(d);
    const slots = openingHours[dayKey];
    return Array.isArray(slots) && slots.length > 0;
  };

  // Generate time slots based on selected date and opening hours
  const timeSlots = useMemo(() => {
    if (!date || !openingHours) return [];

    const dayKey = getDayKey(date);
    const slots = openingHours[dayKey];

    if (!Array.isArray(slots) || slots.length === 0) return [];

    const generatedSlots: string[] = [];

    slots.forEach((slot: any) => {
      const [openHour, openMinute] = slot.open.split(':').map(Number);
      const [closeHour, closeMinute] = slot.close.split(':').map(Number);

      let currentHour = openHour;
      let currentMinute = openMinute;

      // Create Date objects for easy comparison and manipulation
      const closeTimeValue = closeHour * 60 + closeMinute;

      while (true) {
        const currentTimeValue = currentHour * 60 + currentMinute;

        // If we've reached or passed closing time, stop (assuming last slot must end before close)
        // Or should the last slot START before close? Usually standard is start time.
        // Let's say last booking must be at least 20 mins before close? 
        // For now, simple: start time < close time.
        if (currentTimeValue >= closeTimeValue) break;

        const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        generatedSlots.push(timeString);

        // Increment by 20 minutes
        currentMinute += 20;
        if (currentMinute >= 60) {
          currentHour += 1;
          currentMinute -= 60;
        }
      }
    });

    return generatedSlots.sort();
  }, [date, openingHours]);

  // Reset time if selected time is not in new slots when date changes
  useEffect(() => {
    if (time && !timeSlots.includes(time)) {
      setTime("");
    }
  }, [date, timeSlots, time]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !time || !name || !phone) {
      toast.error("Per favore compila tutti i campi obbligatori.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("locationId", locationId);
      formData.append("organizationId", organizationId);
      formData.append("locationSlug", locationSlug);
      formData.append("guestName", name);
      formData.append("guestPhone", phone);
      formData.append("guestsCount", guests);

      // Send date as YYYY-MM-DD
      const dateStr = format(date, "yyyy-MM-dd");
      formData.append("date", dateStr);
      formData.append("time", time);

      if (notes) formData.append("notes", notes);
      formData.append("honeypot", honeypot);

      const result = await createPublicBooking({ success: false, error: null }, formData, "whatsapp_auto");

      if (result.success) {
        setSuccess(true);
        toast.success("Prenotazione inviata con successo!");
      } else {
        toast.error(result.error || "Errore durante l'invio della prenotazione.");
      }

    } catch (error) {
      console.error(error);
      toast.error("Errore imprevisto durante la prenotazione.");
    } finally {
      setLoading(false);
    }
  };

  const primaryForeground = getContrastColor(primaryColor);

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-2 space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-2">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Grazie {name}!</h2>
        <p className="text-slate-600 max-w-xs mx-auto">
          La tua richiesta di prenotazione da <span className="font-semibold">{locationName}</span> è stata ricevuta.
        </p>
        <div className="bg-slate-50 p-4 rounded-xl w-full text-left space-y-2 text-sm border border-slate-100 mt-4">
          <div className="flex justify-between">
            <span className="text-slate-500">Data:</span>
            <span className="font-medium">{date && format(date, "d MMMM yyyy", { locale: it })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Ora:</span>
            <span className="font-medium">{time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Ospiti:</span>
            <span className="font-medium">{guests} Persone</span>
          </div>
        </div>
        <Button
          className="mt-6 w-full"
          variant="outline"
          onClick={() => {
            setSuccess(false);
            setDate(new Date());
            setTime("");
            setGuests("2");
            setNotes("");
          }}
        >
          Effettua un'altra prenotazione
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      style={{
        '--primary': primaryColor,
        '--primary-foreground': primaryForeground,
        '--ring': primaryColor,
      } as React.CSSProperties}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2">
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal py-6 px-4 rounded-xl border-2 border-slate-200",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: it }) : <span>Seleziona una data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div
                  style={{
                    '--primary': primaryColor,
                    '--primary-foreground': primaryForeground,
                    '--ring': primaryColor,
                  } as React.CSSProperties}
                >
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    locale={it}
                    disabled={(d) => {
                      // Disable past dates
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (d < today) return true;

                      // Disable closed days
                      return !isDayOpen(d);
                    }}
                    className="rounded-md border p-3 pointer-events-auto"
                    classNames={{
                      day_today: "bg-accent! text-accent-foreground",
                    }}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Orario</Label>
            <Select value={time} onValueChange={setTime} disabled={!date || timeSlots.length === 0}>
              <SelectTrigger className="w-full py-6 px-4 rounded-xl border-2 border-slate-200 focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <SelectValue placeholder={!date ? "Seleziona data" : (timeSlots.length === 0 ? "Chiuso" : "--")} />
                </div>
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ospiti</Label>
            <Select value={guests} onValueChange={setGuests}>
              <SelectTrigger className="w-full py-6 px-4 rounded-xl border-2 border-slate-200 focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <SelectValue placeholder="2" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "10+"].map(g => (
                  <SelectItem key={g} value={g.toString()}>{g} {g === 1 ? 'Persona' : 'Persone'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Nome e Cognome</Label>
          <div className="relative">
            <User className="absolute left-4 top-4.5 h-4 w-4 text-slate-400" />
            <Input
              id="name"
              placeholder="Mario Rossi"
              className="pl-10 py-6 rounded-xl border-slate-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefono</Label>
          <div className="relative">
            <PhoneInput
              placeholder="333 123 4567"
              value={phone}
              context="default"
              onChange={setPhone}
              defaultCountry="IT"
              className="rounded-xl border-2 border-slate-200 h-13"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Note (Opzionale)</Label>
          <Textarea
            id="notes"
            placeholder="Intolleranze, richieste speciali..."
            className="resize-none rounded-xl border-slate-200 min-h-[80px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Honeypot field - visually hidden */}
        <div className="sr-only" aria-hidden="true">
          <Input
            type="text"
            name="website"
            tabIndex={-1}
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full py-6 text-lg rounded-xl shadow-lg transition-transform active:scale-[0.98] mt-4"
        disabled={loading}
        style={{
          backgroundColor: primaryColor,
          color: primaryForeground,
          boxShadow: `0 10px 20px -5px ${primaryColor}50`
        }}
      >
        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
        Conferma Prenotazione
      </Button>

      <p className="text-xs text-center text-slate-400 px-4">
        Cliccando su conferma accetti i
        <Link href="/terms-of-service" className="text-primary hover:underline"> Termini di Servizio </Link>
        e la
        <Link href="/privacy-policy" className="text-primary hover:underline"> Privacy Policy </Link>
        di Smartables.
      </p>
    </form>
  );
}
