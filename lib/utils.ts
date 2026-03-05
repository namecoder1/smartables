import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isDev() {
  return process.env.NODE_ENV === 'development'
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

export function formatPhoneNumber(phoneNumber: string) {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Check if it looks like an Italian number (starts with 3)
  if (cleaned.startsWith('3') && cleaned.length === 10) {
    // Format: 3xx xxx xxxx
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
  }

  // Check if it looks like an Italian number with country code
  if (cleaned.startsWith('3') && cleaned.length === 11) {
    // Format: +39 xxx xxx xxxx
    return `+39 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 11)}`;
  }

  // Check if it looks like an international number with country code
  if (cleaned.startsWith('3') && cleaned.length > 11) {
    // Format: +CC xxx xxx xxxx
    const countryCode = cleaned.slice(0, 2);
    const numberPart = cleaned.slice(2);
    return `+${countryCode} ${numberPart.slice(0, 3)} ${numberPart.slice(3, 6)} ${numberPart.slice(6, 10)}`;
  }

  // Fallback for other formats
  if (cleaned.length > 10) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
  }

  return phoneNumber; // Return original if format is unknown
}


