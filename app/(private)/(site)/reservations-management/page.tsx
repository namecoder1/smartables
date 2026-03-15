import PageWrapper from '@/components/private/page-wrapper'
import ReservationsView from './reservations-view'
import { Metadata } from 'next'
import { getFaqsByTopic } from '@/utils/sanity/queries'

export const metadata: Metadata = {
  title: 'Gestione Sala',
  description: 'Gestione Sala e Ordini',
}

const ReservationsPage = async () => {
  const [reservationFaqs] = await Promise.all([
    getFaqsByTopic('reservations')
  ])

  return (
    <ReservationsView faqs={reservationFaqs} />
  )
}

export default ReservationsPage