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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, User, Mail, Shield } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { inviteCollaborator } from './actions'
import { User as UserType } from '@supabase/supabase-js'

type Collaborator = {
  id: string
  email: string
  full_name: string | null
  role: string | null
  created_at: string
}

interface CollaboratorsViewProps {
  collaborators: Collaborator[]
  user: UserType
}

const CollaboratorsView = ({ collaborators, user }: CollaboratorsViewProps) => {
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
    <PageWrapper className='relative'>
      <div className="flex xl:hidden items-center justify-between mb-6">
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

      <div className="border-2 rounded-xl">
        <Table className='rounded-xl'>
          <TableHeader className='bg-muted'>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Ruolo</TableHead>
              <TableHead>Stato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className='bg-card/40'>
            {collaborators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="rounded-full bg-gray-100 p-3 mb-2">
                      <Plus className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold">Nessun collaboratore</h3>
                    <p className="text-muted-foreground max-w-sm mt-1">
                      Non hai ancora invitato collaboratori.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              collaborators.map((collaborator) => (
                <TableRow key={collaborator.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {collaborator.full_name ? collaborator.full_name.charAt(0).toUpperCase() : collaborator.email.charAt(0).toUpperCase()}
                      </div>
                      {collaborator.full_name || "Invitato"} {(user.id === collaborator.id) && "(tu)"}
                    </div>
                  </TableCell>
                  <TableCell>{user.id === collaborator.id ? user.email : collaborator.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize border! border-border!">
                      {collaborator.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {collaborator.full_name ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 border-none">
                        Attivo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-none">
                        In attesa
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Button className="shadow-sm absolute bottom-6 hidden xl:flex right-6" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Aggiungi
      </Button>
    </PageWrapper>
  )
}

export default CollaboratorsView