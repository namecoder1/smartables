'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocationStore } from '@/store/location-store';
import { FloorPlanList } from './components/floor-plan-list';
import { deleteFloorPlan, getFloorPlan } from '@/app/actions/floor-plan';
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus, PlusCircle, Store } from 'lucide-react';
import ConfirmDialog from '@/components/utility/confirm-dialog';
import PageWrapper from '@/components/private/page-wrapper';
import ZoneWizard from './components/zone-wizard';
import { saveFloorPlan, getOrganizationZonesCount } from '@/app/actions/floor-plan';
import { PiBlueprint } from "react-icons/pi";
import { FaPeopleLine } from "react-icons/fa6";
import { GiHotMeal } from "react-icons/gi";
import { useOrganization } from '@/components/providers/organization-provider';
import { PLANS } from '@/lib/plans';
import { Lock } from 'lucide-react';
import NoItems from '@/components/utility/no-items';
import OverviewCards from '@/components/private/overview-cards';

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

const AreasView = () => {
  const router = useRouter();
  const { selectedLocationId, getSelectedLocation } = useLocationStore();
  const location = getSelectedLocation();

  const [mode, setMode] = useState<'list' | 'wizard'>('list');
  const { organization } = useOrganization();
  const [zones, setZones] = useState<Zone[]>([]);
  const [allTables, setAllTables] = useState<any[]>([]);
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
      await saveFloorPlan(selectedLocationId, [zone], tables);

      toast.success('Sala creata con successo');
      await loadZones(); // Refresh local state

      // Directly navigate to the new area editor
      router.push(`/areas-management/${zone.id}`);
    } catch (error) {
      console.error(error);
      toast.error('Errore nel salvataggio della nuova sala');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (zone: Zone) => {
    router.push(`/areas-management/${zone.id}`);
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Mappe ristorante</h1>
              <p className="text-muted-foreground">Gestisci le mappe del tuo locale, crea, modifica e sposta i tavoli per adattarle alle tue esigenze.</p>
            </div>
            {zones.length > 0 && (
              <Button onClick={handleCreate} disabled={isLimitReached} className='hidden xl:flex'>
                {isLimitReached ? <Lock className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Nuova Mappa
              </Button>
            )}
          </div>

          <div className='flex flex-col gap-6'>
            <OverviewCards
              data={[
                {
                  title: 'Totale coperti',
                  value: allTables.reduce((acc, table) => acc + (table.seats || 0), 0),
                  description: '',
                  icon: <GiHotMeal size={24} className='text-primary' />
                },
                {
                  title: 'Capienza Sede',
                  value: location.seats,
                  description: 'coperti',
                  icon: <FaPeopleLine size={24} className='text-primary' />
                },
                {
                  title: 'Totale sale',
                  value: `${orgZoneCount}/${maxZones}`,
                  description: 'sale',
                  icon: <PiBlueprint size={24} className='text-primary' />
                }
              ]}
            />

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
            <Button onClick={handleCreate} disabled={isLimitReached} className='absolute right-6 bottom-6 z-50 flex xl:hidden'>
              {isLimitReached ? <Lock className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Nuova Mappa
            </Button>
          )}

        </PageWrapper>
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
        />
      )}
    </div>
  );
}

export default AreasView;
