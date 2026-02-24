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
      <NewOrderView />
    </PageWrapper>
  )
}

export default NewOrderPage
