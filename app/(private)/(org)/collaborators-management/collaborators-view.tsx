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

import { RiUserStarLine, RiUserSettingsLine, RiUserShared2Line } from "react-icons/ri";

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
import OverviewCards from '@/components/private/overview-cards'
import { useOrganization } from '@/components/providers/organization-provider'

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
  organizationLocations: { id: string; name: string }[]
}

const CollaboratorsView = ({ collaborators, user, organizationLocations }: CollaboratorsViewProps) => {
  const [open, setOpen] = useState(false)
  const { organization } = useOrganization()
  const [isPending, startTransition] = useTransition()

  const [locationType, setLocationType] = useState<"all" | "selected">("all")
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])

  async function onSubmit(formData: FormData) {
    startTransition(async () => {
      // Append the location selections
      if (organization?.billing_tier !== "starter") {
        formData.append("location_type", locationType)
        if (locationType === "selected") {
          formData.append("selected_locations", JSON.stringify(selectedLocations))
        }
      }

      const result = await inviteCollaborator(null, formData)

      if (result?.error) {
        toast.error(result.error)
      } else {
        setOpen(false)
        setLocationType("all")
        setSelectedLocations([])
        toast.success('Invito inviato con successo!')
      }
    })
  }

  const collaboratorCount = organization?.billing_tier === "starter" ? 1 : organization?.billing_tier === "growth" ? 3 : 5

  return (
    <PageWrapper className='relative'>
      <div className="flex items-center justify-between gap-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestisci collaboratori</h1>
          <p className="text-muted-foreground">Gestisci i collaboratori della tua organizzazione.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm hidden xl:flex">
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

                {organization?.billing_tier !== "starter" && (
                  <>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right pt-2">
                        Sedi accessibili
                      </Label>
                      <div className="col-span-3 space-y-4">
                        <Select
                          value={locationType}
                          onValueChange={(value: "all" | "selected") => setLocationType(value)}
                        >
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder="Sedi accessibili" />
                          </SelectTrigger>
                          <SelectContent position='popper'>
                            <SelectItem value="all">Tutte le sedi</SelectItem>
                            <SelectItem value="selected">Sedi specifiche</SelectItem>
                          </SelectContent>
                        </Select>

                        {locationType === "selected" && (
                          <div className="space-y-2 border rounded-md p-3 max-h-48 overflow-y-auto">
                            {organizationLocations.map(loc => (
                              <label key={loc.id} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-primary focus:ring-primary"
                                  checked={selectedLocations.includes(loc.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedLocations([...selectedLocations, loc.id])
                                    } else {
                                      setSelectedLocations(selectedLocations.filter(id => id !== loc.id))
                                    }
                                  }}
                                />
                                <span className="text-sm font-medium">{loc.name}</span>
                              </label>
                            ))}
                            {organizationLocations.length === 0 && (
                              <div className="text-sm text-muted-foreground p-2">Nessuna sede disponibile.</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
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

      <OverviewCards
        data={[
          {
            title: 'Collaboratori totali',
            value: collaborators.length,
            description: '',
            icon: <RiUserShared2Line size={24} className='text-primary' />
          },
          {
            title: 'Collaboratori attivi',
            value: collaborators.filter((collaborator) => collaborator.role !== 'owner').length,
            description: 'attivi',
            icon: <RiUserStarLine size={24} className='text-primary' />
          },
          {
            title: 'Collaboratori massimi',
            value: organization?.billing_tier === "starter" ? 1 : organization?.billing_tier === "growth" ? 3 : 5,
            description: 'max',
            icon: <RiUserSettingsLine size={24} className='text-primary' />
          }
        ]}
      />

      <div className="flex items-start gap-4 rounded-lg border bg-primary/20 p-4 dark:bg-primary/20 dark:text-primary border-primary dark:border-primary">
        <div className="space-y-2">
          <p className="font-semibold text-lg tracking-tight leading-none">Semplifica la gestione dei tuoi collaboratori</p>
          <p className="text-sm opacity-90">
            Per rendere più efficiente la gestione di questa sede considera di aggiungere un collaboratore, il tuo piano ne supporta {collaboratorCount}.
          </p>
        </div>
      </div>

      <div className="border-2 rounded-xl">
        <Table className='rounded-xl'>
          <TableHeader className='bg-card'>
            <TableRow className='hover:bg-card/50'>
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
                <TableRow key={collaborator.id} className='hover:bg-card'>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold">
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

      <Button className="shadow-sm absolute bottom-6 flex xl:hidden right-6" disabled={collaborators.length >= collaboratorCount} onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Aggiungi
      </Button>
    </PageWrapper>
  )
}

export default CollaboratorsView