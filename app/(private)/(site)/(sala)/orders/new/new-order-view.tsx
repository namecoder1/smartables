'use client'

import ReservationsFloorPlan from '@/components/reservations/reservations-floor-plan';
import { useLocationStore } from '@/store/location-store';
import { Booking } from '@/types/general';
import React, { useState, useEffect, useCallback } from 'react';
import { ResponsiveDialog } from '@/components/utility/responsive-dialog';
import { TableOrdersPanel } from '@/components/reservations/table-orders-panel';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { createWalkInBooking } from '@/app/actions/booking-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const NewOrderView = () => {
  const { selectedLocationId } = useLocationStore()
  const [data, setData] = useState<Booking[] | null>(null)
  const [selectedDate] = useState<Date>(new Date()) // Always today for new orders usually
  const router = useRouter()

  const [selectedTable, setSelectedTable] = useState<any | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  const [showOrderSheet, setShowOrderSheet] = useState(false)
  const [showWalkinDialog, setShowWalkinDialog] = useState(false)
  const [walkinGuests, setWalkinGuests] = useState(2)
  const [creatingWalkin, setCreatingWalkin] = useState(false)

  const fetchData = useCallback(async () => {
    if (!selectedLocationId) return

    const params = new URLSearchParams()
    // By default fetch today's bookings
    params.append('location_id', selectedLocationId)
    const response = await fetch(`/api/supabase/bookings?${params.toString()}`)
    const fetchedData = await response.json()
    setData(fetchedData)
  }, [selectedLocationId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleTableSelect = (table: any, booking: Booking | undefined, hasActiveOrder: boolean) => {
    setSelectedTable(table)
    if (booking || hasActiveOrder) {
      setSelectedBooking(booking || null)
      setShowOrderSheet(true)
    } else {
      setShowWalkinDialog(true)
    }
  }

  const handleCreateWalkin = async () => {
    if (!selectedLocationId || !selectedTable) return
    setCreatingWalkin(true)
    try {
      const newBooking = await createWalkInBooking(selectedLocationId, selectedTable.id, walkinGuests)
      toast.success("Tavolo occupato!")
      setShowWalkinDialog(false)
      setSelectedBooking(newBooking)
      setShowOrderSheet(true)
      fetchData() // Refresh bookings
    } catch (e: any) {
      toast.error(e.message || "Errore durante l'occupazione del tavolo")
    } finally {
      setCreatingWalkin(false)
    }
  }

  const handleOrderSubmit = () => {
    setShowOrderSheet(false)
    router.push('/area-management')
  }

  if (!selectedLocationId) return <div className="p-8">Seleziona un locale</div>
  if (!data) return <div className="p-8">Caricamento...</div>

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="px-4 py-2 border-b bg-card">
        <h1 className="text-xl font-bold">Nuovo Ordine</h1>
        <p className="text-sm text-muted-foreground">Seleziona un tavolo dalla mappa per prendere un'ordinazione.</p>
      </div>

      <div className="flex-1 relative">
        <ReservationsFloorPlan
          locationId={selectedLocationId}
          selectedDate={selectedDate}
          bookings={data.filter(booking => {
            const bookingDate = new Date(booking.booking_time);
            return (
              bookingDate.getDate() === selectedDate.getDate() &&
              bookingDate.getMonth() === selectedDate.getMonth() &&
              bookingDate.getFullYear() === selectedDate.getFullYear()
            );
          })}
          onAssignmentChange={fetchData}
          onTableSelect={handleTableSelect}
        />
      </div>

      <ResponsiveDialog
        isOpen={showWalkinDialog}
        setIsOpen={setShowWalkinDialog}
        title={`Tavolo ${selectedTable?.table_number}`}
        description="Il tavolo è attualmente vuoto. Vuoi creare una prenotazione walk-in per sedere il cliente immediatamente?"
      >
        <div className="space-y-4 py-4">
          <div className="flex flex-col gap-3">
            <Label htmlFor="guests-count">Numero di persone</Label>
            <NumberInput
              value={walkinGuests}
              onValueChange={(val) => setWalkinGuests(val || 1)}
            />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setShowWalkinDialog(false)} disabled={creatingWalkin}>Annulla</Button>
          <Button onClick={handleCreateWalkin} disabled={creatingWalkin}>
            {creatingWalkin && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Siedi e Ordina
          </Button>
        </DialogFooter>
      </ResponsiveDialog>

      <ResponsiveDialog
        isOpen={showOrderSheet}
        setIsOpen={setShowOrderSheet}
        title={`Tavolo ${selectedTable?.table_number} - Ordine`}
        description="Componi il nuovo ordine per questo tavolo."
      >
        {selectedTable && (
          <TableOrdersPanel
            tableId={selectedTable.id}
            tableName={selectedTable.table_number?.toString() || ""}
            locationId={selectedLocationId}
            refreshTrigger={Date.now()}
            guestCount={selectedBooking?.guests_count || walkinGuests}
            initialMode="add"
            onOrderSubmit={handleOrderSubmit}
          />
        )}
      </ResponsiveDialog>
    </div>
  )
}

export default NewOrderView
