'use client'

import PageWrapper from '@/components/private/page-wrapper'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { inviteCollaborator } from './actions'

const CollaboratorsView = () => {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await inviteCollaborator(null, formData)

      if (result?.error) {
        toast.error(result.error)
      } else {
        setOpen(false)
        toast.success('Invito inviato con successo!')
      }
    })
  }

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestisci collaboratori</h1>
          <p className="text-muted-foreground">Gestisci i collaboratori della tua organizzazione.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="h-4 w-4" /> Aggiungi
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Invita Collaboratore</DialogTitle>
              <DialogDescription>
                Invia un invito via email a un nuovo membro del team.
              </DialogDescription>
            </DialogHeader>
            <form action={onSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="mario.rossi@esempio.com"
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Ruolo
                  </Label>
                  <div className="col-span-3">
                    <Select name="role" defaultValue="staff" required>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder="Seleziona ruolo" />
                      </SelectTrigger>
                      <SelectContent position='popper'>
                        <SelectItem value="admin">Amministratore</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Invio in corso...' : 'Invia Invito'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* TODO: Add Data Table of Collaborators here */}
      <div className="rounded-md border p-12 flex flex-col items-center justify-center text-center bg-white/50 border-dashed">
        <div className="rounded-full bg-gray-100 p-3 mb-4">
          <Plus className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold">Nessun collaboratore</h3>
        <p className="text-muted-foreground max-w-sm mt-2">
          Non hai ancora invitato collaboratori. Inizia invitando qualcuno al tuo team.
        </p>
      </div>

    </PageWrapper>
  )
}

export default CollaboratorsView