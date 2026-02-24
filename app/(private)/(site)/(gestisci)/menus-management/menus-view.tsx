'use client'

import { useState } from 'react'
import { Card, CardDescription, CardHeader, CardTitle, CardFooter, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash, ChevronRight, FileText, MapPin, Globe, Settings, Edit, Link, LayersPlus, Map, MapIcon, PlusCircle } from 'lucide-react'
import { createMenu, deleteMenu, assignMenuToLocations, updateMenu } from '@/app/actions/settings'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { MenusViewProps } from '@/types/components'
import { Textarea } from '../../../../../components/ui/textarea'
import { Checkbox } from '../../../../../components/ui/checkbox'
import { createClient } from '@/utils/supabase/client'
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh'
import { PdfUpload } from '../../../../../components/private/pdf-upload'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import GroupedActions from '../../../../../components/utility/grouped-actions'
import { Menu } from '@/types/general'
import NoItems from '@/components/utility/no-items'
import { useOrganization } from '@/components/providers/organization-provider'
import { PLANS } from '@/lib/plans'
import { Lock } from 'lucide-react'
import PageWrapper from '@/components/private/page-wrapper'
import OverviewCards from '@/components/private/overview-cards'

const MENU_LIMITS = {
  starter: 5,
  pro: 15,     // Growth
  business: 25 // Business
}

type MenuDialogMode = 'create' | 'edit' | null

interface MenuDialogState {
  mode: MenuDialogMode
  menuId: string | null
  name: string
  description: string
  isActive: boolean
  isPdf: boolean
  pdfFile: File | null
  pdfUrl: string
}

const initialDialogState: MenuDialogState = {
  mode: null,
  menuId: null,
  name: '',
  description: '',
  isActive: true,
  isPdf: false,
  pdfFile: null,
  pdfUrl: ''
}

const MenuView = ({ menus, organizationId, locations }: MenusViewProps) => {
  const router = useRouter()
  const { organization } = useOrganization()

  // Determine current limit based on plan
  const currentPlan = PLANS.find(p => p.priceIdMonth === organization?.stripe_price_id || p.priceIdYear === organization?.stripe_price_id);
  const planId = currentPlan?.id || 'starter'; // Default to starter if no plan found
  const maxMenus = MENU_LIMITS[planId as keyof typeof MENU_LIMITS] || 5;
  const isLimitReached = menus.length >= maxMenus;
  // Navigation / Context State
  const [workingLocationId, setWorkingLocationId] = useState<string>(
    locations && locations.length > 0 ? locations[0].id : ''
  )

  // Unified Menu Dialog State
  const [menuDialog, setMenuDialog] = useState<MenuDialogState>(initialDialogState)
  const [isSavingMenu, setIsSavingMenu] = useState(false)

  // Realtime Refresh
  useRealtimeRefresh('menus', {
    filter: organizationId ? `organization_id=eq.${organizationId}` : undefined
  })

  // Manage Locations State
  const [managingMenuId, setManagingMenuId] = useState<string | null>(null)
  const [tempSelectedLocations, setTempSelectedLocations] = useState<string[]>([])

  // --- Helpers ---
  const currentWorkingLocation = locations.find(l => l.id === workingLocationId)

  // Helper to check if a menu belongs to a location
  const isMenuInLocation = (menu: any, locationId: string) => {
    return menu.menu_locations?.some((ml: any) => ml.location_id === locationId)
  }

  // Filter Menus based on Working Location
  const visibleMenus = menus.filter(menu => {
    if (!workingLocationId) return true
    return isMenuInLocation(menu, workingLocationId)
  })

  // --- Helpers for Dialog ---
  const openCreateDialog = () => {
    setMenuDialog({
      mode: 'create',
      menuId: null,
      name: '',
      description: '',
      isActive: true,
      isPdf: false,
      pdfFile: null,
      pdfUrl: ''
    })
  }

  const openEditDialog = (menu: Menu) => {
    setMenuDialog({
      mode: 'edit',
      menuId: menu.id,
      name: menu.name,
      description: menu.description || '',
      isActive: menu.is_active ?? true,
      isPdf: !!menu.pdf_url,
      pdfFile: null,
      pdfUrl: menu.pdf_url || ''
    })
  }

  const closeMenuDialog = () => {
    setMenuDialog(initialDialogState)
  }

  // --- Handlers ---

  const handleSaveMenu = async () => {
    if (!menuDialog.name.trim()) {
      toast.error('Il nome è obbligatorio')
      return
    }

    if (menuDialog.mode === 'create' && !workingLocationId) {
      toast.error('Seleziona una sede di lavoro prima di creare un menu')
      return
    }

    setIsSavingMenu(true)
    try {
      let finalPdfUrl: string | null = null
      const supabase = createClient()

      // Handle PDF upload/URL
      if (menuDialog.isPdf) {
        if (menuDialog.pdfFile) {
          const timestamp = Date.now()
          const cleanName = menuDialog.pdfFile.name.replace(/[^a-zA-Z0-9.]/g, '_')
          const filePath = `${organizationId}/${timestamp}-${cleanName}`

          const { error: uploadError } = await supabase.storage
            .from('menu-files')
            .upload(filePath, menuDialog.pdfFile)

          if (uploadError) {
            console.error(uploadError)
            toast.error('Errore durante il caricamento del file')
            return
          }

          const { data: { publicUrl } } = supabase.storage
            .from('menu-files')
            .getPublicUrl(filePath)

          finalPdfUrl = publicUrl
        } else if (menuDialog.pdfUrl) {
          finalPdfUrl = menuDialog.pdfUrl
        } else if (menuDialog.mode === 'create') {
          toast.error('Carica un file PDF o inserisci un link')
          return
        } else {
          // Edit mode: keep existing URL
          finalPdfUrl = menuDialog.pdfUrl || null
        }
      }

      if (menuDialog.mode === 'create') {
        // Create new menu
        await createMenu(organizationId, {
          name: menuDialog.name,
          description: menuDialog.description,
          pdf_url: finalPdfUrl || undefined,
          location_ids: [workingLocationId],
          is_active: menuDialog.isActive
        })
        toast.success(`Menu creato per ${currentWorkingLocation?.name}`)
      } else if (menuDialog.mode === 'edit' && menuDialog.menuId) {
        // Edit existing menu
        const currentMenu = menus.find(m => m.id === menuDialog.menuId)

        // Delete old PDF if switching to manual or uploading new file
        if ((!menuDialog.isPdf || (menuDialog.isPdf && menuDialog.pdfFile)) && currentMenu?.pdf_url) {
          try {
            const url = new URL(currentMenu.pdf_url)
            const pathParts = url.pathname.split('menu-files/')
            if (pathParts.length > 1) {
              const filePath = pathParts[1]
              if (filePath.includes(organizationId)) {
                await supabase.storage
                  .from('menu-files')
                  .remove([decodeURIComponent(filePath)])
              }
            }
          } catch (err) {
            console.error("Error deleting old PDF:", err)
          }
        }

        await updateMenu(menuDialog.menuId, {
          name: menuDialog.name,
          description: menuDialog.description,
          pdf_url: finalPdfUrl,
          is_active: menuDialog.isActive
        })
        toast.success('Menu aggiornato')
        router.refresh()
      }

      closeMenuDialog()
    } catch (error) {
      console.error(error)
      toast.error(menuDialog.mode === 'create' ? 'Errore durante la creazione del menu' : 'Errore aggiornamento menu')
    } finally {
      setIsSavingMenu(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMenu(id)
      toast.success('Menu eliminato')
    } catch (error) {
      toast.error('Errore durante l\'eliminazione')
    }
  }

  const openManageLocations = (menu: any) => {
    const currentIds = menu.menu_locations?.map((ml: any) => ml.location_id) || []
    setTempSelectedLocations(currentIds)
    setManagingMenuId(menu.id)
  }

  const handleSaveLocations = async () => {
    if (!managingMenuId) return
    try {
      await assignMenuToLocations(managingMenuId, tempSelectedLocations)
      toast.success('Disponibilità sedi aggiornata')
      setManagingMenuId(null)
    } catch (e) {
      toast.error('Errore aggiornamento sedi')
    }
  }


  if (!locations || locations.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Nessuna sede disponibile. Crea prima una sede per gestire i menu.
      </div>
    )
  }

  return (
    <PageWrapper className="relative">
      <div className='xl:hidden flex items-center justify-between gap-10'>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">I tuoi Menù</h2>
          <p className="text-muted-foreground max-w-3xl">Crea e gestisci i menù per le tue sedi.</p>
        </div>
        <Button size="sm" className="w-full sm:w-fit" onClick={openCreateDialog} disabled={isLimitReached}>
          {isLimitReached ? <Lock className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          Crea Menu
        </Button>
      </div>

      <OverviewCards
        data={[
          {
            title: 'Totale menù',
            value: menus.length,
            description: 'menù'
          },
          {
            title: 'Menù attivi',
            value: menus.filter(m => m.is_active).length,
            description: 'attivi'
          },
          {
            title: 'Menù creati',
            value: menus.length,
            description: 'menù'
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleMenus.map((menu) => (
            <MenuCard
              key={menu.id}
              menu={menu}
              openManageLocations={openManageLocations}
              openEditMenu={openEditDialog}
              handleDelete={handleDelete}
            />
          ))}
        </div>
      )}


      {/* Manage Locations Dialog */}
      <Dialog open={!!managingMenuId} onOpenChange={(open) => !open && setManagingMenuId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disponibilità Menu</DialogTitle>
            <DialogDescription>
              Seleziona le sedi dove rendere disponibile questo menu.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 border p-3 rounded-md max-h-60 overflow-y-auto my-4">
            {locations.map(location => (
              <div key={location.id} className="flex items-center space-x-2 py-1">
                <Checkbox
                  id={`manage-loc-${location.id}`}
                  checked={tempSelectedLocations.includes(location.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setTempSelectedLocations([...tempSelectedLocations, location.id])
                    } else {
                      setTempSelectedLocations(tempSelectedLocations.filter(id => id !== location.id))
                    }
                  }}
                />
                <Label htmlFor={`manage-loc-${location.id}`} className="cursor-pointer text-sm font-normal">
                  {location.name}
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManagingMenuId(null)}>Annulla</Button>
            <Button onClick={handleSaveLocations}>Salva Modifiche</Button>
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

      {menus.length > 0 && (
        <Button onClick={openCreateDialog} disabled={isLimitReached} className='absolute right-6 bottom-6 z-50 xl:flex hidden'>
          {isLimitReached ? <Lock className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          Nuovo Menù
        </Button>
      )}
    </PageWrapper>
  )
}

const MenuCard = ({
  menu,
  openManageLocations,
  openEditMenu,
  handleDelete
}: {
  menu: Menu
  openManageLocations: (menu: Menu) => void
  openEditMenu: (menu: Menu) => void
  handleDelete: (menuId: string) => void
}) => {
  return (
    <Card key={menu.id} className="flex flex-col relative group hover:shadow-md transition-all">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="truncate flex items-center gap-1.5" title={menu.name}>
              {menu.pdf_url ? (
                <FileText className="w-4 h-4" />
              ) : (
                <LayersPlus className="w-4 h-4" />
              )}
              {menu.name}
            </span>
          </CardTitle>
          <Badge variant="outline" style={{ backgroundColor: menu.is_active ? 'green' : 'red' }} className="text-white text-xs px-2 py-1 rounded-xl">
            {menu.is_active ? 'Attivo' : 'Inattivo'}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2 min-h-[2.5em]">
          {menu.description || 'Nessuna descrizione'}
        </CardDescription>
      </CardHeader>

      <div className="ml-auto px-6 pt-0 flex items-center gap-2">
        <Button variant="outline" className="w-fit" asChild>
          <a href={`/menus-management/${menu.id}`}>
            Apri
            <ChevronRight className="w-3 h-3" />
          </a>
        </Button>

        <GroupedActions
          items={[
            {
              label: 'Disponibilità',
              icon: <MapPin className="w-4 h-4" />,
              action: () => openManageLocations(menu)
            },
            {
              label: 'Modifica',
              icon: <Edit className="w-4 h-4" />,
              action: () => openEditMenu(menu)
            },
            {
              label: 'Elimina',
              icon: <Trash className="w-4 h-4 group-hover:text-red-500 dark:group-hover:text-white/80" />,
              variant: 'destructive',
              action: () => handleDelete(menu.id)
            }
          ]}
        />
      </div>
    </Card>
  )
}

export default MenuView
