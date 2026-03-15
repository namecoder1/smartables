import { Percent, DollarSign, Package, UtensilsCrossed } from 'lucide-react'
import type { ReactNode } from 'react'
import type {
  PromotionType,
  PromotionItemTargetType,
  PromotionItemRole,
  Location,
  Menu,
  Promotion,
} from '@/types/general'

export type { PromotionType, PromotionItemTargetType, PromotionItemRole }

export interface PromotionEditViewProps {
  promotion: Promotion | null
  locations: Location[]
  menus: Menu[]
  organizationId: string
  isNew: boolean
}

export type EditableItem = {
  _key: string
  target_type: PromotionItemTargetType
  target_ref: string | null
  role: PromotionItemRole
  override_value: number | null
  override_type: string | null
}

export const PROMO_TYPES: {
  value: PromotionType
  label: string
  icon: ReactNode
  example: string
}[] = [
  {
    value: 'percentage',
    label: 'Percentuale',
    icon: <Percent className="w-5 h-5" />,
    example: 'Es: -20% su tutti i primi piatti',
  },
  {
    value: 'fixed_amount',
    label: 'Importo fisso',
    icon: <DollarSign className="w-5 h-5" />,
    example: 'Es: -5€ sulla pizza',
  },
  {
    value: 'bundle',
    label: 'Bundle / Combo',
    icon: <Package className="w-5 h-5" />,
    example: 'Es: Primo + secondo + dolce a 25€',
  },
  {
    value: 'cover_override',
    label: 'Coperto',
    icon: <UtensilsCrossed className="w-5 h-5" />,
    example: 'Es: Coperto gratuito o a prezzo ridotto',
  },
]

export const VALUE_LABELS: Record<
  PromotionType,
  { label: string; placeholder: string; hint: string }
> = {
  percentage: {
    label: 'Percentuale di sconto',
    placeholder: '10',
    hint: 'Inserisci solo il numero. Es: 10 = sconto del 10%.',
  },
  fixed_amount: {
    label: 'Importo sconto (€)',
    placeholder: '5',
    hint: 'Importo in euro che verrà sottratto dal prezzo. Es: 5 = -5€.',
  },
  bundle: {
    label: 'Prezzo fisso del bundle (€)',
    placeholder: '25',
    hint: 'Il prezzo totale del pacchetto promozionale. I clienti pagheranno questa cifra per tutti gli elementi inclusi.',
  },
  cover_override: {
    label: 'Nuovo prezzo coperto (€)',
    placeholder: '0',
    hint: 'Imposta a 0 per coperto gratuito, oppure il nuovo prezzo del coperto durante la promozione.',
  },
}

export const TARGET_TYPES: {
  value: PromotionItemTargetType
  label: string
  hint: string
}[] = [
  {
    value: 'menu_item',
    label: 'Piatto singolo',
    hint: 'Un piatto specifico dal menù',
  },
  {
    value: 'category',
    label: 'Categoria',
    hint: 'Tutti i piatti di una categoria (es: Primi, Dolci)',
  },
  {
    value: 'full_menu',
    label: 'Menu intero',
    hint: 'Lo sconto si applica a tutto il menù',
  },
  {
    value: 'cover',
    label: 'Coperto',
    hint: 'Modifica il prezzo del coperto',
  },
]
