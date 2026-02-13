'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from './image-upload'
import { createMenuItem, deleteMenuItem, updateMenuItem } from '@/app/actions/settings'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { NumberInput } from '../ui/number-input'
import { Trash2 } from 'lucide-react'

interface MenuItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  menuId: string
  categoryId: string
  item?: any
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

  // Item Form State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState<number | undefined>(undefined)
  const [isAvailable, setIsAvailable] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (open) {
      if (item) {
        setName(item.name)
        setDescription(item.description || '')
        setPrice(Number(item.price) || 0)
        setIsAvailable(item.is_available ?? true)
        setExistingImageUrl(item.image_url)
        setImageFile(null)
      } else {
        setName('')
        setDescription('')
        setPrice(undefined)
        setIsAvailable(true)
        setExistingImageUrl(undefined)
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
      let finalImageUrl = existingImageUrl

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
      }

      const payload = {
        name,
        description,
        price: price || 0,
        is_available: isAvailable,
        image_url: finalImageUrl
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

  const handleDelete = async () => {
    if (confirm("Sei sicuro di voler eliminare questo articolo?")) {
      try {
        await deleteMenuItem(menuId, item.id)
        toast.success("Articolo eliminato")
        onSuccess()
        onOpenChange(false)
      } catch (e) {
        toast.error("Errore eliminazione")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
        <DialogHeader className="p-6 pb-2 border-b bg-slate-50/50">
          <DialogTitle>{item ? 'Modifica Piatto' : 'Nuovo Piatto'}</DialogTitle>
          <DialogDescription>
            Inserisci i dettagli, il prezzo e una foto invitante.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left: Image */}
            <div className="md:w-1/3 flex flex-col gap-2">
              <Label>Foto Piatto</Label>
              <div className="aspect-square w-full">
                <ImageUpload
                  title="Foto Piatto"
                  value={existingImageUrl}
                  onChange={(url, file) => {
                    setImageFile(file || null)
                    setExistingImageUrl(url || undefined)
                  }}
                />
              </div>
            </div>

            {/* Right: Details */}
            <div className="md:w-2/3 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Piatto <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="es. Carbonara"
                  className="font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Prezzo (€) <span className="text-red-500">*</span></Label>
                <div className="w-32">
                  <NumberInput
                    id="price"
                    value={price}
                    onValueChange={(val) => setPrice(val)}
                    placeholder="0.00"
                    min={0}
                    step={0.50}
                    context="default"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrizione & Allergeni</Label>
            <Textarea
              id="description"
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descrivi gli ingredienti principali..."
              className="resize-none"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4 bg-slate-50 mt-2">
            <div className="space-y-0.5">
              <Label className="text-base">Disponibilità</Label>
              <div className="text-xs text-muted-foreground">
                Se disattivato, apparirà come "Non disponibile"
              </div>
            </div>
            <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-slate-50/50 flex sm:justify-between items-center w-full">
          {item ? (
            <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Elimina
            </Button>
          ) : <div />} {/* Spacer */}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Salvataggio...' : (item ? 'Salva Modifiche' : 'Crea Piatto')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
