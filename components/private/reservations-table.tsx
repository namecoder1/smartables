"use client"

import React from 'react'
import { Booking } from '@/types/general'
import { formatDistanceToNow } from 'date-fns'
import { mapBookingStatus } from '@/lib/maps'
import { Button } from '../ui/button'
import { it } from 'date-fns/locale'

const ReservationsTable = ({
  data,
  selectedBooking,
  isSheetOpen,
  handleRowClick,
  setOpen
}: {
  data: Booking[] | null,
  selectedBooking?: Booking | null,
  isSheetOpen?: boolean,
  handleRowClick?: (booking: Booking) => void,
  setOpen?: (open: boolean) => void
}) => {
  return (
    <div>
      {data && data.length > 0 ? (
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                    Ospite
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                    Data e Ora
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                    Persone
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                    Stato
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {data.map((booking: Booking) => (
                  <tr
                    key={booking.id}
                    style={{ backgroundColor: selectedBooking?.id === booking.id && isSheetOpen ? '#f0f0f0' : '' }}
                    className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${handleRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => handleRowClick?.(booking)}
                  >
                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                      <div className="font-medium">{booking.guest_name}</div>
                      <div className="text-xs text-muted-foreground">{booking.guest_phone}</div>
                    </td>
                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                      {formatDistanceToNow(new Date(booking.booking_time), { addSuffix: true, locale: it })}
                    </td>
                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                      {booking.guests_count}
                    </td>
                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                      <div className="capitalize">{mapBookingStatus(booking.status)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex py-20 shrink-0 items-center justify-center rounded-md border border-dashed">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">Nessuna prenotazione</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Non ci sono prenotazioni per questo periodo.
            </p>
            {setOpen && (
              <Button variant="outline" onClick={() => setOpen(true)}>Aggiungi prenotazione</Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ReservationsTable