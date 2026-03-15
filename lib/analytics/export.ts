'use server'

import { requireAuth } from '@/lib/supabase-helpers'
import { queryBookings, queryOrders, queryCustomers, queryWhatsAppMessages } from './queries'

function toCSV(rows: Record<string, unknown>[], headers: string[]): string {
  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }
  const headerRow = headers.join(',')
  const dataRows = rows.map(row => headers.map(h => escape((row as Record<string, unknown>)[h])).join(','))
  return [headerRow, ...dataRows].join('\n')
}

export async function exportBookingsCSV(from?: string, to?: string) {
  const auth = await requireAuth()
  if (!auth.success) return { error: 'Non autorizzato' }

  const fromDate = from ? new Date(from) : undefined
  const toDate = to ? new Date(to) : undefined
  const bookings = await queryBookings(auth.organizationId, fromDate, toDate)

  const headers = ['id', 'booking_time', 'guest_name', 'guest_phone', 'guests_count', 'source', 'status', 'customer_id', 'created_at']
  return { csv: toCSV(bookings as Record<string, unknown>[], headers), filename: 'prenotazioni.csv' }
}

export async function exportCustomersCSV() {
  const auth = await requireAuth()
  if (!auth.success) return { error: 'Non autorizzato' }

  const customers = await queryCustomers(auth.organizationId)
  const headers = ['id', 'name', 'phone_number', 'total_visits', 'last_visit', 'created_at']
  return { csv: toCSV(customers as Record<string, unknown>[], headers), filename: 'clienti.csv' }
}

export async function exportOrdersCSV(from?: string, to?: string) {
  const auth = await requireAuth()
  if (!auth.success) return { error: 'Non autorizzato' }

  const fromDate = from ? new Date(from) : undefined
  const toDate = to ? new Date(to) : undefined
  const orders = await queryOrders(auth.organizationId, fromDate, toDate)

  const headers = ['id', 'created_at', 'total_amount', 'status']
  return { csv: toCSV(orders as Record<string, unknown>[], headers), filename: 'ordini.csv' }
}

export async function exportWhatsAppCSV(from?: string, to?: string) {
  const auth = await requireAuth()
  if (!auth.success) return { error: 'Non autorizzato' }

  const fromDate = from ? new Date(from) : undefined
  const toDate = to ? new Date(to) : undefined
  const messages = await queryWhatsAppMessages(auth.organizationId, fromDate, toDate)

  const headers = ['id', 'direction', 'status', 'cost_implication', 'created_at']
  return { csv: toCSV(messages as Record<string, unknown>[], headers), filename: 'messaggi-whatsapp.csv' }
}
