/**
 * Canonical add-on catalogue — single source of truth for all addon metadata.
 * Import ADDON_CATALOG and ADDON_COLOR_MAP from here instead of redefining
 * them in individual components (limits-view, addons-section, home-view, etc.)
 */

import { Users, MessageCircle, HardDrive, MapPin, BrainCircuit, BarChart3 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AddonConfig } from '@/types/general'

export type AddonCatalogEntry = {
  readonly key: keyof AddonConfig
  readonly name: string
  /** Full description shown in purchase dialogs and addon lists */
  readonly description: string
  /** Compact unit label shown in home-view and short displays */
  readonly unitLabel: string
  readonly icon: LucideIcon
  readonly color: string
  readonly priceMonth: number
  /** env-var key used to look up the Stripe price ID */
  readonly priceIdEnv: string
  /** When true the addon is only available for the Starter plan (included in Growth+) */
  readonly starterOnly: boolean
}

export const ADDON_CATALOG: readonly AddonCatalogEntry[] = [
  {
    key: 'extra_staff',
    name: 'Staff Power Pack',
    description: '+5 account staff per pack',
    unitLabel: 'account staff',
    icon: Users,
    color: 'blue',
    priceMonth: 8.99,
    priceIdEnv: 'STRIPE_PRICE_ADDON_STAFF',
    starterOnly: false,
  },
  {
    key: 'extra_contacts_wa',
    name: 'Smart Contact Boost',
    description: '+200 contatti WhatsApp/mese per pack',
    unitLabel: 'contatti WA/mese',
    icon: MessageCircle,
    color: 'green',
    priceMonth: 14.99,
    priceIdEnv: 'STRIPE_PRICE_ADDON_CONTACTS_WA',
    starterOnly: false,
  },
  {
    key: 'extra_storage_mb',
    name: 'Media Storage Plus',
    description: '+500 MB storage per pack',
    unitLabel: 'MB storage',
    icon: HardDrive,
    color: 'orange',
    priceMonth: 4.99,
    priceIdEnv: 'STRIPE_PRICE_ADDON_STORAGE',
    starterOnly: false,
  },
  {
    key: 'extra_locations',
    name: 'Sede Extra',
    description: '+1 sede aggiuntiva per pack',
    unitLabel: 'sede',
    icon: MapPin,
    color: 'purple',
    priceMonth: 18.99,
    priceIdEnv: 'STRIPE_PRICE_ADDON_LOCATION',
    starterOnly: false,
  },
  {
    key: 'extra_kb_chars',
    name: 'AI Knowledge Base',
    description: '+5.000 caratteri memoria AI per pack',
    unitLabel: 'caratteri memoria',
    icon: BrainCircuit,
    color: 'violet',
    priceMonth: 9.99,
    priceIdEnv: 'STRIPE_PRICE_ADDON_KB',
    starterOnly: false,
  },
  {
    key: 'extra_analytics',
    name: 'Analytics Pro',
    description: 'Confronto periodi, orari di punta e analitiche WhatsApp avanzate',
    unitLabel: 'analitiche avanzate',
    icon: BarChart3,
    color: 'indigo',
    priceMonth: 19.99,
    priceIdEnv: 'STRIPE_PRICE_ADDON_ANALYTICS',
    starterOnly: true,
  },
]

export const ADDON_COLOR_MAP: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700' },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
}
