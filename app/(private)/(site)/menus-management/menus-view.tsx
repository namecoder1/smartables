'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, MapIcon, CalendarDays, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { MenusViewProps } from '@/types/components'
import { Menu } from '@/types/general'
import { Textarea } from '../../../../components/ui/textarea'
import { Checkbox } from '../../../../components/ui/checkbox'
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh'
import { PdfUpload } from '../../../../components/private/pdf-upload'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import NoItems from '@/components/utility/no-items'
import { useOrganization } from '@/components/providers/organization-provider'
import { PLANS } from '@/lib/plans'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import PageWrapper from '@/components/private/page-wrapper'
import OverviewCards from '@/components/private/overview-cards'
import { GiBookshelf } from 'react-icons/gi'
import { MdOutlineCollectionsBookmark } from 'react-icons/md'
import { LuBookPlus } from 'react-icons/lu'
import DataContainer from '@/components/utility/data-container'
import { ButtonGroup } from '@/components/ui/button-group'
import { FaqContent } from '@/components/private/faq-section'
import { MenuCard } from './_components/menu-card'
import { useMenuDialogs } from './_components/use-menu-dialogs'

const MenuView = ({ menus, limits, organizationId, locations, faqs }: MenusViewProps) => {
  const { organization } = useOrganization()

  const currentPlan = PLANS.find(p => p.priceIdMonth === organization?.stripe_price_id || p.priceIdYear === organization?.stripe_price_id);
  const maxMenus = limits.max_menus
  const isLimitReached = menus.length >= maxMenus;

  const [workingLocationId, setWorkingLocationId] = useState<string>(
    locations && locations.length > 0 ? locations[0].id : ''
  )

  const currentWorkingLocation = locations.find(l => l.id === workingLocationId)

  const {
    menuDialog, setMenuDialog,
    isSavingMenu,
    openCreateDialog, openEditDialog, closeMenuDialog, handleSaveMenu,
    handleDeleteMenu,
    managingMenuId, setManagingMenuId,
    tempSelectedLocations, setTempSelectedLocations,
    tempDailySettings, setTempDailySettings,
    isSavingLocations,
    openManageLocations, handleSaveLocations,
  } = useMenuDialogs({
    menus,
    organizationId,
    workingLocationId,
    currentWorkingLocationName: currentWorkingLocation?.name,
  })

  useRealtimeRefresh('menus', {
    filter: organizationId ? `organization_id=eq.${organizationId}` : undefined
  })

  const visibleMenus = menus.filter(menu => {
    if (!workingLocationId) return true
    return (menu as Menu & { menu_locations?: Array<{ location_id: string }> }).menu_locations?.some(ml => ml.location_id === workingLocationId)
  })


  if (!locations || locations.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Nessuna sede disponibile. Crea prima una sede per gestire i menu.
      </div>
    )
  }

  return (
    <PageWrapper className="relative">
      <div className='flex flex-col items-start justify-center md:flex-row md:items-center md:justify-between gap-6'>
        <div className='flex flex-col gap-1'>
          <h2 className="text-3xl font-bold tracking-tight">I tuoi Menù</h2>
          <p className="text-muted-foreground max-w-3xl">Crea e gestisci i menù per le tue sedi.</p>
        </div>
        <ButtonGroup>
          <FaqContent title='Aiuto' faqs={faqs} variant='minimized' />
          <Button onClick={openCreateDialog} disabled={isLimitReached}>
            {isLimitReached ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            Aggiungi
          </Button>
        </ButtonGroup>
      </div>

      <OverviewCards
        data={[
          {
            title: 'Totale menù',
            value: menus.length,
            description: 'menù',
            icon: <GiBookshelf className='text-primary size-6 2xl:size-8' />
          },
          {
            title: 'Menù attivi',
            value: menus.filter(m => m.is_active).length,
            description: 'attivi',
            icon: <MdOutlineCollectionsBookmark className='text-primary size-6 2xl:size-8' />
          },
          {
            title: 'Menù creati',
            value: menus.length,
            description: 'menù',
            icon: <LuBookPlus className='text-primary size-6 2xl:size-8' />
          }
        ]}
      />

      {visibleMenus.length === 0 ? (
        <NoItems
          icon={<MapIcon />}
          title="Non hai ancora creato un menù"
          description="Crea il tuo primo menù e attivalo per mostrarlo ai tuoi clienti. Puoi caricare un PDF gia esistente o inserire i tuoi piatti a mano."
          button={
            <Button onClick={openCreateDialog} disabled={isLimitReached}>
              {isLimitReached ? <Lock className="w-4 h-4 mr-2" /> : null}
              {isLimitReached ? "Limite Raggiunto" : "Crea Nuovo Menu"}
            </Button>
          }
        />
      ) : (
        <DataContainer>
          {visibleMenus.map((menu) => (
            <MenuCard
              key={menu.id}
              menu={menu}
              openManageLocations={openManageLocations}
              openEditMenu={openEditDialog}
              handleDelete={handleDeleteMenu}
            />
          ))}
        </DataContainer>
      )}


      {/* Manage Locations Dialog */}
      <Dialog open={!!managingMenuId} onOpenChange={(open) => !open && setManagingMenuId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Disponibilità Menu</DialogTitle>
            <DialogDescription>
              Seleziona le sedi e, opzionalmente, gli orari giornalieri in cui il menu è visibile.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 border p-3 bg-white rounded-xl max-h-80 overflow-y-auto my-4">
            {locations.map(location => {
              const isSelected = tempSelectedLocations.includes(location.id)
              const daily = tempDailySettings[location.id] || { daily_from: '', daily_until: '' }
              return (
                <div key={location.id} className="flex flex-col gap-2 border-b pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`manage-loc-${location.id}`} className="cursor-pointer text-sm font-medium">
                      {location.name}
                    </Label>
                    <Checkbox
                      id={`manage-loc-${location.id}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTempSelectedLocations([...tempSelectedLocations, location.id])
                        } else {
                          setTempSelectedLocations(tempSelectedLocations.filter(id => id !== location.id))
                          setTempDailySettings(prev => { const next = { ...prev }; delete next[location.id]; return next })
                        }
                      }}
                    />
                  </div>
                  {isSelected && (() => {
                    const shifts: { label: string; open: string; close: string }[] = []
                    const hours = location.opening_hours
                    if (hours) {
                      Object.values(hours).forEach((slots) => {
                        (slots as any[]).forEach((slot) => {
                          const key = `${slot.open}-${slot.close}`
                          if (!shifts.some(s => `${s.open}-${s.close}` === key)) {
                            shifts.push({ label: `${slot.open} – ${slot.close}`, open: slot.open, close: slot.close })
                          }
                        })
                      })
                    }
                    const shiftValue = daily.daily_from && daily.daily_until ? `${daily.daily_from}-${daily.daily_until}` : ''
                    return (
                      <div className="flex items-center border-t pt-2 gap-2 pl-1">
                        <div className="flex flex-col gap-1.5 flex-1">
                          <Select
                            value={shiftValue}
                            onValueChange={(val) => {
                              if (!val) {
                                setTempDailySettings(prev => { const next = { ...prev }; delete next[location.id]; return next })
                                return
                              }
                              const shift = shifts.find(s => `${s.open}-${s.close}` === val)
                              if (shift) {
                                setTempDailySettings(prev => ({
                                  ...prev,
                                  [location.id]: { daily_from: shift.open, daily_until: shift.close }
                                }))
                              }
                            }}
                          >
                            <SelectTrigger >
                              <SelectValue placeholder="Tutti gli orari" />
                            </SelectTrigger>
                            <SelectContent position='popper'>
                              {shifts.map(s => (
                                <SelectItem key={`${s.open}-${s.close}`} value={`${s.open}-${s.close}`}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {shiftValue && (
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="destructive"
                            className="h-7 w-7 self-end"
                            onClick={() => setTempDailySettings(prev => { const next = { ...prev }; delete next[location.id]; return next })}
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManagingMenuId(null)} disabled={isSavingLocations}>Annulla</Button>
            <Button onClick={handleSaveLocations} disabled={isSavingLocations}>
              {isSavingLocations ? 'Salvataggio...' : 'Salva Modifiche'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unified Create/Edit Menu Dialog */}
      <Dialog open={menuDialog.mode !== null} onOpenChange={(open) => !open && closeMenuDialog()}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {menuDialog.mode === 'create' ? 'Nuovo Menu' : 'Modifica Menu'}
            </DialogTitle>
            <DialogDescription>
              {menuDialog.mode === 'create'
                ? <>Stai creando un menu per <strong>{currentWorkingLocation?.name}</strong>.</>
                : 'Aggiorna i dettagli del menu. Se è un menu PDF, puoi caricare un nuovo file.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="menu-name">Nome menù</Label>
              <Input
                id="menu-name"
                value={menuDialog.name}
                onChange={(e) => setMenuDialog(prev => ({ ...prev, name: e.target.value }))}
                placeholder="es. Menu Pranzo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="menu-description">Descrizione menù</Label>
              <Textarea
                id="menu-description"
                rows={2}
                value={menuDialog.description}
                onChange={(e) => setMenuDialog(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrizione opzionale..."
              />
            </div>

            <div className='flex items-center gap-2'>
              <div className="flex items-center gap-2 w-full border p-3 rounded-md bg-background dark:bg-input/30">
                <Checkbox
                  id="menu-isActive"
                  checked={menuDialog.isActive}
                  onCheckedChange={(c) => setMenuDialog(prev => ({ ...prev, isActive: !!c }))}
                />
                <Label htmlFor="menu-isActive" className="cursor-pointer font-medium">Attivo</Label>
              </div>

              <div className="flex items-center gap-2 w-full border p-3 rounded-md bg-background dark:bg-input/30">
                <Checkbox
                  id="menu-isPdf"
                  checked={menuDialog.isPdf}
                  onCheckedChange={(c) => setMenuDialog(prev => ({ ...prev, isPdf: !!c, pdfFile: null, pdfUrl: '' }))}
                />
                <Label htmlFor="menu-isPdf" className="cursor-pointer font-medium">Menu formato PDF / Link</Label>
              </div>
            </div>

            {/* Special Menu Date Range */}
            <div className="grid gap-2">
              <div className="flex items-center gap-2 border p-3 rounded-md bg-background dark:bg-input/30">
                <Checkbox
                  id="menu-isSpecial"
                  checked={menuDialog.isSpecial}
                  onCheckedChange={(c) => {
                    setMenuDialog(prev => ({
                      ...prev,
                      isSpecial: !!c,
                      // Clear dates if disabling
                      startsAt: c ? prev.startsAt : '',
                      endsAt: c ? prev.endsAt : ''
                    }))
                  }}
                />
                <div className="flex flex-col">
                  <Label htmlFor="menu-isSpecial" className="cursor-pointer font-medium flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4" />
                    Menu Speciale / Evento
                  </Label>
                  <span className="text-xs text-muted-foreground">Imposta date di inizio e fine per renderlo visibile solo in quel periodo</span>
                </div>
              </div>

              {menuDialog.isSpecial && (
                <div className="grid grid-cols-1 gap-4 animate-in fade-in-50 zoom-in-95">
                  <DateTimePicker
                    dateLabel="Inizio validità"
                    timeLabel="Ora"
                    value={menuDialog.startsAt ? new Date(menuDialog.startsAt) : undefined}
                    onChange={(date) => setMenuDialog(prev => ({ ...prev, startsAt: date ? date.toISOString() : '' }))}
                  />
                  <DateTimePicker
                    dateLabel="Fine validità"
                    timeLabel="Ora"
                    value={menuDialog.endsAt ? new Date(menuDialog.endsAt) : undefined}
                    onChange={(date) => setMenuDialog(prev => ({ ...prev, endsAt: date ? date.toISOString() : '' }))}
                  />
                </div>
              )}
            </div>

            {menuDialog.isPdf && (
              <div className="grid gap-4 p-4 bg-muted/40 rounded-md border border-dashed animate-in fade-in-50 zoom-in-95">
                <div className="grid gap-2">
                  <div className='flex items-center justify-between gap-2'>
                    <Label>{menuDialog.mode === 'edit' ? 'Aggiorna File PDF' : 'Carica File PDF'}</Label>
                    {menuDialog.mode === 'edit' && menuDialog.pdfUrl && !menuDialog.pdfFile && (
                      <p className="text-xs text-muted-foreground">Attuale: <a href={menuDialog.pdfUrl} target="_blank" className="underline text-primary">Apri</a></p>
                    )}
                  </div>
                  <PdfUpload
                    value={null}
                    onChange={(_, file) => setMenuDialog(prev => ({ ...prev, pdfFile: file || null }))}
                  />
                </div>
                {menuDialog.mode === 'edit' && (
                  <>
                    <div className="relative text-center">
                      <span className="bg-muted/40 px-2 text-xs text-muted-foreground uppercase">Oppure Link</span>
                    </div>
                    <Input
                      value={menuDialog.pdfUrl}
                      onChange={e => setMenuDialog(prev => ({ ...prev, pdfUrl: e.target.value }))}
                      placeholder="https://..."
                      disabled={!!menuDialog.pdfFile}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeMenuDialog}>Annulla</Button>
            <Button onClick={handleSaveMenu} disabled={isSavingMenu}>
              {isSavingMenu
                ? 'Salvataggio...'
                : menuDialog.mode === 'create' ? 'Crea Menu' : 'Salva Modifiche'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}

export default MenuView
