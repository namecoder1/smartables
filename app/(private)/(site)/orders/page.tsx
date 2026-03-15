import PageWrapper from '@/components/private/page-wrapper'
import OrdersView from './orders-view'
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getFaqsByTopic } from '@/utils/sanity/queries'
import { FaqContent } from '@/components/private/faq-section'
import { ButtonGroup } from '@/components/ui/button-group'
import { Plus, PlusCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'I tuoi ordini',
  description: 'Gestisci, visualizza e avanza i tuoi ordini per questo turno.',
  openGraph: {
    title: 'I tuoi ordini',
    description: 'Gestisci, visualizza e avanza i tuoi ordini per questo turno.',
  }
}

const OrdersManagement = async () => {
  const [orderFaqs] = await Promise.all([
    getFaqsByTopic('orders')
  ])

  return (
    <PageWrapper className='relative'>
      <div className='flex flex-col items-start md:flex-row md:items-center gap-6 md:justify-between'>
        <div className='items-start flex-col flex gap-1'>
          <h1 className='text-3xl font-bold tracking-tight'>I tuoi ordini</h1>
          <p className='text-muted-foreground'>Gestisci, visualizza e avanza i tuoi ordini per questo turno.</p>
        </div>
        <ButtonGroup>
          <FaqContent variant='minimized' title='Aiuto' faqs={orderFaqs} />
          <Button asChild>
            <Link href="/orders/new">
              <Plus />
              Aggiungi
            </Link>
          </Button>
        </ButtonGroup>
      </div>
      <OrdersView />
    </PageWrapper>
  )
}

export default OrdersManagement