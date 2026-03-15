'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronRight,
  MapPin,
  Edit,
  Map,
  PlusCircle,
  CalendarDays,
  Trash,
} from 'lucide-react'
import GroupedActions from '@/components/utility/grouped-actions'
import { Menu } from '@/types/general'
import Link from 'next/link'
import { BiFoodMenu } from 'react-icons/bi'
import { FaRegFilePdf } from 'react-icons/fa6'

interface MenuCardProps {
  menu: Menu
  openManageLocations: (menu: Menu) => void
  openEditMenu: (menu: Menu) => void
  handleDelete: (menuId: string) => void
}

export const MenuCard = ({
  menu,
  openManageLocations,
  openEditMenu,
  handleDelete,
}: MenuCardProps) => {
  const categories = Array.isArray(menu.content) ? menu.content : []
  const totalItems = categories.reduce(
    (acc: number, cat: Record<string, unknown>) =>
      acc + ((cat.items as unknown[])?.length || 0),
    0,
  )
  const isSpecial = !!(menu.starts_at || menu.ends_at)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
    })

  return (
    <Card key={menu.id} className="flex flex-col relative group">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="flex items-center gap-2 text-base font-bold truncate">
                {menu.pdf_url ? (
                  <FaRegFilePdf className="text-primary" size={24} />
                ) : (
                  <BiFoodMenu className="text-primary" size={24} />
                )}
                {menu.name}
              </CardTitle>
              {isSpecial && (
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] px-1.5 py-0 h-4"
                >
                  Speciale
                </Badge>
              )}
            </div>
            <CardDescription className="line-clamp-2 text-sm">
              {menu.description || 'Nessuna descrizione'}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={`text-white px-2 py-0.5 rounded-xl border-none ${menu.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}
          >
            {menu.is_active ? 'Attivo' : 'Inattivo'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3 pt-0 flex-1">
        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5">
              <Map className="text-primary" size={20} />
              {categories.length}{' '}
              {categories.length === 1 ? 'Categoria' : 'Categorie'}
            </span>
            <span className="flex items-center gap-1.5">
              <PlusCircle className="text-primary" size={20} />
              {totalItems} {totalItems === 1 ? 'Piatto' : 'Piatti'}
            </span>
          </div>

          {isSpecial && (
            <div className="flex flex-col gap-1.5 border-l pl-4">
              <span className="flex items-center gap-1.5 text-amber-700 font-medium uppercase tracking-wider">
                <CalendarDays size={20} />
                Periodo
              </span>
              <span className="leading-none">
                {menu.starts_at && formatDate(menu.starts_at)}
                {menu.starts_at && menu.ends_at && ' — '}
                {menu.ends_at && formatDate(menu.ends_at)}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-6 pt-0 flex items-center justify-between mt-auto">
        <Button variant="outline" asChild>
          <Link href={`/menus-management/${menu.id}`}>
            Apri
            <ChevronRight className="w-3 h-3" />
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={() => openEditMenu(menu)}>
            <Edit className="w-4 h-4" />
          </Button>

          <GroupedActions
            side="top"
            items={[
              {
                label: 'Disponibilità',
                icon: <MapPin className="w-4 h-4" />,
                action: () => openManageLocations(menu),
              },
              {
                label: 'Elimina',
                icon: <Trash className="w-4 h-4 group-hover:text-red-500!" />,
                variant: 'destructive',
                action: () => handleDelete(menu.id),
              },
            ]}
          />
        </div>
      </CardFooter>
    </Card>
  )
}
