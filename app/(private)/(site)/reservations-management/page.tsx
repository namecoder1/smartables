import PageWrapper from '@/components/private/page-wrapper'
import ReservationsView from './reservations-view'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gestione Sala',
  description: 'Gestione Sala e Ordini',
}

const ReservationsPage = () => {
  return (
    <PageWrapper>
      <div className='items-start flex-col flex'>
        <h1 className='text-3xl font-bold tracking-tight'>Vista Prenotazioni</h1>
        <p className='text-muted-foreground'>Gestisci le prenotazioni in tempo reale.</p>
      </div>
      <ReservationsView />
    </PageWrapper>
  )
}

export default ReservationsPage