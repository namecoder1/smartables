import PageWrapper from '@/components/private/page-wrapper'
import Reservations from './reservations'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prenotazioni',
  description: 'Prenotazioni',
}

const ReservationsPage = () => {
  return (
    <PageWrapper>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Prenotazioni</h1>
        <p className='text-muted-foreground'>Gestisci, visualizza e modifica le prenotazioni per i tuoi tavoli</p>
      </div>
      <Reservations />  
    </PageWrapper>
  )
}

export default ReservationsPage