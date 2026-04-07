"use client"

import { Booking } from '@/types/general'
import { format, isToday, isTomorrow } from 'date-fns'
import { mapBookingStatus } from '@/lib/maps'
import { it } from 'date-fns/locale'
import { CircleQuestionMark, Trash2 } from 'lucide-react'
import NoItems from '../utility/no-items'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { Checkbox } from '../ui/checkbox'
import { Button } from '../ui/button'
import { useState, useTransition } from 'react'
import { deleteBookings } from '@/app/actions/bookings'
import { toast } from 'sonner'
import ConfirmDialog from '../utility/confirm-dialog'

const ReservationsTable = ({
  data,
  selectedBooking,
  isSheetOpen,
  handleRowClick,
  context = 'default',
  isAdmin,
  onDelete,
}: {
  data: Booking[] | null
  selectedBooking?: Booking | null
  isSheetOpen?: boolean
  handleRowClick?: (booking: Booking) => void
  context: 'default' | 'dashboard'
  isAdmin?: boolean
  onDelete?: () => void
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const toggleAll = (items: Booking[]) => {
    setSelected(prev =>
      prev.size === items.length ? new Set() : new Set(items.map(b => b.id))
    )
  }

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDelete = () => {
    const ids = Array.from(selected)
    startTransition(async () => {
      const result = await deleteBookings(ids)
      if (result.success) {
        toast.success('Prenotazioni eliminate con successo')
        setSelected(new Set())
        onDelete?.()
      } else {
        toast.error(result.error)
      }
    })
  }

  if (context === 'dashboard') {
    return (
      <div>
        {data && data.length > 0 ? (
          <div>
            <Table className='border-0! rounded-none!'>
              <TableHeader className='border-0!'>
                <TableRow>
                  <TableHead className="px-6">Ospite</TableHead>
                  <TableHead className="px-6">Data e Ora</TableHead>
                  <TableHead className="px-6">Persone</TableHead>
                  <TableHead className="px-6">Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((booking: Booking) => (
                  <TableRow
                    key={booking.id}
                    style={{ backgroundColor: selectedBooking?.id === booking.id && isSheetOpen ? '#f0f0f020' : '' }}
                    className={handleRowClick ? 'cursor-pointer' : ''}
                    onClick={() => handleRowClick?.(booking)}
                  >
                    <TableCell className="px-6">
                      <div className="font-medium">{booking.guest_name}</div>
                      <div className="text-xs text-muted-foreground">{booking.guest_phone}</div>
                    </TableCell>
                    <TableCell className="px-6">
                      {isToday(new Date(booking.booking_time)) && <span className='capitalize'>Oggi, </span>}
                      {isTomorrow(new Date(booking.booking_time)) && <span className='capitalize'>Domani, </span>}
                      <span className='capitalize'>
                        {format(new Date(booking.booking_time), isToday(new Date(booking.booking_time)) ? 'HH:mm' : isTomorrow(new Date(booking.booking_time)) ? 'HH:mm' : 'EEEE, HH:mm', { locale: it })}
                      </span>
                    </TableCell>
                    <TableCell className="px-6">{booking.guests_count}</TableCell>
                    <TableCell className="px-6">
                      <div className="capitalize">{mapBookingStatus(booking.status)}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-3xl justify-center p-12 bg-card min-h-100 border-0!">
            <div className="bg-primary/10 border-2 border-primary/30 p-4 mb-4 rounded-full">
              <CircleQuestionMark className="w-10 h-10 text-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nessuna prenotazione</h3>
            <p className='text-muted-foreground text-center max-w-md mb-0'>
              Non ci sono prenotazioni per questo periodo.
            </p>
          </div>
        )}
      </div>
    )
  }

  // default context
  if (!data || data.length === 0) {
    return (
      <NoItems
        icon={<CircleQuestionMark size={28} className='text-primary' />}
        title="Nessuna prenotazione"
        description="Non ci sono prenotazioni per questo periodo."
      />
    )
  }

  const allSelected = data.length > 0 && selected.size === data.length

  return (
    <div className="rounded-3xl border-2 bg-card overflow-hidden">
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-6 py-3 bg-muted/30 border-b-2">
          <span className="text-sm text-muted-foreground">
            {selected.size} selezionat{selected.size === 1 ? 'a' : 'e'}
          </span>
          {isAdmin && (
            <ConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title="Elimina prenotazioni"
              description={`Sei sicuro di voler eliminare ${selected.size} prenotazion${selected.size === 1 ? 'e' : 'i'}? L'operazione non può essere annullata.`}
              confirmLabel="Elimina"
              cancelLabel="Annulla"
              variant="destructive"
              onConfirm={handleDelete}
              disabled={isPending}
              trigger={
                <Button size="sm" variant="destructive" disabled={isPending}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Elimina
                </Button>
              }
            />
          )}
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 px-4">
              <Checkbox
                checked={allSelected}
                onCheckedChange={() => toggleAll(data)}
                aria-label="Seleziona tutte"
              />
            </TableHead>
            <TableHead className="px-4">Ospite</TableHead>
            <TableHead className="px-4">Data e Ora</TableHead>
            <TableHead className="px-4">Persone</TableHead>
            <TableHead className="px-4">Stato</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((booking: Booking) => (
            <TableRow
              key={booking.id}
              style={{ backgroundColor: selectedBooking?.id === booking.id && isSheetOpen ? '#f0f0f020' : '' }}
              className={handleRowClick ? 'cursor-pointer' : ''}
              onClick={() => handleRowClick?.(booking)}
            >
              <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selected.has(booking.id)}
                  onCheckedChange={() => toggleOne(booking.id)}
                  aria-label="Seleziona"
                />
              </TableCell>
              <TableCell className="px-4">
                <div className="font-medium">{booking.guest_name}</div>
                <div className="text-xs text-muted-foreground">{booking.guest_phone}</div>
              </TableCell>
              <TableCell className="px-4">
                {isTomorrow(new Date(booking.booking_time)) && <span className='capitalize'>Domani, </span>}
                <span className='capitalize'>
                  {format(new Date(booking.booking_time), isTomorrow(new Date(booking.booking_time)) ? 'HH:mm' : 'EEEE, HH:mm', { locale: it })}
                </span>
              </TableCell>
              <TableCell className="px-4">{booking.guests_count}</TableCell>
              <TableCell className="px-4">
                <div className="capitalize">{mapBookingStatus(booking.status)}</div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default ReservationsTable
