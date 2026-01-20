'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { createCategory, updateCategory } from '@/app/actions/settings'
import { toast } from 'sonner'
import { Checkbox } from '../ui/checkbox'
import { Textarea } from '../ui/textarea'

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  menuId: string
  category?: any
  onSuccess: () => void
}

export function CategoryDialog({
  open,
  onOpenChange,
  organizationId,
  menuId,
  category,
  onSuccess
}: CategoryDialogProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (open) {
      if (category) {
        setName(category.name)
        setDescription(category.description ?? '')
        setIsVisible(category.is_visible ?? true)
      } else {
        setName('')
        setDescription('')
        setIsVisible(true)
      }
    }
  }, [open, category])

  const handleSubmit = async () => {
    if (!name.trim()) return

    setLoading(true)
    try {
      const payload = { name, description, is_visible: isVisible }
      if (category) {
        await updateCategory(category.id, menuId, payload)
        toast.success('Categoria aggiornata')
      } else {
        await createCategory(menuId, organizationId, payload)
        toast.success('Categoria creata')
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.error('Impossibile salvare la categoria')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Modifica Categoria' : 'Nuova Categoria'}</DialogTitle>
          <DialogDescription>
            Organizza i tuoi articoli in categorie.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="cat-name">Nome</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="es: Aperitivi"
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cat-name">Descrizione</Label>
            <Textarea
              rows={2}
              id="cat-name"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="es. Drink e Tapas creati con cura e passione"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-base">Visibile</Label>
              <div className="text-sm text-muted-foreground">
                Mostra questa categoria ai clienti
              </div>
            </div>
            <Checkbox checked={isVisible} onCheckedChange={(checked) => setIsVisible(checked as boolean)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvataggio...' : (category ? 'Salva Cambiamenti' : 'Crea Categoria')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
