'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from './image-upload'
import { createMenuItem, deleteMenuItem, updateMenuItem } from '@/app/actions/settings'
import { createClient } from '@/supabase/client'
import { toast } from 'sonner'
import { Checkbox } from '../ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Pencil, Plus, Trash2, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface MenuItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  menuId: string // Added
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
  const [activeTab, setActiveTab] = useState('general')

  // Item Form State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (open) {
      setActiveTab('general') // Reset tab
      if (item) {
        setName(item.name)
        setDescription(item.description || '')
        setPrice(item.price.toString())
        setIsAvailable(item.is_available ?? true)
        setExistingImageUrl(item.image_url)
        setImageFile(null)
      } else {
        setName('')
        setDescription('')
        setPrice('')
        setIsAvailable(true)
        setExistingImageUrl(undefined)
        setImageFile(null)
      }
    }
  }, [open, item])

  const handleSubmit = async () => {
    if (!name.trim() || !price) {
      toast.error('Nome e prezzo sono obbligatori')
      return
    }

    setLoading(true)
    try {
      let finalImageUrl = existingImageUrl

      if (imageFile) {
        // Upload logic remains same
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
        price: parseFloat(price),
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className=" max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>{item ? 'Modifica Articolo' : 'Nuovo Articolo'}</DialogTitle>
          <DialogDescription>
            Definisci i dettagli del tuo piatto.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <div className="grid gap-6">
            {/* ... Fields ... */}
            <div className="flex flex-col gap-6">
              <div>
                <ImageUpload
                  value={existingImageUrl}
                  onChange={(url, file) => {
                    setImageFile(file || null)
                    setExistingImageUrl(url || undefined)
                  }}
                />
              </div>
              <div className="space-y-4">
                <div className='grid grid-cols-2 gap-4'>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome Piatto</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Es. Pizza Margherita"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Prezzo (€)</Label>
                    <div className="relative">
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        className="pl-7"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3 mt-2">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Disponibile</Label>
                  </div>
                  <Checkbox checked={isAvailable} onCheckedChange={(checked) => setIsAvailable(checked as boolean)} />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ingredienti, allergeni, dettagli..."
                className="min-h-[100px]"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-muted/20">
          <Button onClick={() => {
            deleteMenuItem(menuId, item.id)
            onOpenChange(false) 
          }} variant="destructive">Elimina articolo</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvataggio...' : (item ? 'Salva Modifiche' : 'Crea Articolo')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
