import React, { useState, useEffect, useTransition } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { PhoneInput } from '@/components/ui/phone-input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createBooking, updateBooking } from '@/app/actions/bookings'
import { getAllCustomers } from '@/app/actions/customers'
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
// import { BookingWithCustomer } from '@/types/components' // Assuming this type exists or we define it

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import ActionSheet from './action-sheet'
import { NumberInput } from '../ui/number-input'

// TODO: Import this from a shared types file
type BookingWithCustomer = any

type Customer = {
  id: string
  name: string
  phone_number: string
}

interface ReservationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  booking?: BookingWithCustomer | null // Optional booking to edit
}

import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { useLocationStore } from '@/store/location-store'

// ... existing imports

const ReservationSheet = ({
  open,
  onOpenChange,
  onSuccess,
  booking
}: ReservationSheetProps) => {
  const [isPending, startTransition] = useTransition()

  // Form State
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [guests, setGuests] = useState<number | undefined>(undefined)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [time, setTime] = useState<string>("")
  const [notes, setNotes] = useState('')

  // Known Customer Logic
  const [isKnownCustomer, setIsKnownCustomer] = useState(false)
  const [openCombobox, setOpenCombobox] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  // We don't need 'customerSearch' state for remote search anymore, 
  // but we can keep it if we want to control the input value manually. 
  // cmdk handles filtering 
  const [customers, setCustomers] = useState<Customer[]>([])

  const { getSelectedLocation } = useLocationStore()
  const location = getSelectedLocation()
  const openingHours = location?.opening_hours

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
  const timeSlots = React.useMemo(() => {
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

        // If we've reached or passed closing time, stop
        if (currentTimeValue >= closeTimeValue) break;

        const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        generatedSlots.push(timeString);

        // Increment by 15 minutes
        currentMinute += 15; // Changed to 15 mins for more granularity
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
    if (time && timeSlots.length > 0 && !timeSlots.includes(time)) {
      // If the exact time is not available, try to find the closest one or just reset?
      // For now, reset to force user selection
      setTime("");
    }
  }, [date, timeSlots]);

  // Fetch all customers when "Known Customer" is enabled
  useEffect(() => {
    if (isKnownCustomer && customers.length === 0) {
      const fetchCustomers = async () => {
        const results = await getAllCustomers()
        setCustomers(results || [])
      }
      fetchCustomers()
    }
  }, [isKnownCustomer, customers.length])

  // Reset form when sheet closes or booking changes
  useEffect(() => {
    if (open) {
      if (booking) {
        // Edit Mode
        setName(booking.guest_name || '')
        setPhone(booking.guest_phone || '')
        setGuests(booking.guests_count || undefined)

        if (booking.booking_time) {
          const dateObj = new Date(booking.booking_time);
          setDate(dateObj);
          setTime(format(dateObj, "HH:mm"));
        } else {
          setDate(undefined);
          setTime("");
        }

        setNotes(booking.notes || '')

        if (booking.customer_id) {
          setIsKnownCustomer(true)
          setSelectedCustomer(booking.customer_id)
          // Pre-fill customers list with at least the current one if not fetched yet
          // But our new logic fetches ALL customers when isKnownCustomer becomes true.
          // However, we might want to ensure the selected customer is visually available immediately if possible.
          // Since fetch is async, there might be a split second where it says "Select...".
          // We can let the effect handle it.
        } else {
          setIsKnownCustomer(false)
          setSelectedCustomer(null)
        }
      } else {
        // Create Mode - Reset
        setName('')
        setPhone('')
        setGuests(undefined)
        setDate(undefined)
        setTime("")
        setNotes('')
        setIsKnownCustomer(false)
        setSelectedCustomer(null)
        setCustomers([]) // Clear so we re-fetch if needed, or keep to cache? Re-fetch ensures fresh data.
      }
    }
  }, [open, booking])

  const handleSubmit = async (formData: FormData) => {
    // Aggiungi i valori dello state controllato al FormData
    formData.set('isKnownCustomer', String(isKnownCustomer))
    if (selectedCustomer) formData.set('selectedCustomer', selectedCustomer)
    formData.set('name', name)
    formData.set('phone', phone)
    formData.set('guests', String(guests || ''))

    if (date && time) {
      const [hours, minutes] = time.split(':').map(Number);
      const bookingDate = new Date(date);
      bookingDate.setHours(hours, minutes, 0, 0);
      formData.set('date', bookingDate.toISOString()); // The action likely expects 'date' or specific fields, checked below
    }

    formData.set('notes', notes)

    startTransition(async () => {
      let result;
      if (booking) {
        result = await updateBooking(booking.id, {}, formData)
      } else {
        result = await createBooking({}, formData)
      }

      if (result.success) {
        toast.success(booking ? "Prenotazione modificata" : "Prenotazione aggiunta con successo")
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        toast.error(result.error || "Errore durante il salvataggio")
      }
    })
  }

  return (
    <ActionSheet
      open={open}
      onOpenChange={onOpenChange}
      title={booking ? "Modifica prenotazione" : "Aggiungi prenotazione"}
      description={booking ? "Modifica i dettagli della prenotazione" : "Inserisci le informazioni per la prenotazione"}
      formAction={handleSubmit}
      actionButtons={<Button type="submit" disabled={isPending}>{isPending ? 'Salvataggio...' : (booking ? 'Salva modifiche' : 'Aggiungi')}</Button>}
    >
      <div className='flex flex-col gap-4'>
        <div className="flex flex-row items-center rounded-xl dark:bg-input/30 bg-background justify-between border p-4 shadow-sm">
          <div className="space-y-0.5">
            <Label className='text-base'>Cliente conosciuto?</Label>
          </div>
          <div className='flex gap-1.5'>
            <Button
              type="button"
              size="icon"
              onClick={() => setIsKnownCustomer(false)}
              variant={isKnownCustomer ? 'outline' : 'default'}
              aria-label="New Customer"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              onClick={() => setIsKnownCustomer(true)}
              variant={isKnownCustomer ? 'default' : 'outline'}
              aria-label="Known Customer"
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isKnownCustomer ? (
          <div className='grid grid-cols-2 gap-2'>
            <div className='flex flex-col items-start gap-2'>
              <Label>Cerca Cliente</Label>
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="w-full justify-between"
                  >
                    {selectedCustomer
                      ? customers.find((customer) => customer.id === selectedCustomer)?.name || name
                      : "Seleziona cliente..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align='start' className="w-[268px] p-0 bg-card!">
                  <Command className='bg-background dark:bg-card/30 rounded-xl'>
                    <CommandInput placeholder="Cerca cliente..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>Nessun cliente trovato.</CommandEmpty>
                      <CommandGroup className="max-h-[200px] overflow-auto">
                        {customers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={`${customer.name} ${customer.phone_number}`}
                            onSelect={() => {
                              setSelectedCustomer(customer.id)
                              setName(customer.name)
                              setPhone(customer.phone_number || '')
                              setOpenCombobox(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "h-4 w-4",
                                selectedCustomer === customer.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {customer.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className='flex flex-col items-start gap-2'>
              <Label>Numero di telefono</Label>
              <PhoneInput
                value={phone}
                onChange={setPhone}
                defaultCountry="IT"
                disabled
                className='w-full'
              />
            </div>
          </div>
        ) : (
          <div className='grid grid-cols-2 gap-2'>
            <div className='flex flex-col items-start gap-2'>
              <Label>Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mario Rossi"
                required
              />
            </div>
            <div className='flex flex-col items-start gap-2'>
              <Label>Numero di telefono</Label>
              <PhoneInput
                value={phone}
                onChange={setPhone}
                defaultCountry="IT"
                className='rounded-l-none'
                placeholder="+39 333 1234567"
                required
              />
            </div>
          </div>
        )}

        <div className='grid grid-cols-3 gap-2'>
          <div className='flex flex-col items-start gap-2 min-w-0'>
            <Label>Numero di coperti</Label>
            <NumberInput
              id='guests'
              name='guests'
              placeholder="2"
              required
              value={guests}
              onValueChange={setGuests}
              context="default"
              min={1}
            />
          </div>

          <div className="flex flex-col gap-2 min-w-0">
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal px-3",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">{date ? format(date, "PPP", { locale: it }) : "Scegli data"}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  locale={it}
                  disabled={(d) => {
                    // Optional: disable past dates?
                    // const today = new Date();
                    // today.setHours(0,0,0,0);
                    // if (d < today) return true;
                    return !isDayOpen(d);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-2 min-w-0">
            <Label>Orario</Label>
            <Select value={time} onValueChange={setTime} disabled={!date || timeSlots.length === 0}>
              <SelectTrigger className="w-full px-3 text-left">
                <div className="flex items-center min-w-0 overflow-hidden">
                  <Clock className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">
                    <SelectValue placeholder={!date ? "Manca data" : (timeSlots.length === 0 ? "Chiuso" : "Scegli...")} />
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent position='popper' align='end' className='max-h-96'>
                {timeSlots.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>


        <div className='flex flex-col items-start gap-2'>
          <Label>Note</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Allergie, preferenze, ecc..."
            rows={3}
          />
        </div>
      </div>
    </ActionSheet>
  )
}

export default ReservationSheet