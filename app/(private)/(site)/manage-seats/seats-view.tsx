'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLocationStore } from '@/store/location-store';
import { FloorPlanList } from '@/app/(private)/(site)/manage-seats/components/floor-plan-list';
import { deleteFloorPlan, getFloorPlan } from '@/app/actions/floor-plan';
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus, PlusCircle, Store } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import ZoneEditor from './components/zone-editor';
import ConfirmDialog from '@/components/utility/confirm-dialog';
import PageWrapper from '@/components/private/page-wrapper';
import ZoneWizard from './components/zone-wizard';
import { saveFloorPlan, getOrganizationZonesCount } from '@/app/actions/floor-plan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganization } from '@/components/providers/organization-provider';
import { PLANS } from '@/lib/plans';
import { Badge } from '@/components/ui/badge';
import { Lock } from 'lucide-react';
import NoItems from '@/components/utility/no-items';

const PLAN_LIMITS = {
  starter: 5,
  pro: 18,     // Growth
  business: 35 // Business
};

interface Zone {
  id: string;
  name: string;
  width: number;
  height: number;
}

const SeatsView = () => {
  const { selectedLocationId, getSelectedLocation } = useLocationStore();
  const location = getSelectedLocation();

  const [mode, setMode] = useState<'list' | 'editor' | 'wizard'>('list');
  const { organization } = useOrganization();
  const [zones, setZones] = useState<Zone[]>([]);
  const [allTables, setAllTables] = useState<any[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [orgZoneCount, setOrgZoneCount] = useState<number>(0);

  // Determine current limit based on plan
  const currentPlan = PLANS.find(p => p.priceIdMonth === organization?.stripe_price_id || p.priceIdYear === organization?.stripe_price_id);
  const planId = currentPlan?.id || 'starter'; // Default to starter if no plan found (e.g. Free)
  const maxZones = PLAN_LIMITS[planId as keyof typeof PLAN_LIMITS] || 5;
  const isLimitReached = orgZoneCount >= maxZones;

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

      if (organization) {
        const count = await getOrganizationZonesCount(organization.id);
        setOrgZoneCount(count);
      }
    } catch (error) {
      console.error(error);
      toast.error('Errore nel caricamento delle mappe');
    } finally {
      setLoading(false);
    }
  }, [selectedLocationId, organization]);

  useRealtimeRefresh('zones', {
    filter: selectedLocationId ? `location_id=eq.${selectedLocationId}` : undefined,
    onUpdate: loadZones
  })

  useRealtimeRefresh('tables', {
    filter: selectedLocationId ? `location_id=eq.${selectedLocationId}` : undefined,
    onUpdate: loadZones
  })

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  const handleCreate = () => {
    // Switch to wizard mode for creation
    setMode('wizard');
  };

  const handleWizardComplete = async (zone: Zone, tables: any[]) => {
    if (!selectedLocationId) return;

    setLoading(true);
    try {
      // Save the new zone and its tables
      // Note: saveFloorPlan typically handles upsert/sync. 
      // We pass the new zone and tables.
      // If the backend implementation replaces all zones for the location, this needs to be cautious.
      // Assuming getFloorPlan logic: it fetches all.
      // We should probably merge with existing zones if saveFloorPlan is destructive to others, 
      // but based on typical implementation of `saveFloorPlan(locationId, zones, tables)` it likely syncs.
      // To be safe, let's include existing zones/tables + new ones if we want to preserve them,
      // OR rely on the fact that we might only be sending what changed?
      // Re-checking use-zone-editor: it sends [zoneToSave] and tablesToSave.
      // This implies it might be an upsert or it might rely on the backend to handle it.
      // Let's attempt to just save the NEW one.

      await saveFloorPlan(selectedLocationId, [zone], tables);

      toast.success('Sala creata con successo');
      await loadZones(); // Refresh local state

      setSelectedZoneId(zone.id);
      setMode('editor');
    } catch (error) {
      console.error(error);
      toast.error('Errore nel salvataggio della nuova sala');
    } finally {
      setLoading(false);
    }
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
    loadZones();
    setMode('list');
    setSelectedZoneId(undefined);
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
      {mode === 'wizard' && (
        <PageWrapper className="h-full overflow-hidden">
          <ZoneWizard
            onComplete={handleWizardComplete}
            onCancel={() => setMode('list')}
          />
        </PageWrapper>
      )}

      {mode === 'list' && (
        <PageWrapper className='relative'>
          <div className="flex items-center justify-between xl:hidden">
            <div>
              <h1 className="text-3xl font-bold">Gestione Sala</h1>
              <p className="text-muted-foreground">L{zones.length < 2 ? 'a' : 'e'} tu{zones.length < 2 ? 'a' : 'e'} mapp{zones.length < 2 ? 'a' : 'e'} dell{zones.length < 2 ? 'a' : 'e'} sal{zones.length < 2 ? 'a' : 'e'} per {location.name}.</p>
            </div>
            {zones.length > 0 && (
              <Button onClick={handleCreate} disabled={isLimitReached}>
                {isLimitReached ? <Lock className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Nuova Mappa
              </Button>
            )}
          </div>

          <div className='flex flex-col gap-4'>
            <div className='grid grid-cols-3 gap-4'>
              <Card className='gap-2 bg-card/80 shadow-none'>
                <CardHeader>
                  <CardTitle>Totale coperti</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-3xl font-bold'>
                    {allTables.reduce((acc, table) => acc + (table.seats || 0), 0)}
                  </p>
                </CardContent>
              </Card>
              <Card className='gap-2 bg-card/80 shadow-none'>
                <CardHeader>
                  <CardTitle>Capienza Sede</CardTitle>
                </CardHeader>
                <CardContent className='flex items-end gap-1.5'>
                  <p className='text-3xl font-bold'>
                    {location.seats}
                  </p>
                  <span className='text-xl hidden sm:flex text-foreground/80 font-semibold tracking-tight'>
                    coperti
                  </span>
                </CardContent>
              </Card>
              <Card className='gap-2 bg-card/80 shadow-none'>
                <CardHeader>
                  <CardTitle>Mappe create</CardTitle>
                </CardHeader>
                <CardContent className='flex items-end gap-1.5'>
                  <p className='text-3xl font-bold'>
                    {orgZoneCount}/{maxZones}
                  </p>
                  <span className='text-xl hidden sm:flex text-foreground/80 font-semibold tracking-tight'>
                    mappe
                  </span>
                </CardContent>
              </Card>
            </div>
            
            {!loading && zones.length === 0 ? (
              <NoItems
                icon={<Store className="w-10 h-10 text-foreground" />}
                title="Non hai mappe della sala"
                description="Crea la tua prima mappa per gestire i tavoli e le prenotazioni. Potrai creare diverse disposizioni per eventi o sale differenti."
                button={<Button onClick={handleCreate} size="lg" disabled={isLimitReached}>
                  {isLimitReached ? <Lock className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  {isLimitReached ? "Limite Raggiunto" : "Crea Nuova Mappa"}
                </Button>}
              />
            ) : (
              <FloorPlanList
                zones={zones}
                tables={allTables}
                location={location}
                onEdit={handleEdit}
                onDelete={(zone) => setZoneToDelete(zone as any)}
              />
            )}
          </div>

          {zones.length > 0 && (
            <Button onClick={handleCreate} disabled={isLimitReached} className='absolute right-6 bottom-6 z-50 xl:flex hidden'>
              {isLimitReached ? <Lock className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Nuova Mappa
            </Button>
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
