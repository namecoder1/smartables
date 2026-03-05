import PageWrapper from '@/components/private/page-wrapper'
import ClientsView from './clients-view'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Clienti',
  description: 'Panoramica completa dei tuoi clienti',
}

const ClientsPage = () => {
  return (
    <PageWrapper>
      <div className='items-start flex-col flex'>
        <h3 className="text-3xl font-bold tracking-tight">Clienti</h3>
        <p className="text-muted-foreground">Panoramica completa dei tuoi clienti</p>
      </div>
      <ClientsView />
    </PageWrapper>
  )
}

export default ClientsPage