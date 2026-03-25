"use client"

import React, { useState } from 'react'
import PageWrapper from '@/components/private/page-wrapper'
import CalendarView from './calendar-view'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import ReservationSheet from '@/components/utility/reservation-sheet'
import GoogleCalendarConnect from '@/components/private/google-calendar-connect'
import { ButtonGroup } from '@/components/ui/button-group'

const CalendarPage = () => {
  const [open, setOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [gcalId, setGcalId] = useState<string | null>(null)
  const [gcalName, setGcalName] = useState<string | null>(null)

  const handleSuccess = () => setRefreshKey(prev => prev + 1)

  return (
    <PageWrapper className='relative'>
      <div className="items-center justify-between flex gap-2">
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Calendario prenotazioni</h1>
          <p className='text-muted-foreground'>Visualizza le prenotazioni nel calendario.</p>
        </div>
        <ButtonGroup>
          <GoogleCalendarConnect onCalendarChange={(id, name) => { setGcalId(id); setGcalName(name) }} />
          <Button onClick={() => setOpen(true)}>
            <Plus />
            Aggiungi
          </Button>
        </ButtonGroup>
      </div>
      <CalendarView key={refreshKey} googleCalendarId={gcalId} googleCalendarName={gcalName} />
      <ReservationSheet open={open} onOpenChange={setOpen} onSuccess={handleSuccess} />
    </PageWrapper>
  )
}

export default CalendarPage
