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
      <div className='xl:hidden mb-4'>
        <h1 className='text-3xl font-bold tracking-tight'>Gestione Sala</h1>
        <p className='text-muted-foreground'>Gestisci tavoli, prenotazioni e ordini in tempo reale.</p>
      </div>
      <ReservationsView />
    </PageWrapper>
  )
}

export default ReservationsPage