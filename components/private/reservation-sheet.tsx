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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      const formData = new FormData()
      formData.append('isKnownCustomer', String(isKnownCustomer))
      if (selectedCustomer) formData.append('selectedCustomer', selectedCustomer)

      formData.append('name', name)
      formData.append('phone', phone)
      formData.append('guests', guests)
      if (date) formData.append('date', date.toISOString())
      formData.append('notes', notes)

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Aggiungi prenotazione</SheetTitle>
          <SheetDescription>
            Inserisci le informazioni per la prenotazione
          </SheetDescription>
        </SheetHeader>
        <div className='px-4 mt-4'>
          <form onSubmit={handleSubmit} className='flex flex-col gap-4'>

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
                  <PopoverContent className="w-[300px] p-0">
                    <Command shouldFilter={false}>
                      <CommandInput placeholder="Cerca cliente..." onValueChange={setCustomerSearch} />
                      <CommandList>
                        <CommandEmpty>Nessun cliente trovato.</CommandEmpty>
                        <CommandGroup>
                          {customers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={customer.name}
                              onSelect={() => {
                                setSelectedCustomer(customer.id)
                                setOpenCombobox(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedCustomer === customer.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{customer.name}</span>
                                <span className="text-xs text-muted-foreground">{customer.phone}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            ) : (
              <>
                <div className='flex flex-col items-start gap-2'>
                  <Label htmlFor='name'>Nominativo ospite</Label>
                  <Input
                    id='name'
                    type='text'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className='flex flex-col items-start gap-2'>
                  <Label htmlFor='phone'>Telefono ospite</Label>
                  <PhoneInput
                    id='phone'
                    defaultCountry='IT'
                    value={phone}
                    onChange={(val) => setPhone(val || '')}
                  />
                </div>
              </>
            )}

            <div className='flex flex-col items-start gap-2'>
              <Label htmlFor='guests'>Numero di persone</Label>
              <Input
                id='guests'
                type='number'
                autoComplete='off'
                autoCorrect='off'
                autoCapitalize='off'
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                required
              />
            </div>
            <div className='flex flex-col items-start gap-2'>
              <DateTimePicker value={date} onChange={setDate} />
            </div>
            <div className='flex flex-col items-start gap-2'>
              <Label htmlFor='note'>Note</Label>
              <Textarea
                id='note'
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <SheetFooter className='flex flex-row ml-auto mt-4 w-full justify-end gap-2'>
              <Button type="button" onClick={() => onOpenChange(false)} variant="outline">Chiudi</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Salvataggio...' : 'Aggiungi'}</Button>
            </SheetFooter>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default ReservationSheet