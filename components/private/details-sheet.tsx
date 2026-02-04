import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { BookingWithCustomer } from '@/types/components'
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Clock, Info, Notebook, Phone, User, Users } from "lucide-react"
import { getStatusBadgeVariant, mapStatusLabel } from '@/lib/utils'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { deleteBooking } from '@/supabase/actions'

interface DetailsSheetProps {
  isSheetOpen: boolean
  setIsSheetOpen: (open: boolean) => void
  selectedBooking: BookingWithCustomer | null
}

const DetailsSheet = ({
  isSheetOpen,
  setIsSheetOpen,
  selectedBooking,
}: DetailsSheetProps) => {
  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetContent>
        <SheetHeader className='border-b'>
          <SheetTitle>Dettagli Prenotazione</SheetTitle>
          <SheetDescription>
            Informazioni complete sulla prenotazione selezionata.
          </SheetDescription>
        </SheetHeader>
        {selectedBooking && (
          <div className="mt-2 space-y-6">
            <div className="px-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  {selectedBooking.guest_name}
                </h3>
                <Badge variant={getStatusBadgeVariant(selectedBooking.status)}>
                  <div className="flex items-center gap-2">
                    {mapStatusLabel(selectedBooking.status)}
                  </div>
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{selectedBooking.guest_phone}</span>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 px-4">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" /> Ospiti
                </span>
                <p className="font-medium">{selectedBooking.guests_count} Persone</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Orario
                </span>
                <p className="font-medium">
                  {format(new Date(selectedBooking.booking_time), "d MMMM yyyy, HH:mm", { locale: it })}
                </p>
              </div>
            </div>

            <Separator />

            <div className='px-4'>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <User className="h-4 w-4" /> Dettagli Cliente
              </h4>
              {selectedBooking.customer ? (
                <div className="grid grid-cols-2 gap-4 p-2 text-sm bg-muted/50 pt-2 rounded-md">
                  <div>
                    <span className="text-xs text-muted-foreground block">Nome</span>
                    <span className="font-medium">{selectedBooking.customer.name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Telefono</span>
                    <span className="font-medium">{selectedBooking.customer.phone_number}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Visite Totali</span>
                    <span className="font-medium">{selectedBooking.customer.total_visits}</span>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-muted-foreground text-sm">Questo cliente non ha un profilo</p>
                </div>
              )}
            </div>

            <Separator />

            <div className='px-4 flex flex-col gap-4'>
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Notebook className="h-4 w-4" /> Note aggiuntive
                </span>
                <p className="bg-muted p-2 rounded text-sm block w-full overflow-hidden text-ellipsis">
                  {selectedBooking.notes || 'Nessuna nota'}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Info className="h-4 w-4" /> ID Prenotazione
                </span>
                <code className="bg-muted p-1 rounded text-xs block w-full overflow-hidden text-ellipsis">
                  {selectedBooking.id}
                </code>
              </div>
            </div>

            <SheetFooter>
              <Button variant="destructive" onClick={() => deleteBooking(selectedBooking.id)}>
                Elimina Prenotazione
              </Button>
            </SheetFooter>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default DetailsSheet