
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Booking } from "@/types/general"
import { format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface BookingsListProps {
  bookings: Booking[]
}

export function BookingsList({ bookings }: BookingsListProps) {
  return (
    <Card className="h-full"> {/* Adjust query cols as needed, currently designed to fill available space or be part of grid */}
      <CardHeader>
        <CardTitle>Prenotazioni oggi</CardTitle>
        <CardDescription>
          Hai {bookings.length} prenotazion{bookings.length === 1 ? "e" : "i"} oggi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {bookings.length === 0 && (
            <p className="text-sm text-muted-foreground">Nessuna prenotazione trovata oggi.</p>
          )}
          {bookings.map((booking) => (
            <div key={booking.id} className="flex items-center">
              <div className="flex items-center gap-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/avatars/01.png" alt="Avatar" />
                  <AvatarFallback>{booking.guest_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">{booking.guest_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.guest_phone}
                  </p>
                </div>
              </div>
              <div className="ml-auto font-medium">
                {format(new Date(booking.booking_time), "HH:mm")}
                <span className="ml-2 text-muted-foreground font-normal">
                  ({booking.guests_count} ppl)
                </span>
              </div>
            </div>
          ))}
        </div>
        {/* TODO: Add 'View All' button if list is long? */}
      </CardContent>
    </Card>
  )
}
