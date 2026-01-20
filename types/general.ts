export type Customer = {
  id: string
  name: string
  phone_number: string
  total_visits: number
  last_visit: string
}

export type Booking = {
  id: string
  guest_name: string
  guest_phone: string
  booking_time: string
  notes: string
  source: string
  guests_count: number
  customer_id: string | null
  status: string
  customer?: Customer
}

export type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  resource: Booking
}