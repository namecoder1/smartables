import PageWrapper from '@/components/private/page-wrapper'
import { Metadata } from 'next'
import AreaView from './area-view'

export const metadata: Metadata = {
  title: 'Gestione aree',
  description: 'Gestisci ordini e prenotazioni con le mappe interattive che hai creato.',
}

const AreaManagement = () => {
  return (
    <PageWrapper>
      <div className='items-start flex-col flex'>
        <h1 className='text-3xl font-bold tracking-tight'>Mappa prenotazioni</h1>
        <p className='text-muted-foreground'>Visualizza e gestisci le prenotazioni in tempo reale.</p>
      </div>
      <AreaView />
    </PageWrapper>
  )
}

export default AreaManagement