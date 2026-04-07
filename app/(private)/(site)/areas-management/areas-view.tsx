'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocationStore } from '@/store/location-store';
import { FloorPlanList } from './components/floor-plan-list';
import { deleteFloorPlan, getFloorPlan, updateZoneBlock } from '@/app/actions/floor-plan';
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowRight, Plus, Store, Trash } from 'lucide-react';
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
import { FaqContent } from '@/components/private/faq-section';
import { SanityFaq } from '@/utils/sanity/queries';
import { ButtonGroup } from '@/components/ui/button-group';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { RangePicker } from '@/components/ui/range-picker';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Zone {
  id: string;
  name: string;
  width: number;
  height: number;
  blocked_from?: string | null;
  blocked_until?: string | null;
  blocked_reason?: string | null;
}

const AreasView = ({ faqs, limits }: { faqs: SanityFaq[]; limits: any }) => {
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
  const maxZones = limits.max_zones

  const isLimitReached = orgZoneCount >= maxZones;

  // State for delete confirmation
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);

  // State for zone blocking dialog
  const [zoneToBlock, setZoneToBlock] = useState<Zone | null>(null);
  const [isDeletingBlock, setIsDeletingBlock] = useState(false);
  const [blockMode, setBlockMode] = useState<'free' | 'shift'>('free');
  const [blockFrom, setBlockFrom] = useState<Date | undefined>(undefined);
  const [blockUntil, setBlockUntil] = useState<Date | undefined>(undefined);
  const [blockReason, setBlockReason] = useState('');
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [blockDateFrom, setBlockDateFrom] = useState<Date | undefined>(undefined);
  const [blockDateUntil, setBlockDateUntil] = useState<Date | undefined>(undefined);
  const [isSavingBlock, setIsSavingBlock] = useState(false);

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

  const openBlockDialog = (zone: Zone) => {
    setZoneToBlock(zone);
    if (zone.blocked_from) {
      setBlockFrom(new Date(zone.blocked_from));
    } else {
      setBlockFrom(undefined);
    }
    if (zone.blocked_until) {
      setBlockUntil(new Date(zone.blocked_until));
    } else {
      setBlockUntil(undefined);
    }
    setBlockReason(zone.blocked_reason || '');
    setBlockMode('free');
    setSelectedShift('');
    setBlockDateFrom(undefined);
    setBlockDateUntil(undefined);
  };

  // Opening hours shifts for the selected location, used in shift mode
  const openingHoursShifts = (() => {
    const hours = location?.opening_hours;
    if (!hours) return [];
    const shifts: { label: string; open: string; close: string }[] = [];
    Object.entries(hours).forEach(([, slots]) => {
      (slots as any[]).forEach((slot) => {
        const key = `${slot.open}-${slot.close}`;
        if (!shifts.some(s => `${s.open}-${s.close}` === key)) {
          shifts.push({ label: `${slot.open} – ${slot.close}`, open: slot.open, close: slot.close });
        }
      });
    });
    return shifts;
  })();

  const handleSaveBlock = async () => {
    if (!zoneToBlock) return;
    setIsSavingBlock(true);
    try {
      let finalFrom: string | null = null;
      let finalUntil: string | null = null;

      if (blockMode === 'free') {
        finalFrom = blockFrom ? blockFrom.toISOString() : null;
        finalUntil = blockUntil ? blockUntil.toISOString() : null;
      } else {
        // Shift mode: combine shift times with selected dates
        const shift = openingHoursShifts.find(s => `${s.open}-${s.close}` === selectedShift);
        if (shift && blockDateFrom && blockDateUntil) {
          const [openH, openM] = shift.open.split(':').map(Number);
          const [closeH, closeM] = shift.close.split(':').map(Number);
          const from = new Date(blockDateFrom);
          from.setHours(openH, openM, 0, 0);
          const until = new Date(blockDateUntil);
          until.setHours(closeH, closeM, 0, 0);
          finalFrom = from.toISOString();
          finalUntil = until.toISOString();
        }
      }

      await updateZoneBlock(zoneToBlock.id, finalFrom, finalUntil, blockReason || null);
      toast.success(finalFrom ? 'Blocco impostato' : 'Blocco rimosso');
      setZoneToBlock(null);
      loadZones();
    } catch (e) {
      toast.error('Errore nel salvataggio del blocco');
    } finally {
      setIsSavingBlock(false);
    }
  };

  const confirmDeleteArea = async () => {
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

  const confirmDeleteBlock = async () => {
    if (!zoneToBlock) return;
    setIsSavingBlock(true);
    try {
      await updateZoneBlock(zoneToBlock.id, null, null, null);
      toast.success('Blocco rimosso con successo');
      setZoneToBlock(null);
      setIsDeletingBlock(false);
      loadZones();
    } catch (error) {
      console.error(error);
      toast.error('Errore nella rimozione del blocco');
    } finally {
      setIsSavingBlock(false);
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
          <div className="flex flex-col items-start md:flex-row md:items-center gap-10 md:justify-between">
            <div className='flex flex-col gap-1'>
              <h1 className="text-3xl font-bold tracking-tight">Le tue Mappe</h1>
              <p className="text-muted-foreground max-w-2xl">Gestisci le mappe del tuo locale, crea, modifica e sposta i tavoli per adattarle alle tue esigenze.</p>
            </div>
            {zones.length > 0 ? (
              <ButtonGroup>
                <FaqContent title='Aiuto' variant='minimized' faqs={faqs} />
                <Button type='submit' onClick={handleCreate} disabled={isLimitReached}>
                  {isLimitReached ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  Mappa
                </Button>
              </ButtonGroup>
            ) : (
              <FaqContent title='Aiuto' variant='minimized' faqs={faqs} />
            )}
          </div>

          <div className='flex flex-col gap-6'>
            <OverviewCards
              data={[
                {
                  title: 'Totale coperti',
                  value: allTables.reduce((acc, table) => acc + (table.seats || 0), 0),
                  description: '',
                  icon: <GiHotMeal className='text-primary size-6 2xl:size-8' />
                },
                {
                  title: 'Capienza Sede',
                  value: location.seats,
                  description: 'coperti',
                  icon: <FaPeopleLine className='text-primary size-6 2xl:size-8' />
                },
                {
                  title: 'Totale sale',
                  value: `${orgZoneCount}/${maxZones}`,
                  description: 'sale',
                  icon: <PiBlueprint className='text-primary size-6 2xl:size-8' />
                }
              ]}
            />

            {!loading && zones.length === 0 ? (
              <NoItems
                icon={<Store size={28} className='text-primary' />}
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
                onBlock={openBlockDialog}
              />
            )}
          </div>
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
          onConfirm={confirmDeleteArea}
        />
      )}

      {/* Block Deletion Confirmation Dialog */}
      {isDeletingBlock && (
        <ConfirmDialog
          open={isDeletingBlock}
          onOpenChange={setIsDeletingBlock}
          title="Rimuovi blocco"
          description={`Sei sicuro di voler eliminare il blocco della sala "${zoneToBlock?.name}"?`}
          confirmLabel="Rimuovi"
          cancelLabel="Annulla"
          variant="destructive"
          onConfirm={confirmDeleteBlock}
        />
      )}

      {/* Zone Blocking Dialog */}
      <Dialog open={!!zoneToBlock} onOpenChange={(open) => !open && setZoneToBlock(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Blocca sala — {zoneToBlock?.name}</DialogTitle>
            <DialogDescription>
              Imposta un periodo in cui questa sala sarà bloccata e non prenotabile.
            </DialogDescription>
          </DialogHeader>

          {zoneToBlock?.blocked_from && zoneToBlock?.blocked_until && (
            <div className='bg-white group border-2 rounded-2xl p-3 pt-2 flex flex-col items-start justify-center gap-2'>
              <h3 className='text-base font-semibold tracking-tight'>Blocchi programmati</h3>
              <div className='border-2 flex items-center flex-wrap justify-between w-full p-2 border-dashed rounded-xl'>
                <p className='text-sm font-semibold'>{zoneToBlock?.blocked_reason || 'Nessuna nota'}</p>
                <div className='flex items-center justify-center gap-2'>
                  <p className='text-sm'>{format(zoneToBlock.blocked_from, 'dd MMM yyyy', { locale: it })}</p>
                  <ArrowRight size={16} />
                  <p className='text-sm'>{format(zoneToBlock.blocked_until, 'dd MMM yyyy', { locale: it })}</p>
                  <Button onClick={() => setIsDeletingBlock(true)} variant='destructive' size='icon-xs' className='hidden group-hover:flex'>
                    <Trash />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 py-2">
            {/* Mode selector */}
            {openingHoursShifts.length > 0 && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={blockMode === 'free' ? 'default' : 'outline'}
                  onClick={() => setBlockMode('free')}
                >
                  Date libere
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={blockMode === 'shift' ? 'default' : 'outline'}
                  onClick={() => setBlockMode('shift')}
                >
                  Per turno
                </Button>
              </div>
            )}

            {blockMode === 'free' ? (
              <>
                <DateTimePicker
                  dateLabel="Blocca dal"
                  timeLabel="Ora"
                  value={blockFrom}
                  onChange={setBlockFrom}
                />
                <DateTimePicker
                  dateLabel="Blocca fino al"
                  timeLabel="Ora"
                  value={blockUntil}
                  onChange={setBlockUntil}
                />
              </>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-2 w-full">
                  <Label>Turno</Label>
                  <Select value={selectedShift} onValueChange={setSelectedShift}>
                    <SelectTrigger className='w-full!'>
                      <SelectValue placeholder="Seleziona turno..." />
                    </SelectTrigger>
                    <SelectContent>
                      {openingHoursShifts.map((s) => (
                        <SelectItem key={`${s.open}-${s.close}`} value={`${s.open}-${s.close}`}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col gap-2 w-full">
                  <Label>Periodo</Label>
                  <RangePicker
                    variant="input"
                    className='w-full'
                    placeholder='Scegli date'
                    date={{ from: blockDateFrom, to: blockDateUntil }}
                    onChange={(range) => {
                      setBlockDateFrom(range?.from);
                      setBlockDateUntil(range?.to);
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label>Motivo (opzionale)</Label>
              <Input
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="es. Evento privato, manutenzione..."
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            {(zoneToBlock?.blocked_from || zoneToBlock?.blocked_until) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeletingBlock(true)}
                disabled={isSavingBlock}
              >
                Rimuovi
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setZoneToBlock(null)}
              disabled={isSavingBlock}
            >
              Annulla
            </Button>
            <Button onClick={handleSaveBlock} disabled={isSavingBlock}>
              {isSavingBlock ? 'Salvataggio...' : 'Salva'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AreasView;
