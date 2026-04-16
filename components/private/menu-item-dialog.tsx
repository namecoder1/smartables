'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from './image-upload'
import { createMenuItem, deleteMenuItem, updateMenuItem } from '@/app/actions/menu-editor'
import { trackStorageUpload, deleteStorageFileAndTrack } from '@/app/actions/storage'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { NumberInput } from '../ui/number-input'
import { Trash2, Check, X, ChevronDown, ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import ConfirmDialog from '@/components/utility/confirm-dialog'
import { ResponsiveDialog } from '@/components/utility/responsive-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { MenuItem } from '@/types/general'

const ALLERGENS = [
  'Glutine', 'Lattosio', 'Frutta a guscio', 'Crostacei', 'Pesce', 'Molluschi',
  'Uova', 'Soia', 'Senape', 'Semi di sesamo', 'Miele'
]

const TAGS = [
  { id: 'gluten-free', label: 'Senza glutine', icon: '🌾' },
  { id: 'lactose-free', label: 'Senza lattosio', icon: '🥛' },
  { id: 'spicy', label: 'Piccante', icon: '🔥' },
  { id: 'vegan', label: 'Vegano', icon: '🥦' },
  { id: 'exclusive', label: 'Esclusivo', icon: '🏆' },
  { id: 'popular', label: 'Popolare', icon: '⭐️' },
]

interface MenuItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  menuId: string
  categoryId: string
  item?: MenuItem
  onSuccess: () => void
}

export function MenuItemDialog({
  open,
  onOpenChange,
  organizationId,
  menuId,
  categoryId,
  item,
  onSuccess
}: MenuItemDialogProps) {
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Item Form State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState<number | undefined>(undefined)
  const [isAvailable, setIsAvailable] = useState(true)
  const [isNew, setIsNew] = useState(false)
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | undefined>(undefined)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (open) {
      if (item) {
        setName(item.name)
        setDescription(item.description || '')
        setPrice(Number(item.price) || 0)
        setIsAvailable(item.is_available ?? true)
        setIsNew(item.is_new ?? false)
        setSelectedAllergens(item.allergens ?? [])
        setSelectedTags(item.tags ?? [])
        setExistingImageUrl(item.image_url ?? undefined)
        setOriginalImageUrl(item.image_url ?? undefined)
        setImageFile(null)
      } else {
        setName('')
        setDescription('')
        setPrice(undefined)
        setIsAvailable(true)
        setIsNew(false)
        setSelectedAllergens([])
        setSelectedTags([])
        setExistingImageUrl(undefined)
        setOriginalImageUrl(undefined)
        setImageFile(null)
      }
    }
  }, [open, item])

  const handleSubmit = async () => {
    if (!name.trim() || price === undefined) {
      toast.error('Nome e prezzo sono obbligatori')
      return
    }

    setLoading(true)
    try {
      let finalImageUrl: string | null | undefined = existingImageUrl

      // Image explicitly removed (no new file, preview cleared, but original existed)
      if (!imageFile && existingImageUrl === undefined && originalImageUrl) {
        await deleteStorageFileAndTrack(originalImageUrl, 'menu-images')
        finalImageUrl = null
      }

      if (imageFile) {
        const timestamp = Date.now()
        const fileExt = imageFile.name.split('.').pop()
        const filePath = `${organizationId}/${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const supabase = createClient()
        const { error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(filePath, imageFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('menu-images')
          .getPublicUrl(filePath)

        finalImageUrl = publicUrl
        await trackStorageUpload(imageFile.size)

        if (originalImageUrl) {
          await deleteStorageFileAndTrack(originalImageUrl, 'menu-images')
        }
      }

      const payload = {
        name,
        description,
        price: price || 0,
        is_available: isAvailable,
        is_new: isNew,
        allergens: selectedAllergens,
        tags: selectedTags,
        image_url: finalImageUrl ?? null
      }

      if (item) {
        await updateMenuItem(menuId, item.id, payload)
        toast.success('Articolo aggiornato')
      } else {
        await createMenuItem(menuId, categoryId, payload)
        toast.success('Articolo creato')
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error('Errore durante il salvataggio')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!item) return
    try {
      await deleteMenuItem(menuId, item.id)
      toast.success("Articolo eliminato")
      onSuccess()
      onOpenChange(false)
    } catch (e) {
      toast.error("Errore eliminazione")
    }
  }

  return (
    <ResponsiveDialog
      isOpen={open}
      setIsOpen={onOpenChange}
      title={item ? 'Modifica Piatto' : 'Nuovo Piatto'}
      description="Inserisci i dettagli, il prezzo e una foto invitante."
      className="sm:max-w-3xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
        {/* Left Column: Main Info */}
        <div className="space-y-4">
          <ImageUpload
            title="Foto"
            value={existingImageUrl}
            onChange={(url, file) => {
              setImageFile(file || null)
              setExistingImageUrl(url || undefined)
            }}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nome del piatto"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-semibold">Prezzo (€)</Label>
              <NumberInput
                id="price"
                value={price}
                onValueChange={(val) => setPrice(val)}
                placeholder="0.00"
                min={0}
                step={0.50}
                buttonHeight='h-5'
                context="default"
                className="h-10"
              />
            </div>
          </div>


          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="description" className="text-sm font-semibold">Descrizione</Label>
              <span className="text-[10px] text-muted-foreground">{description.length} / 1200</span>
            </div>
            <div className="relative">
              <Textarea
                id="description"
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Descrizione del piatto"
                className="resize-none pr-8 h-24"
              />
              {description && (
                <button
                  onClick={() => setDescription('')}
                  className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          
          <div className='grid grid-cols-2 h-12'>
            <div onClick={() => setIsNew(!isNew)} className={cn(
              "col-span-1 flex items-center border-2 border-r-0 justify-between px-3 cursor-pointer rounded-l-xl",
              isNew ? "bg-green-600/10 border-green-600/15 text-green-800" : "bg-red-100 border-red-200"
            )}>
              Nuovo prodotto {isNew ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-400" />}
            </div>
            <div onClick={() => setIsAvailable(!isAvailable)} className={cn(
              "col-span-1 flex items-center border-2 justify-between px-3 cursor-pointer rounded-r-xl",
              isAvailable ? "bg-green-600/10 border-green-600/15 text-green-800" : "bg-red-100 border-red-200"
            )}>
              Disponibilità {isAvailable ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-red-400" />}
            </div>
          </div>
        </div>

        {/* Right Column: Allergens & More */}
        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider">Tipologia</Label>
            <div className="flex flex-wrap gap-1.5">
              {TAGS.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => {
                    setSelectedTags(prev =>
                      prev.includes(tag.id)
                        ? prev.filter(t => t !== tag.id)
                        : [...prev, tag.id]
                    )
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full border-[1.5px] text-xs font-medium transition-all",
                    selectedTags.includes(tag.id)
                      ? "bg-primary/20 text-black border-primary/40"
                      : "bg-white"
                  )}
                >
                  <span>{tag.icon}</span>
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-2 rounded-xl overflow-hidden bg-white">
            <div className="p-4 border-b-2 flex justify-between items-center bg-slate-50/50">
              <Label className="text-sm font-bold">Allergeni</Label>
              <ChevronDownIcon className="w-4 h-4 text-slate-400" />
            </div>
            <div className="p-4 max-h-70 overflow-y-auto space-y-3 custom-scrollbar">
              {ALLERGENS.map(allergen => (
                <div key={allergen} className="flex items-center gap-3 group cursor-pointer" onClick={() => {
                  setSelectedAllergens(prev =>
                    prev.includes(allergen)
                      ? prev.filter(a => a !== allergen)
                      : [...prev, allergen]
                  )
                }}>
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                    selectedAllergens.includes(allergen)
                      ? "bg-primary/70 border-primary"
                      : "bg-white border-slate-300 group-hover:border-slate-400"
                  )}>
                    {selectedAllergens.includes(allergen) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={cn(
                    "text-sm transition-colors",
                    selectedAllergens.includes(allergen) ? "text-slate-900 font-medium" : "text-slate-600"
                  )}>
                    {allergen}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={cn('flex mt-auto gap-3 pt-4', item ? 'justify-end' : 'md:justify-end')}>
            {item && (
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                Elimina
              </Button>
            )}
            <Button className={cn(item ? 'w-fit' : 'w-full md:w-fit')} onClick={handleSubmit} disabled={loading}>
              {loading ? 'Salvataggio...' : (item ? 'Salva' : 'Aggiungi')}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Elimina Piatto"
        description="Sei sicuro di voler eliminare questo articolo? Questa azione non può essere annullata."
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </ResponsiveDialog>
  )
}
