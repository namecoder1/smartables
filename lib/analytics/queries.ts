// Server-only — uses createClient() which requires Next.js server context.
// Import only in Server Components, Server Actions, or Route Handlers.

import { createClient } from '@/utils/supabase/server'
import { startOfDay, endOfDay, subYears } from 'date-fns'
import type { RawBooking, RawOrder, RawCustomer, RawWhatsAppMessage } from './types'

/** Hard cap for all data queries — prevents runaway fetches at scale. */
const QUERY_LIMIT = 5000

export async function queryBookings(
  organizationId: string,
  from?: Date,
  to?: Date,
): Promise<RawBooking[]> {
  const supabase = await createClient()
  // Default to 1-year window when no start date provided — avoids loading all-time records.
  const effectiveFrom = from ?? subYears(new Date(), 1)
  let q = supabase
    .from('bookings')
    .select('id, booking_time, created_at, source, status, guests_count, guest_name, guest_phone, customer_id')
    .eq('organization_id', organizationId)
    .gte('booking_time', startOfDay(effectiveFrom).toISOString())
    .order('booking_time', { ascending: false })
    .limit(QUERY_LIMIT)

  if (to) q = q.lte('booking_time', endOfDay(to).toISOString())

  const { data } = await q
  return (data || []) as RawBooking[]
}

/** Returns the exact total count without loading all records. */
export async function queryBookingsTotalCount(organizationId: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
  return count ?? 0
}

export async function queryOrders(
  organizationId: string,
  from?: Date,
  to?: Date,
): Promise<RawOrder[]> {
  const supabase = await createClient()
  const effectiveFrom = from ?? subYears(new Date(), 1)
  let q = supabase
    .from('orders')
    .select('id, created_at, total_amount, status')
    .eq('organization_id', organizationId)
    .gte('created_at', startOfDay(effectiveFrom).toISOString())
    .order('created_at', { ascending: false })
    .limit(QUERY_LIMIT)

  if (to) q = q.lte('created_at', endOfDay(to).toISOString())

  const { data } = await q
  return (data || []) as RawOrder[]
}

export async function queryCustomers(organizationId: string): Promise<RawCustomer[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('customers')
    .select('id, name, phone_number, total_visits, last_visit, created_at, tags')
    .eq('organization_id', organizationId)
    .order('total_visits', { ascending: false })
    .limit(QUERY_LIMIT)
  return (data || []) as RawCustomer[]
}

export async function queryWhatsAppMessages(
  organizationId: string,
  from?: Date,
  to?: Date,
): Promise<RawWhatsAppMessage[]> {
  const supabase = await createClient()
  const effectiveFrom = from ?? subYears(new Date(), 1)
  let q = supabase
    .from('whatsapp_messages')
    .select('id, direction, status, cost_implication, created_at')
    .eq('organization_id', organizationId)
    .gte('created_at', startOfDay(effectiveFrom).toISOString())
    .order('created_at', { ascending: false })
    .limit(QUERY_LIMIT)

  if (to) q = q.lte('created_at', endOfDay(to).toISOString())

  const { data } = await q
  return (data || []) as RawWhatsAppMessage[]
}

export async function queryOrganizationUsage(organizationId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('organizations')
    .select('whatsapp_usage_count, usage_cap_whatsapp, current_billing_cycle_start, stripe_price_id, addons_config')
    .eq('id', organizationId)
    .single()
  return data
}
