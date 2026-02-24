import PageWrapper from '@/components/private/page-wrapper'
import OrdersView from './orders-view'
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'I tuoi ordini',
  description: 'Gestisci, visualizza e avanza i tuoi ordini per questo turno.',
  openGraph: {
    title: 'I tuoi ordini',
    description: 'Gestisci, visualizza e avanza i tuoi ordini per questo turno.',
  }
}

const OrdersManagement = () => {
  return (
    <PageWrapper className='relative'>
      <div className='items-start flex-col xl:hidden flex'>
        <h1 className='text-3xl font-bold tracking-tight'>I tuoi ordini</h1>
        <p className='text-muted-foreground'>Gestisci, visualizza e avanza i tuoi ordini per questo turno.</p>
      </div>
      <OrdersView />
      <Button className='absolute bottom-6 right-6' asChild>
        <Link href={`/orders-management/new`}>
          Nuovo ordine
        </Link>
      </Button>
    </PageWrapper>
  )
}

export default OrdersManagement