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
import { Plus, Trash2 } from 'lucide-react'
import ConfirmDialog from '@/components/utility/confirm-dialog'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { inviteCollaborator, removeCollaborators } from './actions'
import { User as UserType } from '@supabase/supabase-js'
import { Checkbox } from '@/components/ui/checkbox'
import OverviewCards from '@/components/private/overview-cards'
import { useOrganization } from '@/components/providers/organization-provider'
import { BASE_STAFF_BY_TIER } from '@/lib/addons'
import { ButtonGroup } from '@/components/ui/button-group'
import { FaqContent } from '@/components/private/faq-section'
import { SanityFaq } from '@/utils/sanity/queries'
import { cn } from '@/lib/utils'

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
  faqs: SanityFaq[]
}

const CollaboratorsView = ({ 
  collaborators, 
  user, 
  organizationLocations, 
  faqs 
}: CollaboratorsViewProps) => {
  const [open, setOpen] = useState(false)
  const { organization } = useOrganization()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isDeletePending, startDeleteTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const currentUserRole = collaborators.find(c => c.id === user.id)?.role
  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'owner'

  const deletableCollaborators = collaborators.filter(c => c.id !== user.id && c.role !== 'owner')
  const allSelected = deletableCollaborators.length > 0 && selected.size === deletableCollaborators.length

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(deletableCollaborators.map(c => c.id)))
  }

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDelete = () => {
    const ids = Array.from(selected)
    startDeleteTransition(async () => {
      const result = await removeCollaborators(ids)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Collaboratori rimossi con successo')
        setSelected(new Set())
      }
    })
  }

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

  const maxStaff = BASE_STAFF_BY_TIER[organization?.billing_tier as string]
  console.log(selected.size)

  return (
    <PageWrapper className='relative'>
      <div className="flex items-center justify-between gap-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestisci collaboratori</h1>
          <p className="text-muted-foreground">Gestisci i collaboratori della tua organizzazione.</p>
        </div>

        <ButtonGroup>
          <FaqContent
            variant='minimized'
            title='Aiuto'
            faqs={faqs}
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-sm hidden xl:flex">
                <Plus className="h-4 w-4" /> Aggiungi
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-106.25">
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
                        <Label className="text-left pt-2">
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
        </ButtonGroup>
      </div>

      

      <OverviewCards
        data={[
          {
            title: 'Collaboratori totali',
            value: collaborators.length,
            description: '',
            icon: <RiUserShared2Line className='text-primary size-6 2xl:size-8' />
          },
          {
            title: 'Collaboratori attivi',
            value: collaborators.filter((collaborator) => collaborator.role !== 'owner').length,
            description: 'attivi',
            icon: <RiUserStarLine className='text-primary size-6 2xl:size-8' />
          },
          {
            title: 'Collaboratori massimi',
            value: maxStaff === 10000 ? 'Illimitati' : maxStaff,
            description: 'max',
            icon: <RiUserSettingsLine className='text-primary size-6 2xl:size-8' />
          }
        ]}
      />

      <div className="">
        {selected.size > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-card border-2 rounded-3xl mb-2">
            <span className="text-sm text-muted-foreground">
              {selected.size} selezionat{selected.size === 1 ? 'o' : 'i'}
            </span>
            {isAdmin && (
              <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Rimuovi collaboratori"
                description={`Sei sicuro di voler rimuovere ${selected.size} collaborator${selected.size === 1 ? 'e' : 'i'}? Perderanno l'accesso all'organizzazione.`}
                confirmLabel="Rimuovi"
                cancelLabel="Annulla"
                variant="destructive"
                onConfirm={handleDelete}
                disabled={isDeletePending}
                trigger={
                  <Button size="sm" variant="destructive" disabled={isDeletePending}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                }
              />
            )}
          </div>
        )}
        <Table>
          <TableHeader className='bg-card'>
            <TableRow className='hover:bg-card/50'>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Seleziona tutti"
                  disabled={deletableCollaborators.length === 0}
                />
              </TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Ruolo</TableHead>
              <TableHead>Stato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className='bg-card/40'>
            {collaborators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
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
              collaborators.map((collaborator) => {
                const isDeletable = collaborator.id !== user.id && collaborator.role !== 'owner'
                return (
                  <TableRow key={collaborator.id} className='hover:bg-card'>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.has(collaborator.id)}
                        onCheckedChange={() => toggleOne(collaborator.id)}
                        aria-label="Seleziona"
                        disabled={!isDeletable}
                      />
                    </TableCell>
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
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Button className="shadow-sm absolute bottom-6 flex xl:hidden right-6" disabled={collaborators.length >= maxStaff} onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Aggiungi
      </Button>
    </PageWrapper>
  )
}

export default CollaboratorsView