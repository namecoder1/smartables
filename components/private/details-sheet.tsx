import { BookingWithCustomer } from '@/types/components'
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Clock, Info, Notebook, Phone, User, Users } from "lucide-react"
import { getStatusBadgeVariant, mapStatusLabel } from '@/lib/utils'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { deleteBooking } from '@/utils/supabase/actions'
import ActionSheet from '../utility/action-sheet'

interface DetailsSheetProps {
  isSheetOpen: boolean
  setIsSheetOpen: (open: boolean) => void
  selectedBooking: BookingWithCustomer | null
  onBookingDeleted?: () => void
  onEdit?: (booking: BookingWithCustomer) => void
}

const DetailsSheet = ({
  isSheetOpen,
  setIsSheetOpen,
  selectedBooking,
  onBookingDeleted,
  onEdit,
}: DetailsSheetProps) => {

  const actionButtons = selectedBooking ? (
    <>
      <Button
        variant="outline"
        className="w-full sm:w-auto"
        onClick={() => {
          if (onEdit) {
            onEdit(selectedBooking)
          }
        }}
      >
        Modifica
      </Button>
      <Button
        variant="destructive"
        className="w-full sm:w-auto"
        onClick={async () => {
          const res = await deleteBooking(selectedBooking.id)
          if (res?.error) {
            // toast.error(res.error)
            console.error(res.error)
          } else {
            setIsSheetOpen(false)
            if (onBookingDeleted) onBookingDeleted()
          }
        }}
      >
        Elimina Prenotazione
      </Button>
    </>
  ) : null;

  return (
    <ActionSheet
      open={isSheetOpen}
      onOpenChange={setIsSheetOpen}
      title="Dettagli Prenotazione"
      description="Informazioni complete sulla prenotazione selezionata."
      actionButtons={actionButtons}
    >
      {selectedBooking && (
        <div className="space-y-6">
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

          <Separator />

          <div className="grid grid-cols-2 gap-4">
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

          <div>
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

          <div className='flex flex-col gap-4'>
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
        </div>
      )}
    </ActionSheet>
  )
}

export default DetailsSheet