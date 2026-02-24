"use client"

import { Booking } from '@/types/general'
import { format, isToday, isTomorrow } from 'date-fns'
import { mapBookingStatus } from '@/lib/maps'
import { it } from 'date-fns/locale'
import { CircleQuestionMark } from 'lucide-react'
import NoItems from '../utility/no-items'

const ReservationsTable = ({
  data,
  selectedBooking,
  isSheetOpen,
  handleRowClick,
  context = 'default'
}: {
  data: Booking[] | null,
  selectedBooking?: Booking | null,
  isSheetOpen?: boolean,
  handleRowClick?: (booking: Booking) => void,
  context: 'default' | 'dashboard'
}) => {

  if (context === 'dashboard') {
    return (
      <div>
        {data && data.length > 0 ? (
          <div className="bg-card">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b-2">
                  <tr className="border-b-2 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                      Ospite
                    </th>
                    <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                      Data e Ora
                    </th>
                    <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                      Persone
                    </th>
                    <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                      Stato
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-b-0">
                  {data.map((booking: Booking) => (
                    <tr
                      key={booking.id}
                      style={{ backgroundColor: selectedBooking?.id === booking.id && isSheetOpen ? '#f0f0f020' : '' }}
                      className={`border-b-2 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${handleRowClick ? 'cursor-pointer' : ''}`}
                      onClick={() => handleRowClick?.(booking)}
                    >
                      <td className="p-4 px-6 align-middle [&:has([role=checkbox])]:pr-0">
                        <div className="font-medium">{booking.guest_name}</div>
                        <div className="text-xs text-muted-foreground">{booking.guest_phone}</div>
                      </td>
                      <td className="p-4 px-6 align-middle [&:has([role=checkbox])]:pr-0">
                        {isToday(new Date(booking.booking_time)) && <span className='capitalize'>Oggi, </span>}
                        {isTomorrow(new Date(booking.booking_time)) && <span className='capitalize'>Domani, </span>}
                        <span className='capitalize'>
                          {format(new Date(booking.booking_time), isToday(new Date(booking.booking_time)) ? 'HH:mm' : isTomorrow(new Date(booking.booking_time)) ? 'HH:mm' : 'EEEE, HH:mm', { locale: it })}
                        </span>
                      </td>
                      <td className="p-4 px-6 align-middle [&:has([role=checkbox])]:pr-0">
                        {booking.guests_count}
                      </td>
                      <td className="p-4 px-6 align-middle [&:has([role=checkbox])]:pr-0">
                        <div className="capitalize">{mapBookingStatus(booking.status)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <NoItems 
            icon={<CircleQuestionMark className="w-10 h-10 text-foreground" />}
            title="Nessuna prenotazione"
            description="Non ci sono prenotazioni per questo periodo."
          />
        )}
      </div>
    )
  }

  return (
    <div>
      {data && data.length > 0 ? (
        <div className="rounded-xl border-2 bg-card">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b-2">
                <tr className="border-b-2 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
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
              <tbody className="[&_tr:last-child]:border-b-0">
                {data.map((booking: Booking) => (
                  <tr
                    key={booking.id}
                    style={{ backgroundColor: selectedBooking?.id === booking.id && isSheetOpen ? '#f0f0f020' : '' }}
                    className={`border-b-2 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${handleRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => handleRowClick?.(booking)}
                  >
                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                      <div className="font-medium">{booking.guest_name}</div>
                      <div className="text-xs text-muted-foreground">{booking.guest_phone}</div>
                    </td>
                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                      {isTomorrow(new Date(booking.booking_time)) && <span className='capitalize'>Domani, </span>}
                      <span className='capitalize'>
                        {format(new Date(booking.booking_time), isTomorrow(new Date(booking.booking_time)) ? 'HH:mm' : 'EEEE, HH:mm', { locale: it })}
                      </span>
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
        <NoItems 
          icon={<CircleQuestionMark className="w-10 h-10 text-foreground" />}
          title="Nessuna prenotazione"
          description="Non ci sono prenotazioni per questo periodo."
        />
      )}
    </div>
  )
}

export default ReservationsTable