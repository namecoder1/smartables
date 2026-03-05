import PageWrapper from '@/components/private/page-wrapper'
import { Metadata } from 'next'
import React from 'react'
import NewOrderView from './new-order-view'

export const metadata: Metadata = {
  title: 'Nuovo Ordine',
  description: 'Seleziona un tavolo per creare un nuovo ordine',
}

const NewOrderPage = () => {
  return (
    <PageWrapper>
      <div className='items-start flex-col flex'>
        <h1 className='text-3xl font-bold tracking-tight'>Nuovo Ordine</h1>
        <p className='text-muted-foreground'>Seleziona un tavolo per iniziare un nuovo ordine.</p>
      </div>
      <NewOrderView />
    </PageWrapper>
  )
}

export default NewOrderPage
