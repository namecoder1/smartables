"use client"

import { Customer } from '@/types/general'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { CircleQuestionMark, User, Phone, Calendar, Star } from 'lucide-react'
import NoItems from '../utility/no-items'
import { useRouter } from 'next/navigation'
import { Badge } from '../ui/badge'

const ClientsTable = ({
  data,
}: {
  data: Customer[] | null,
}) => {
  const router = useRouter()

  if (!data || data.length === 0) {
    return (
      <NoItems
        icon={<CircleQuestionMark className="w-10 h-10 text-foreground" />}
        title="Nessun cliente"
        description="Non ci sono clienti registrati per questa location."
      />
    )
  }

  return (
    <div className="w-full">
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b-2">
            <tr className="border-b-2 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground">
                Cliente
              </th>
              <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground">
                Contatti
              </th>
              <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground">
                Visite
              </th>
              <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground">
                Ultima Visita
              </th>
              <th className="h-12 px-6 text-left align-middle font-medium text-muted-foreground">
                Stato
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-b-0">
            {data.map((customer) => (
              <tr
                key={customer.id}
                className="border-b-2 transition-colors hover:bg-muted/50 cursor-pointer"
                onClick={() => router.push(`/clients/${customer.id}`)}
              >
                <td className="p-3 px-6 align-middle">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold text-sm sm:text-base">{customer.name}</div>
                      <div className="text-[10px] text-muted-foreground">ID: {customer.id.slice(0, 8)}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 px-6 align-middle">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{customer.phone_number}</span>
                  </div>
                </td>
                <td className="p-3 px-6 align-middle">
                  <div className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-bold text-xs">
                    {customer.total_visits}
                  </div>
                </td>
                <td className="p-3 px-6 align-middle">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>
                      {customer.last_visit
                        ? format(new Date(customer.last_visit), 'dd MMM yyyy', { locale: it })
                        : 'Mai visitato'}
                    </span>
                  </div>
                </td>
                <td className="p-3 px-6 align-middle">
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1 capitalize text-[10px] sm:text-xs">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    Attivo
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ClientsTable
