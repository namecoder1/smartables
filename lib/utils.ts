import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'confirmed': return 'default' // or specific green variant if available
    case 'cancelled': return 'destructive'
    case 'pending': return 'secondary'
    case 'arrived': return 'outline'
    default: return 'secondary'
  }
}

export function mapStatusLabel(status: string) {
  switch (status) {
    case 'confirmed': return 'Confermato'
    case 'cancelled': return 'Cancellato'
    case 'pending': return 'In Attesa'
    case 'arrived': return 'Arrivato'
    case 'noshow': return 'Non Arrivato'
    default: return status
  }
}