'use client'

import { useState } from 'react'
import { Card, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash, ChevronRight, FileText, MapPin, Globe, Settings, Edit, Link, LayersPlus } from 'lucide-react'
import { createMenu, deleteMenu, assignMenuToLocations, updateMenu } from '@/app/actions/settings'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { MenusTabProps } from '@/types/components'
import { Textarea } from '../ui/textarea'
import { Checkbox } from '../ui/checkbox'
import { createClient } from '@/supabase/client'
import { PdfUpload } from './pdf-upload'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import GroupedActions from '../utility/grouped-actions'

const MenusTab = ({ menus, organizationId, locations }: MenusTabProps) => {
  const router = useRouter()
  // Navigation / Context State
  const [workingLocationId, setWorkingLocationId] = useState<string>(
    locations && locations.length > 0 ? locations[0].id : ''
  )

  // Create State
  const [isCreating, setIsCreating] = useState(false)
  const [newMenuName, setNewMenuName] = useState('')
  const [newMenuDescription, setNewMenuDescription] = useState('')
  const [isActive, setIsActive] = useState(true)

  // PDF Menu State (Create)
  const [isPdfMenu, setIsPdfMenu] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfUrl, setPdfUrl] = useState('')

  // Edit Menu State
  const [isEditingMenu, setIsEditingMenu] = useState(false)
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)
  const [editIsPdf, setEditIsPdf] = useState(false)
  const [editPdfFile, setEditPdfFile] = useState<File | null>(null)
  const [editPdfUrl, setEditPdfUrl] = useState('')
  const [isSavingMenu, setIsSavingMenu] = useState(false)

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

  // --- Handlers ---

  const handleCreate = async () => {
    if (!newMenuName.trim()) {
      toast.error('Il nome è obbligatorio')
      return
    }

    if (!workingLocationId) {
      toast.error('Seleziona una sede di lavoro prima di creare un menu')
      return
    }

    try {
      let finalPdfUrl: string | undefined = undefined

      if (isPdfMenu) {
        if (!pdfFile && !pdfUrl) {
          toast.error('Carica un file PDF o inserisci un link')
          return
        }

        if (pdfFile) {
          const supabase = createClient()
          const timestamp = Date.now()
          const cleanName = pdfFile.name.replace(/[^a-zA-Z0-9.]/g, '_')
          const filePath = `${organizationId}/${timestamp}-${cleanName}`

          const { error: uploadError } = await supabase.storage
            .from('menu-files')
            .upload(filePath, pdfFile)

          if (uploadError) {
            console.error(uploadError)
            toast.error('Errore durante il caricamento del file')
            return
          }

          const { data: { publicUrl } } = supabase.storage
            .from('menu-files')
            .getPublicUrl(filePath)

          finalPdfUrl = publicUrl
        } else {
          finalPdfUrl = pdfUrl
        }
      }

      // Auto-assign to Working Location
      await createMenu(organizationId, {
        name: newMenuName,
        description: newMenuDescription,
        pdf_url: finalPdfUrl,
        location_ids: [workingLocationId],
        is_active: isActive
      })

      toast.success(`Menu creato per ${currentWorkingLocation?.name}`)
      setIsCreating(false)
      setNewMenuName('')
      setNewMenuDescription('')
      setIsActive(true)
      setIsPdfMenu(false)
      setPdfFile(null)
      setPdfUrl('')
    } catch (error) {
      console.error(error)
      toast.error('Errore durante la creazione del menu')
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

  // --- Edit Menu Handlers ---
  const openEditMenu = (menu: any) => {
    setEditingMenuId(menu.id)
    setEditName(menu.name)
    setEditDesc(menu.description || '')
    setEditIsActive(menu.is_active ?? true)
    setEditIsPdf(!!menu.pdf_url)
    setEditPdfUrl(menu.pdf_url || '')
    setEditPdfFile(null)
    setIsEditingMenu(true)
  }

  const handleUpdateMenu = async () => {
    if (!editingMenuId) return
    if (!editName.trim()) {
      toast.error('Il nome è obbligatorio')
      return
    }

    setIsSavingMenu(true)
    try {
      let finalPdfUrl = editIsPdf ? editPdfUrl : null
      const supabase = createClient()

      const currentMenu = menus.find(m => m.id === editingMenuId)

      // Delete old PDF if switching to manual or uploading new file
      if ((!editIsPdf || (editIsPdf && editPdfFile)) && currentMenu?.pdf_url) {
        try {
          // Extract path from public URL
          // URL format: .../storage/v1/object/public/menu-files/<path>
          const url = new URL(currentMenu.pdf_url)
          const pathParts = url.pathname.split('menu-files/')
          if (pathParts.length > 1) {
            const filePath = pathParts[1]
            // Only delete if it looks like a valid path (contains organizationId)
            if (filePath.includes(organizationId)) {
              await supabase.storage
                .from('menu-files')
                .remove([decodeURIComponent(filePath)])
            }
          }
        } catch (err) {
          console.error("Error deleting old PDF:", err)
          // Non-blocking error, proceed with update
        }
      }

      // Handle File Upload if new file selected
      if (editIsPdf && editPdfFile) {
        const timestamp = Date.now()
        const cleanName = editPdfFile.name.replace(/[^a-zA-Z0-9.]/g, '_')
        const filePath = `${organizationId}/${timestamp}-${cleanName}`

        const { error: uploadError } = await supabase.storage
          .from('menu-files')
          .upload(filePath, editPdfFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('menu-files')
          .getPublicUrl(filePath)

        finalPdfUrl = publicUrl
      }

      await updateMenu(editingMenuId, {
        name: editName,
        description: editDesc,
        pdf_url: finalPdfUrl,
        is_active: editIsActive
      })

      toast.success('Menu aggiornato')
      setIsEditingMenu(false)
      setEditingMenuId(null)
      router.refresh()
    } catch (e) {
      console.error(e)
      toast.error('Errore aggiornamento menu')
    } finally {
      setIsSavingMenu(false)
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
    <div className="space-y-6">
      <div className='flex items-center justify-between'>
        <div>
          <h2 className="text-lg font-semibold">I tuoi Menù</h2>
          <p className="text-muted-foreground">Crea e gestisci i menù per le tue sedi.</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-fit">
              <Plus className="w-4 h-4 mr-2" />
              Crea Menu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Nuovo Menu</DialogTitle>
              <DialogDescription>
                Stai creando un menu per <strong>{currentWorkingLocation?.name}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome menù</Label>
                <Input
                  id="name"
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  placeholder="es. Menu Pranzo"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descrizione menù</Label>
                <Textarea
                  id="description"
                  rows={2}
                  value={newMenuDescription}
                  onChange={(e) => setNewMenuDescription(e.target.value)}
                  placeholder="Descrizione opzionale..."
                />
              </div>

              <div className="flex items-center gap-2 border p-3 rounded-md bg-muted/10">
                <Checkbox id="isActive" checked={isActive} onCheckedChange={(c) => setIsActive(!!c)} />
                <Label htmlFor="isActive" className="cursor-pointer font-medium">Attivo</Label>
              </div>

              <div className="flex items-center gap-2 border p-3 rounded-md bg-muted/10">
                <Checkbox id="isPdf" checked={isPdfMenu} onCheckedChange={(c) => setIsPdfMenu(!!c)} />
                <Label htmlFor="isPdf" className="cursor-pointer font-medium">Menu formato PDF / Link</Label>
              </div>

              {isPdfMenu && (
                <div className="grid gap-4 p-4 bg-muted/40 rounded-md border border-dashed animate-in fade-in-50 zoom-in-95">
                  <div className="grid gap-2">
                    <Label>Carica File PDF</Label>
                    <PdfUpload
                      value={null}
                      onChange={(_, file) => setPdfFile(file || null)}
                    />
                  </div>
                  <div className="relative text-center py-2">
                    <span className="bg-muted/40 px-2 text-xs text-muted-foreground uppercase">Oppure</span>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pdfUrl">Link Esterno</Label>
                    <Input
                      id="pdfUrl"
                      placeholder="https://example.com/menu.pdf"
                      value={pdfUrl}
                      onChange={(e) => setPdfUrl(e.target.value)}
                      disabled={!!pdfFile}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleCreate}>Crea Menu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>


      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visibleMenus.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-10 border border-dashed rounded-lg text-muted-foreground bg-muted/10">
            <FileText className="w-10 h-10 mb-4 opacity-20" />
            <p>Nessun menu disponibile per {currentWorkingLocation?.name}.</p>
            <Button variant="link" onClick={() => setIsCreating(true)}>Crea il primo menu</Button>
          </div>
        ) : (
          visibleMenus.map((menu) => (
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
                  <Badge variant="outline" style={{ backgroundColor: menu.is_active ? 'green' : 'red' }} className="text-white text-xs px-2 py-1">
                    {menu.is_active ? 'Attivo' : 'Inattivo'}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 min-h-[2.5em]">
                  {menu.description || 'Nessuna descrizione'}
                </CardDescription>
              </CardHeader>

              <div className="ml-auto px-6 pt-0 flex items-center gap-2">
                <Button variant="outline" className="w-fit" asChild>
                  <a href={`/settings/menus/${menu.id}`}>
                    Apri
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </a>
                </Button>

                <GroupedActions
                  items={[
                    {
                      label: 'Gestisci Sedi',
                      icon: <MapPin className="w-4 h-4" />,
                      action: () => openManageLocations(menu)
                    },
                    {
                      label: 'Gestisci Menu',
                      icon: <Edit className="w-4 h-4" />,
                      action: () => openEditMenu(menu)
                    },
                    {
                      label: 'Elimina',
                      icon: <Trash className="w-4 h-4" />,
                      variant: 'destructive',
                      action: () => handleDelete(menu.id)
                    }
                  ]}
                />
              </div>
            </Card>
          ))
        )}
      </div>

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

      {/* Edit Menu Dialog */}
      <Dialog open={isEditingMenu} onOpenChange={setIsEditingMenu}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Modifica Menu</DialogTitle>
            <DialogDescription>
              Aggiorna i dettagli del menu. Se è un menu PDF, puoi caricare un nuovo file.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input id="edit-name" value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-desc">Descrizione</Label>
              <Textarea id="edit-desc" value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2} />
            </div>

            <div className='grid grid-cols-2 gap-2'>
              <div className="flex items-center gap-2 border p-3 rounded-md bg-muted/10">
                <Checkbox id="edit-isActive" checked={editIsActive} onCheckedChange={c => setEditIsActive(!!c)} />
                <Label htmlFor="edit-isActive">Attivo</Label>
              </div>

              <div className="flex items-center gap-2 border p-3 rounded-md bg-muted/10">
                <Checkbox id="edit-isPdf" checked={editIsPdf} onCheckedChange={c => setEditIsPdf(!!c)} />
                <Label htmlFor="edit-isPdf">Menu PDF</Label>
              </div>
            </div>

            {editIsPdf && (
              <div className="grid gap-2 p-4 bg-muted/40 rounded-md border border-dashed">
                <div className="grid gap-2">
                  <div className='flex items-center justify-between gap-2'>
                    <Label>Aggiorna File PDF</Label>
                    {editPdfUrl && !editPdfFile && (
                      <p className="text-xs text-muted-foreground">Attuale: <a href={editPdfUrl} target="_blank" className="underline text-primary">Apri</a></p>
                    )}
                  </div>
                  <PdfUpload value={null} onChange={(_, f) => setEditPdfFile(f || null)} />
                </div>
                <div className="relative text-center">
                  <span className="bg-muted/40 px-2 text-xs text-muted-foreground uppercase">Oppure Link</span>
                </div>
                <Input
                  value={editPdfUrl}
                  onChange={e => setEditPdfUrl(e.target.value)}
                  placeholder="https://..."
                  disabled={!!editPdfFile}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingMenu(false)}>Annulla</Button>
            <Button onClick={handleUpdateMenu} disabled={isSavingMenu}>
              {isSavingMenu ? 'Salvataggio...' : 'Salva Modifiche'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

export default MenusTab
