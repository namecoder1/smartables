import React, { useState, useEffect, useTransition } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { PhoneInput } from '@/components/ui/phone-input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createBooking } from '@/app/actions/bookings'
import { searchCustomers } from '@/app/actions/customers'
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

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

type Customer = {
  id: string
  name: string
  phone: string
}

interface ReservationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const ReservationSheet = ({
  open,
  onOpenChange,
  onSuccess,
}: ReservationSheetProps) => {
  const [isPending, startTransition] = useTransition()

  // Form State
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [guests, setGuests] = useState('')
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

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      setName('')
      setPhone('')
      setGuests('')
      setDate(undefined)
      setNotes('')
      setIsKnownCustomer(false)
      setSelectedCustomer(null)
      setCustomerSearch('')
      setCustomers([])
    }
  }, [open])

  const handleSubmit = async (formData: FormData) => {
    // Aggiungi i valori dello state controllato al FormData
    formData.set('isKnownCustomer', String(isKnownCustomer))
    if (selectedCustomer) formData.set('selectedCustomer', selectedCustomer)
    formData.set('name', name)
    formData.set('phone', phone)
    formData.set('guests', guests)
    if (date) formData.set('date', date.toISOString())
    formData.set('notes', notes)

    startTransition(async () => {
      const result = await createBooking({}, formData)

      if (result.success) {
        toast.success("Prenotazione aggiunta con successo")
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        toast.error(result.error || "Errore durante la creazione della prenotazione")
      }
    })
  }

  return (
    <ActionSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Aggiungi prenotazione"
      description="Inserisci le informazioni per la prenotazione"
      formAction={handleSubmit}
      submitButton={<Button type="submit" disabled={isPending}>{isPending ? 'Salvataggio...' : 'Aggiungi'}</Button>}
    >
      <div className='flex flex-col gap-4'>
        <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
          <div className="space-y-0.5">
            <Label className='text-base'>Conosco già il cliente</Label>
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
                      ? customers.find((customer) => customer.id === selectedCustomer)?.name
                      : "Seleziona cliente..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align='start' className="w-[268px] p-0">
                  <Command>
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
                placeholder="+39 333 1234567"
                required
              />
            </div>
          </div>
        )}

        <div className='grid grid-cols-2 gap-2'>
          <div className='flex flex-col items-start gap-2'>
            <Label>Numero di coperti</Label>
            <Input
              type="number"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              placeholder="2"
              min="1"
              required
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