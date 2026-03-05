import { BookingWithCustomer } from '@/types/components'
import { format, isSameDay, isToday, isTomorrow } from 'date-fns'
import { it } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { deleteBooking } from '@/utils/supabase/actions'
import ActionSheet from '../utility/action-sheet'
import { Phone, Grid } from 'lucide-react'
import { mapStatusLabel } from '@/lib/utils'
import { formatPhoneNumber } from 'react-phone-number-input'

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
        className="w-full sm:w-auto rounded-xl px-6 font-semibold"
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
        className="w-full sm:w-auto rounded-xl px-6 font-semibold"
        onClick={async () => {
          const res = await deleteBooking(selectedBooking.id)
          if (res?.error) {
            console.error(res.error)
          } else {
            setIsSheetOpen(false)
            if (onBookingDeleted) onBookingDeleted()
          }
        }}
      >
        Elimina
      </Button>
    </>
  ) : null;

  return (
    <ActionSheet
      open={isSheetOpen}
      onOpenChange={setIsSheetOpen}
      title="Dettaglio Prenotazione"
      description="Informazioni e gestione della prenotazione"
      actionButtons={actionButtons}
    >
      {selectedBooking && (
        <div className="flex flex-col space-y-5">
          <div className="bg-white rounded-3xl border border-border shadow-sm">
            <div className="flex items-center justify-between border-b bg-zinc-100/50 rounded-t-3xl px-4 py-5 shadow-sm">
              <p className='text-sm font-bold uppercase tracking-wider'>Stato Prenotazione</p>
              <div className={`px-4 py-1.5 rounded-full ${selectedBooking.status === "confirmed" ? "bg-[#cdf1bf]" :
                selectedBooking.status === "arrived" ? "bg-blue-100" :
                  "bg-zinc-100"
                }`}>
                <span className={`text-[12px] font-bold uppercase tracking-wider ${selectedBooking.status === "confirmed" ? "text-[#287907]" :
                  selectedBooking.status === "arrived" ? "text-blue-700" :
                    "text-zinc-600"
                  }`}>
                  {mapStatusLabel(selectedBooking.status)}
                </span>
              </div>
            </div>
            <div className='p-6'>
              <div className="flex justify-between items-center border-b pb-4 mb-4">
                <div>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Cliente</p>
                  <h4 className="text-2xl font-bold text-foreground tracking-tight">{selectedBooking.guest_name}</h4>
                  <p className="text-sm font-light text-foreground tracking-tight mt-2">{formatPhoneNumber(selectedBooking.guest_phone)}</p>
                </div>
                <a href={`tel:${selectedBooking.guest_phone}`} className="flex items-center justify-center w-12 h-12 bg-[#cdf1bf]/30 rounded-full border border-[#cdf1bf]/50 ml-2 hover:bg-[#cdf1bf]/50 transition-colors">
                  <Phone className="w-5 h-5 text-[#287907]" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col justify-center border-r pr-5">
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Data e Ora</p>
                  <div className="flex flex-col">
                    <p className="text-3xl font-extrabold tracking-tighter text-foreground">
                      {format(new Date(selectedBooking.booking_time), "HH:mm")}
                    </p>
                    <p className="text-sm font-bold mt-0.5 capitalize text-zinc-500">
                      {isToday(new Date(selectedBooking.booking_time)) ? "Oggi" : isTomorrow(new Date(selectedBooking.booking_time)) ? "Domani" : format(new Date(selectedBooking.booking_time), "EEE d MMMM", { locale: it })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col justify-between">
                  <p className="text-sm font-bold uppercase tracking-wider mb-2">Ospiti</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-black tracking-tighter text-foreground">
                      {selectedBooking.guests_count}
                    </p>
                    <span className="text-sm font-bold text-zinc-500 uppercase">persone</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-black tracking-tighter text-foreground">
                      {selectedBooking.children_count || 0}
                    </p>
                    <span className="text-sm font-bold text-zinc-500 uppercase">bambini</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="rounded-3xl border border-border">
            <p className="text-sm bg-zinc-100/50 font-bold rounded-t-3xl px-4 py-5 uppercase tracking-wider border-b">Note Prenotazione</p>
            <p className="text-base p-4 leading-relaxed font-medium text-muted-foreground">{selectedBooking.notes || "Nessuna nota comunicata."}</p>
          </div>

          <div className="rounded-3xl border border-border">
            <p className="text-sm bg-zinc-100/50 font-bold rounded-t-3xl px-4 py-5 uppercase tracking-wider border-b">Intolleranze / Allergie</p>
            <p className="text-base p-4 leading-relaxed font-medium text-muted-foreground">{selectedBooking.allergies || "Nessuna allergia comunicata."}</p>
          </div>

          {/* Extra / Stats Cliente */}
          {selectedBooking.customer && (
            <div className="rounded-3xl border border-border">
              <p className="text-sm bg-zinc-100/50 font-bold rounded-t-3xl px-4 py-5 uppercase tracking-wider border-b">Statistiche Cliente</p>
              <div className="grid grid-cols-3 gap-2 p-4">
                <div>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Visite Totali</span>
                  <span className="font-bold text-2xl tracking-tight">{selectedBooking.customer.total_visits}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Spesa media</span>
                  <span className="font-bold text-2xl tracking-tight">34€</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Coperti medi</span>
                  <span className="font-bold text-2xl tracking-tight">4</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between flex-wrap gap-4 px-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Canale</span>
              <span className="text-sm font-bold text-foreground px-3 py-1 bg-zinc-100 rounded-lg capitalize">
                {selectedBooking.source ? selectedBooking.source.replace('_', ' ') : 'Sconosciuta'}
              </span>
            </div>

            {selectedBooking.table_id && (
              <div className="flex items-center bg-[#cdf1bf]/30 px-3 py-1.5 rounded-full border border-[#cdf1bf]/50">
                <Grid className="w-4 h-4 text-[#287907] mr-1.5" />
                <span className="text-[#287907] font-bold text-[11px] uppercase tracking-wider">Tavolo Assegnato</span>
              </div>
            )}
          </div>

        </div>
      )}
    </ActionSheet>
  )
}

export default DetailsSheet