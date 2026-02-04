'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLocationStore } from '@/store/location-store';
import { FloorPlanList } from '@/app/(private)/(site)/manage-seats/components/floor-plan-list';
import { deleteFloorPlan, getFloorPlan } from '@/app/actions/floor-plan';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus, PlusCircle, Store } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import ZoneEditor from './components/zone-editor';
import ConfirmDialog from '@/components/utility/confirm-dialog';
import PageWrapper from '@/components/private/page-wrapper';

interface Zone {
  id: string;
  name: string;
  width: number;
  height: number;
}

const SeatsView = () => {
  const { selectedLocationId, getSelectedLocation } = useLocationStore();
  const location = getSelectedLocation();

  const [mode, setMode] = useState<'list' | 'editor'>('list');
  const [zones, setZones] = useState<Zone[]>([]);
  const [allTables, setAllTables] = useState<any[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // State for delete confirmation
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);

  // Fetch zones on load
  const loadZones = useCallback(async () => {
    if (!selectedLocationId) return;

    setLoading(true);
    try {
      const data = await getFloorPlan(selectedLocationId);
      setZones(data.zones);
      setAllTables(data.tables);

      // If we are in list mode and no zones exist, we show empty state (handled in render).
    } catch (error) {
      console.error(error);
      toast.error('Errore nel caricamento delle mappe');
    } finally {
      setLoading(false);
    }
  }, [selectedLocationId]);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  const handleCreate = () => {
    // When creating, we want to start fresh. 
    // ZoneEditor handles creation if ID is missing or not found, but we can also pass a generated ID if we want to be explicit.
    // For now, let's pass a NEW ID so the editor initializes a new zone.
    setSelectedZoneId(uuidv4());
    setMode('editor');
  };

  const handleEdit = (zone: Zone) => {
    setSelectedZoneId(zone.id);
    setMode('editor');
  };

  const handleBack = () => {
    setMode('list');
    setSelectedZoneId(undefined);
    loadZones(); // Refresh list
  };

  const handleSaveSuccess = () => {
    // Optional: Stay in editor or go back? Usually stay in editor after save is better UX, user can click back manually.
    // But we should refresh list in background if needed.
    loadZones();
  };

  const confirmDelete = async () => {
    if (!zoneToDelete) return;

    try {
      await deleteFloorPlan(zoneToDelete.id);
      toast.success('Mappa eliminata con successo');
      setZoneToDelete(null);
      loadZones();
    } catch (error) {
      console.error(error);
      toast.error('Errore nell\'eliminazione della mappa');
    }
  };

  if (!location) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">Seleziona una sede per gestirne la/le sala/e.</p>
      </div>
    )
  }

  return (
    <div className='h-full'>
      {mode === 'list' && (
        <PageWrapper>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Gestione Sala</h1>
              <p className="text-muted-foreground">L{zones.length < 2 ? 'a' : 'e'} tu{zones.length < 2 ? 'a' : 'e'} mapp{zones.length < 2 ? 'a' : 'e'} dell{zones.length < 2 ? 'a' : 'e'} sal{zones.length < 2 ? 'a' : 'e'} per {location.name}.</p>
            </div>
            {zones.length > 0 && (
              <Button onClick={handleCreate}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nuova Mappa
              </Button>
            )}
          </div>

          {!loading && zones.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed bg-neutral-50 dark:bg-neutral-950/50 min-h-[400px]">
              <div className="bg-neutral-100 dark:bg-neutral-800 p-4 mb-4">
                <Store className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Non hai mappe della sala</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Crea la tua prima mappa per gestire i tavoli e le prenotazioni.
                Potrai creare diverse disposizioni per eventi o sale differenti.
              </p>
              <Button onClick={handleCreate} size="lg">
                <Plus className="h-5 w-5" />
                Crea Nuova Mappa
              </Button>
            </div>
          ) : (
            <FloorPlanList
              zones={zones}
              tables={allTables}
              location={location}
              onEdit={handleEdit}
              onDelete={(zone) => setZoneToDelete(zone as any)}
            />
          )}
        </PageWrapper>
      )}

      {mode === 'editor' && (
        <div className="h-full w-full">
          <ZoneEditor
            initialZoneId={selectedZoneId}
            onBack={handleBack}
            onSaveSuccess={handleSaveSuccess}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {zoneToDelete && (
        <ConfirmDialog
          open={!!zoneToDelete}
          onOpenChange={(open) => !open && setZoneToDelete(null)}
          title="Elimina Mappa"
          description={`Sei sicuro di voler eliminare la mappa "${zoneToDelete.name}"? Questa azione non può essere annullata.`}
          confirmLabel="Elimina"
          cancelLabel="Annulla"
          variant="destructive"
          onConfirm={confirmDelete}
        // Ideally ConfirmDialog should control open state via prop if strictly controlled, 
        // but the provided component relies on Trigger. 
        // Workaround: We render it, but we might need to adjust logic if it requires user interaction to OPEN.
        // Wait, the ConfirmDialog implementation view showed it wraps AlertDialog.
        // If we use <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>, it opens on click.
        // Since we are setting state from external click, we actually want a Controlled Dialog or we need to put the Trigger AROUND the delete button in the list.
        // BUT `FloorPlanList` handles the UI.
        // Let's look at `ConfirmDialog` implementation again. It doesn't accept `open` prop.
        // This suggests it's designed to wrap a button.
        // However, `FloorPlanList` takes an `onDelete` callback.
        // Accessing the delete button inside FloorPlanList to wrap it might be hard without modifying FloorPlanList.

        // RE-READING ConfirmDialog:
        // It uses `AlertDialog` but doesn't expose `open` or `onOpenChange`.
        // So it MUST be used by wrapping a trigger element.
        //
        // PROBLEM: We can't easily wrap the button inside `FloorPlanList` from here.
        // OPTION 1: Modify `FloorPlanList` to accept a render prop or just handle confirm logic internally? No, logic should be up here.
        // OPTION 2: Modify `ConfirmDialog` to accept `open` and `onOpenChange`.
        // OPTION 3: Pass a wrapper to `FloorPlanList`? No.

        // Let's modify `ConfirmDialog` to be more flexible first!
        />
      )}
    </div>
  );
}

export default SeatsView;
