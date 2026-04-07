"use client"

import { Customer } from '@/types/general'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { CircleQuestionMark, User, Calendar, Star, Trash2 } from 'lucide-react'
import NoItems from '../utility/no-items'
import { useRouter } from 'next/navigation'
import { Badge } from '../ui/badge'
import { formatPhoneNumber } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { Checkbox } from '../ui/checkbox'
import { Button } from '../ui/button'
import { useState, useTransition } from 'react'
import { deleteCustomers } from '@/app/actions/customers'
import { toast } from 'sonner'
import ConfirmDialog from '../utility/confirm-dialog'

const ClientsTable = ({
  data,
  isAdmin,
  onDelete,
}: {
  data: Customer[] | null
  isAdmin?: boolean
  onDelete?: (ids: string[]) => void
}) => {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!data || data.length === 0) {
    return (
      <NoItems
        variant='children'
        icon={<CircleQuestionMark size={28} className='text-primary' />}
        title="Nessun cliente"
        description="Non ci sono clienti registrati per questa sede."
      />
    )
  }

  const allSelected = data.length > 0 && selected.size === data.length

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(data.map(c => c.id)))
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
    startTransition(async () => {
      const result = await deleteCustomers(ids)
      if (result.success) {
        toast.success('Clienti eliminati con successo')
        setSelected(new Set())
        onDelete?.(ids)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="w-full">
      {selected.size > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/30 border-b-2">
          <span className="text-sm text-muted-foreground">
            {selected.size} selezionat{selected.size === 1 ? 'o' : 'i'}
          </span>
          {isAdmin && (
            <ConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title="Elimina clienti"
              description={`Sei sicuro di voler eliminare ${selected.size} client${selected.size === 1 ? 'e' : 'i'}? L'operazione non può essere annullata.`}
              confirmLabel="Elimina"
              cancelLabel="Annulla"
              variant="destructive"
              onConfirm={handleDelete}
              disabled={isPending}
              trigger={
                <Button size="sm" variant="destructive" disabled={isPending}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Elimina
                </Button>
              }
            />
          )}
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 px-6">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                aria-label="Seleziona tutti"
              />
            </TableHead>
            <TableHead className="px-6">Cliente</TableHead>
            <TableHead className="px-6">Contatto</TableHead>
            <TableHead className="px-6">Visite</TableHead>
            <TableHead className="px-6">Ultima Visita</TableHead>
            <TableHead className="px-6">Stato</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((customer) => (
            <TableRow
              key={customer.id}
              className="cursor-pointer"
              onClick={() => router.push(`/clients/${customer.id}`)}
            >
              <TableCell className="px-6" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selected.has(customer.id)}
                  onCheckedChange={() => toggleOne(customer.id)}
                  aria-label="Seleziona"
                />
              </TableCell>
              <TableCell className="px-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-sm sm:text-base">{customer.name}</div>
                    <div className="text-[10px] text-muted-foreground">ID: {customer.id.slice(0, 8)}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-6">
                <span className="text-muted-foreground text-xs sm:text-sm">
                  {formatPhoneNumber(customer.phone_number)}
                </span>
              </TableCell>
              <TableCell className="px-6">
                <div className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-bold text-xs">
                  {customer.total_visits}
                </div>
              </TableCell>
              <TableCell className="px-6">
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>
                    {customer.last_visit
                      ? format(new Date(customer.last_visit), 'dd MMM yyyy', { locale: it })
                      : '-- -- ----'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="px-6">
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1 capitalize text-[10px] sm:text-xs">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  Attivo
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default ClientsTable
