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
import { searchCustomers } from '@/app/actions/customers'
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
  phone: string
}

interface ReservationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  booking?: BookingWithCustomer | null // Optional booking to edit
}

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
  const [notes, setNotes] = useState('')

  // Known Customer Logic
  const [isKnownCustomer, setIsKnownCustomer] = useState(false)
  const [openCombobox, setOpenCombobox] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [customerSearch, setCustomerSearch] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])

  // Debounced Search for Customers
  useEffect(() => {
    if (!isKnownCustomer) return

    const timer = setTimeout(async () => {
      if (customerSearch.length > 1) {
        const results = await searchCustomers(customerSearch)
        setCustomers(results || [])
      } else {
        setCustomers([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [customerSearch, isKnownCustomer])

  // Reset form when sheet closes or booking changes
  useEffect(() => {
    if (open) {
      if (booking) {
        // Edit Mode
        setName(booking.guest_name || '')
        setPhone(booking.guest_phone || '')
        setGuests(booking.guests_count || undefined)
        setDate(booking.booking_time ? new Date(booking.booking_time) : undefined)
        setNotes(booking.notes || '')

        if (booking.customer_id) {
          setIsKnownCustomer(true)
          setSelectedCustomer(booking.customer_id)
          // Ideally we should pre-fetch the customer name if it's not in booking.guest_name exactly as we want?
          // But booking.guest_name should be correct.
          // We set the search value to the name so it shows up in combobox trigger if logic uses it?
          // The Combobox logic above uses `customers.find` which might be empty initially.
          // We need to initialize the customers list or at least handle the display of selectedCustomer.
          // Hack: we can push the current customer into the list so it displays correctly
          if (booking.customer) {
            setCustomers([{
              id: booking.customer.id,
              name: booking.customer.name,
              phone: booking.customer.phone_number
            }])
          }
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
        setNotes('')
        setIsKnownCustomer(false)
        setSelectedCustomer(null)
        setCustomerSearch('')
        setCustomers([])
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
    if (date) formData.set('date', date.toISOString())
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
        <div className="flex flex-row items-center rounded-xl dark:bg-input/30 bg-background justify-between border p-3 shadow-sm">
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
                      ? customers.find((customer) => customer.id === selectedCustomer)?.name || name // Fallback to name if not in list yet
                      : "Seleziona cliente..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align='start' className="w-[268px] p-0 bg-card!">
                  <Command className='bg-background dark:bg-card/30 rounded-xl'>
                    <CommandInput
                      placeholder="Cerca cliente..."
                      value={customerSearch}
                      onValueChange={setCustomerSearch}
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>Nessun cliente trovato.</CommandEmpty>
                      <CommandGroup>
                        {customers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={customer.name}
                            onSelect={() => {
                              setSelectedCustomer(customer.id)
                              setName(customer.name)
                              setPhone(customer.phone || '')
                              setOpenCombobox(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCustomer === customer.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {customer.name} ({customer.phone})
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

        <div className='grid sm:grid-cols-2 gap-2'>
          <div className='flex flex-col items-start gap-2'>
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
          <DateTimePicker
            value={date}
            onChange={setDate}
          />
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