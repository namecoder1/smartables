"use client"

import React, { useState } from 'react'
import PageWrapper from '@/components/private/page-wrapper'
import CalendarView from './calendar-view'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import ReservationSheet from '@/components/utility/reservation-sheet'

const CalendarPage = () => {
  const [open, setOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <PageWrapper className='relative'>
      <div className="items-center justify-between xl:hidden flex">
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Calendario</h1>
          <p className='text-muted-foreground'>Visualizza le prenotazioni nel calendario.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus />
          Nuova prenotazione
        </Button>
      </div>
      <Button onClick={() => setOpen(true)} className='absolute bottom-6 right-6 z-50'>
        <Plus />
        Nuova prenotazione
      </Button>
      <CalendarView key={refreshKey} />
      <ReservationSheet open={open} onOpenChange={setOpen} onSuccess={handleSuccess} />
    </PageWrapper>
  )
}

export default CalendarPage