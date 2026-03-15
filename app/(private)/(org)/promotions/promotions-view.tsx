'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Percent,
  DollarSign,
  Package,
  UtensilsCrossed,
  ChevronRight,
  Calendar,
  MapPin,
  Globe,
  Trash2,
  Pencil,
  Eye,
  Bell,
  Repeat,
  Zap,
} from 'lucide-react'
import { TbRosetteDiscount } from 'react-icons/tb'
import { MdDiscount } from 'react-icons/md'
import { RiCoupon3Line } from 'react-icons/ri'
import { Promotion, Location, Menu } from '@/types/general'
import PageWrapper from '@/components/private/page-wrapper'
import OverviewCards from '@/components/private/overview-cards'
import DataContainer from '@/components/utility/data-container'
import NoItems from '@/components/utility/no-items'
import { deletePromotion } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import ConfirmDialog from '@/components/utility/confirm-dialog'
import { ButtonGroup } from '@/components/ui/button-group'
import { FaqContent } from '@/components/private/faq-section'
import { SanityFaq } from '@/utils/sanity/queries'

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  percentage: {
    label: 'Percentuale',
    icon: <Percent className="w-3.5 h-3.5" />,
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  fixed_amount: {
    label: 'Importo fisso',
    icon: <DollarSign className="w-3.5 h-3.5" />,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  bundle: {
    label: 'Bundle',
    icon: <Package className="w-3.5 h-3.5" />,
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
  cover_override: {
    label: 'Coperto',
    icon: <UtensilsCrossed className="w-3.5 h-3.5" />,
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
}

const formatValue = (type: string, value: number | null | undefined) => {
  if (value === null || value === undefined) return '—'
  switch (type) {
    case 'percentage':
      return `-${value}%`
    case 'fixed_amount':
      return `-${value}€`
    case 'bundle':
      return `${value}€`
    case 'cover_override':
      return value === 0 ? 'Gratis' : `${value}€`
    default:
      return `${value}`
  }
}

const formatDateRange = (startsAt: string | null, endsAt: string | null) => {
  if (!startsAt && !endsAt) return null
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
  if (startsAt && endsAt) return `${fmt(startsAt)} — ${fmt(endsAt)}`
  if (startsAt) return `Da ${fmt(startsAt)}`
  if (endsAt) return `Fino ${fmt(endsAt)}`
  return null
}

interface PromotionsViewProps {
  promotions: Promotion[]
  locations: Location[]
  menus: Menu[]
  organizationId: string
  faqs: SanityFaq[]
}

const PromotionsView = ({ promotions, locations, menus, organizationId, faqs }: PromotionsViewProps) => {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    try {
      const result = await deletePromotion(id)
      if (!result.success) {
        toast.error("Errore nell'eliminazione della promozione")
      } else {
        toast.success('Promozione eliminata')
        router.refresh()
      }
    } catch {
      toast.error("Errore nell'eliminazione della promozione")
    }
  }

  const activeCount = promotions.filter((p) => p.is_active).length
  const withThreshold = promotions.filter((p) => p.visit_threshold && p.visit_threshold > 0).length

  return (
    <PageWrapper className="relative">
      {/* Header */}
      <div className="flex items-center justify-between gap-10">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Promozioni</h2>
          <p className="text-muted-foreground max-w-3xl">
            Crea e gestisci le promozioni per i tuoi menu e le tue sedi.
          </p>
        </div>
        <ButtonGroup>
          <FaqContent
            variant='minimized'
            title='Aiuto'
            faqs={faqs}          
          />
          <Button
            onClick={() => router.push('/promotions/new')}
          >
            <Plus className="w-4 h-4" /> Aggiungi
          </Button>
        </ButtonGroup>
      </div>

      {/* Overview Cards */}
      <OverviewCards
        data={[
          {
            title: 'Totale promozioni',
            value: promotions.length,
            description: 'promozioni',
            icon: <TbRosetteDiscount className="text-primary size-6 2xl:size-8" />,
          },
          {
            title: 'Promozioni attive',
            value: activeCount,
            description: 'attive',
            icon: <MdDiscount className="text-primary size-6 2xl:size-8" />,
          },
          {
            title: 'Con soglia visite',
            value: withThreshold,
            description: 'fidelizzazione',
            icon: <RiCoupon3Line className="text-primary size-6 2xl:size-8" />,
          },
        ]}
      />

      {/* Promotions Grid */}
      {promotions.length === 0 ? (
        <NoItems
          icon={<TbRosetteDiscount size={28} />}
          title="Non hai ancora creato una promozione"
          description="Crea la tua prima promozione per attrarre clienti. Puoi scontare piatti, menu interi, il coperto e molto altro."
          button={
            <Button onClick={() => router.push('/promotions/new')}>
              Crea Promozione
            </Button>
          }
        />
      ) : (
        <DataContainer>
          {promotions.map((promo) => (
            <PromotionCard
              key={promo.id}
              promotion={promo}
              locations={locations}
              menus={menus}
              onDelete={handleDelete}
            />
          ))}
        </DataContainer>
      )}
    </PageWrapper>
  )
}

// --- Promotion Card ---

const PromotionCard = ({
  promotion,
  locations,
  menus,
  onDelete,
}: {
  promotion: Promotion
  locations: Location[]
  menus: Menu[]
  onDelete: (id: string) => void
}) => {
  const typeConfig = TYPE_CONFIG[promotion.type] || TYPE_CONFIG.percentage
  const dateRange = formatDateRange(promotion.starts_at, promotion.ends_at)

  // Scope labels
  const locationScope = promotion.all_locations
    ? 'Tutte le sedi'
    : promotion.target_location_ids && promotion.target_location_ids.length > 0
      ? `${promotion.target_location_ids.length} ${promotion.target_location_ids.length === 1 ? 'sede' : 'sedi'}`
      : 'Nessuna sede'

  const menuScope = promotion.all_menus
    ? 'Tutti i menù'
    : promotion.target_menu_ids && promotion.target_menu_ids.length > 0
      ? `${promotion.target_menu_ids.length} ${promotion.target_menu_ids.length === 1 ? 'menù' : 'menù'}`
      : 'Nessun menù'

  return (
    <Card className="flex flex-col relative group transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="outline"
                className={`${typeConfig.color} text-xs px-2 py-0.5 rounded-lg font-medium`}
              >
                {typeConfig.icon}
                {typeConfig.label}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs px-2 py-0.5 rounded-lg text-white ${promotion.is_active ? 'bg-emerald-500 border-emerald-500' : 'bg-zinc-400 border-zinc-400'}`}
              >
                {promotion.is_active ? 'Attiva' : 'Inattiva'}
              </Badge>
            </div>
            <CardTitle className="text-lg font-bold tracking-tight truncate">
              {promotion.name}
            </CardTitle>
            {promotion.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {promotion.description}
              </p>
            )}
          </div>
          <div className="text-right ml-3 shrink-0">
            <span className="text-2xl font-bold tracking-tight text-primary">
              {formatValue(promotion.type, promotion.value)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-2 text-sm flex-1">
        {/* Scope info */}
        <div className="flex items-center gap-4 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            {locationScope}
          </span>
          <span className="flex items-center gap-1.5">
            <TbRosetteDiscount className="w-3.5 h-3.5 text-primary" />
            {menuScope}
          </span>
        </div>

        {/* Date / Schedule */}
        {dateRange && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            {dateRange}
          </div>
        )}

        {/* Visit threshold */}
        {promotion.visit_threshold && promotion.visit_threshold > 0 && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Repeat className="w-3.5 h-3.5 text-primary" />
            Ogni {promotion.visit_threshold} visite
          </div>
        )}

        {/* Notification */}
        {promotion.notify_via_whatsapp && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Bell className="w-3.5 h-3.5 text-primary" />
            Notifica WhatsApp
          </div>
        )}

        {/* Items count - removed since promotion_items is deprecated */}
      </CardContent>

      {/* Actions */}
      <div className="px-6 pt-0 flex items-center gap-2 ml-auto mt-auto">
        <Button className="w-fit" variant="outline" asChild>
          <a href={`/promotions/${promotion.id}`}>
            Apri
            <ChevronRight className="w-3 h-3" />
          </a>
        </Button>

        <ConfirmDialog
          trigger={
            <Button variant="destructive" size="icon">
              <Trash2 className="w-4 h-4" />
            </Button>
          }
          title="Eliminare questa promozione?"
          description={`Stai per eliminare "${promotion.name}". Questa azione è irreversibile.`}
          confirmLabel="Elimina"
          cancelLabel="Annulla"
          variant="destructive"
          onConfirm={() => onDelete(promotion.id)}
        />
      </div>
    </Card>
  )
}

export default PromotionsView
