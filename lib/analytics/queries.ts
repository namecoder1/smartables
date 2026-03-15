// Server-only — uses createClient() which requires Next.js server context.
// Import only in Server Components, Server Actions, or Route Handlers.

import { createClient } from '@/utils/supabase/server'
import { startOfDay, endOfDay } from 'date-fns'
import type { RawBooking, RawOrder, RawCustomer, RawWhatsAppMessage } from './types'

export async function queryBookings(
  organizationId: string,
  from?: Date,
  to?: Date,
): Promise<RawBooking[]> {
  const supabase = await createClient()
  let q = supabase
    .from('bookings')
    .select('id, booking_time, created_at, source, status, guests_count, guest_name, guest_phone, customer_id')
    .eq('organization_id', organizationId)
    .order('booking_time', { ascending: false })
    .limit(10000)

  if (from) q = q.gte('booking_time', startOfDay(from).toISOString())
  if (to) q = q.lte('booking_time', endOfDay(to).toISOString())

  const { data } = await q
  return (data || []) as RawBooking[]
}

export async function queryOrders(
  organizationId: string,
  from?: Date,
  to?: Date,
): Promise<RawOrder[]> {
  const supabase = await createClient()
  let q = supabase
    .from('orders')
    .select('id, created_at, total_amount, status')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(10000)

  if (from) q = q.gte('created_at', startOfDay(from).toISOString())
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
    .limit(10000)
  return (data || []) as RawCustomer[]
}

export async function queryWhatsAppMessages(
  organizationId: string,
  from?: Date,
  to?: Date,
): Promise<RawWhatsAppMessage[]> {
  const supabase = await createClient()
  let q = supabase
    .from('whatsapp_messages')
    .select('id, direction, status, cost_implication, created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(10000)

  if (from) q = q.gte('created_at', startOfDay(from).toISOString())
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
