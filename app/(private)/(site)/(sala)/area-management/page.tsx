import PageWrapper from '@/components/private/page-wrapper'
import { Metadata } from 'next'
import React from 'react'
import AreaView from './area-view'

export const metadata: Metadata = {
  title: 'Gestione aree',
  description: 'Gestisci ordini e prenotazioni con le mappe interattive che hai creato.',
}

const AreaManagement = () => {
  return (
    <PageWrapper>
      <AreaView />
    </PageWrapper>
  )
}

export default AreaManagement