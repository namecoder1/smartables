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
      <div className='items-center justify-between flex'>
        <div className='items-start flex-col flex'>
          <h1 className='text-3xl font-bold tracking-tight'>I tuoi ordini</h1>
          <p className='text-muted-foreground'>Gestisci, visualizza e avanza i tuoi ordini per questo turno.</p>
        </div>
        <Button asChild className="w-fit hidden xl:flex">
          <Link href="/orders/new">
            Nuovo
          </Link>
        </Button>
      </div>
      <OrdersView />
      <Button asChild className="absolute bottom-6 right-6 xl:hidden">
        <Link href="/orders/new">
          Nuovo
        </Link>
      </Button>
    </PageWrapper>
  )
}

export default OrdersManagement