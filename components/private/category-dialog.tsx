'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { createCategory, updateCategory } from '@/app/actions/menu-editor'
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{category ? 'Modifica Categoria' : 'Nuova Categoria'}</DialogTitle>
          <DialogDescription>
            Organizza il tuo menu in sezioni (es. Antipasti, Primi).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="cat-name">Nome Categoria</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="es. I Nostri Primi"
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cat-desc">Descrizione (Opzionale)</Label>
            <Textarea
              rows={3}
              id="cat-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Breve descrizione che apparirà sotto il titolo..."
              className="resize-none"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border px-4 py-2 bg-background dark:bg-input/30">
            <div className="space-y-0.5">
              <Label className="text-base">Visibilità</Label>
              <div className="text-xs text-muted-foreground">
                Rendi questa categoria visibile nel menu pubblico
              </div>
            </div>
            <Switch checked={isVisible} onCheckedChange={setIsVisible} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
            {loading ? 'Salvataggio...' : (category ? 'Salva Modifiche' : 'Crea Categoria')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
