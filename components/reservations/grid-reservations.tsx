import { Booking } from '@/types/general'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card'
import { Badge } from '../ui/badge'
import { format, isTomorrow } from 'date-fns'
import { it } from 'date-fns/locale'
import { mapBookingStatus } from '@/lib/maps'
import { CalendarClock, Users, Phone, NotebookText, CircleQuestionMark } from 'lucide-react'
import NoItems from '../utility/no-items'

const GridReservations = ({
  data,
  handleRowClick
}: {
  data: Booking[] | null
  handleRowClick: (booking: Booking) => void
}) => {

  if (!data || data.length === 0) {
    return (
      <NoItems
        icon={<CircleQuestionMark className="w-10 h-10 text-foreground" />}
        title="Nessuna prenotazione"
        description="Non ci sono prenotazioni per questo periodo."
      />
    )
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
      {data.map((booking) => (
        <Card
          key={booking.id}
          onClick={() => handleRowClick?.(booking)}
          className="cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md border-2"
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start gap-2">
              <CardTitle className="text-lg font-semibold truncate leading-tight">
                {booking.guest_name}
              </CardTitle>
              <Badge variant="outline" className="capitalize shrink-0">
                {mapBookingStatus(booking.status)}
              </Badge>
            </div>
            {booking.guest_phone && (
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Phone className="w-3.5 h-3.5 mr-1" />
                <span>{booking.guest_phone}</span>
              </div>
            )}
          </CardHeader>
          <CardContent className="pb-4 space-y-3">
            <div className="flex items-center text-sm">
              <CalendarClock className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className='capitalize font-medium'>
                {isTomorrow(new Date(booking.booking_time)) && "Domani, "}
                {format(new Date(booking.booking_time), isTomorrow(new Date(booking.booking_time)) ? 'HH:mm' : 'EEEE, HH:mm', { locale: it })}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <Users className="w-4 h-4 mr-2 text-muted-foreground" />
              <span>{booking.guests_count} persone</span>
            </div>
            {booking.notes && (
              <div className="flex items-start text-sm mt-3 pt-3 border-t">
                <NotebookText className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-muted-foreground" />
                <span className="line-clamp-2 text-muted-foreground italic">
                  {booking.notes}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default GridReservations