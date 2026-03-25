'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Star, Calendar, CheckCircle2, AlertCircle, ExternalLink, Link2Off, Utensils } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveGoogleReviewUrl } from '@/app/actions/settings'
import { saveGoogleCalendar, disconnectGoogleCalendar } from '@/app/actions/google-calendar'
import { saveTheForkCredentials, disconnectTheFork, verifyTheForkConnection } from '@/app/actions/integrations'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import PageWrapper from '@/components/private/page-wrapper'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FaqContent } from '@/components/private/faq-section'
import { SanityFaq } from '@/utils/sanity/queries'
import SupportCard from '@/components/utility/support-card'

interface Props {
  faqs: SanityFaq[]
  locationId: string
  googleReviewUrl?: string | null
  googleCalendarConnected?: boolean
  googleCalendarId?: string | null
  googleCalendarName?: string | null
  theforkConnected?: boolean
  theforkRestaurantId?: string | null
}

const ConnectionsView = ({
  faqs,
  locationId,
  googleReviewUrl: initialReviewUrl,
  googleCalendarConnected: initialCalendarConnected,
  googleCalendarId: initialCalendarId,
  googleCalendarName: initialCalendarName,
  theforkConnected: initialTheForkConnected,
  theforkRestaurantId: initialTheForkRestaurantId,
}: Props) => {
  const [reviewUrl, setReviewUrl] = useState(initialReviewUrl || '')
  const [savingReview, setSavingReview] = useState(false)
  const [activeTab, setActiveTab] = useState('google')

  const [calendarId, setCalendarId] = useState(initialCalendarId ?? null)
  const [calendarName, setCalendarName] = useState(initialCalendarName ?? null)
  const [calendarList, setCalendarList] = useState<{ id: string; summary: string; primary?: boolean }[]>([])
  const [loadingCalendars, setLoadingCalendars] = useState(false)
  const [selectedCalId, setSelectedCalId] = useState(initialCalendarId ?? '')
  const [savingCalendar, setSavingCalendar] = useState(false)
  const [disconnectingCalendar, setDisconnectingCalendar] = useState(false)
  const [calendarConnected, setCalendarConnected] = useState(!!initialCalendarConnected)

  const [theforkConnected, setTheforkConnected] = useState(!!initialTheForkConnected)
  const [theforkRestaurantId, setTheforkRestaurantId] = useState(initialTheForkRestaurantId ?? '')
  const [theforkForm, setTheforkForm] = useState({
    restaurantId: initialTheForkRestaurantId ?? '',
    apiKey: '',
    clientId: '',
    clientSecret: '',
    webhookSecret: '',
  })
  const [savingThefork, setSavingThefork] = useState(false)
  const [verifyingThefork, setVerifyingThefork] = useState(false)
  const [disconnectingThefork, setDisconnectingThefork] = useState(false)

  // Detect OAuth callback from Google
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('gcal_connected') === '1') {
      toast.success('Google Calendar collegato. Seleziona ora il calendario da usare.')
      setCalendarConnected(true)
      fetchCalendarList()
    } else if (params.get('gcal_error')) {
      toast.error('Errore durante la connessione a Google Calendar')
    }
    if (params.get('gcal_connected') || params.get('gcal_error')) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchCalendarList = async () => {
    setLoadingCalendars(true)
    try {
      const res = await fetch(`/api/google/calendar/calendars?locationId=${locationId}`)
      const data = await res.json()
      const list = data.calendars ?? []
      setCalendarList(list)
      if (!selectedCalId) {
        const primary = list.find((c: any) => c.primary)
        setSelectedCalId(primary?.id ?? list[0]?.id ?? '')
      }
    } finally {
      setLoadingCalendars(false)
    }
  }

  const handleSaveReviewUrl = async () => {
    setSavingReview(true)
    try {
      await saveGoogleReviewUrl(locationId, reviewUrl)
      toast.success('URL recensioni salvato')
    } catch {
      toast.error('Errore nel salvataggio')
    } finally {
      setSavingReview(false)
    }
  }

  const handleSaveCalendar = async () => {
    if (!selectedCalId) return
    setSavingCalendar(true)
    try {
      const cal = calendarList.find(c => c.id === selectedCalId)
      await saveGoogleCalendar(locationId, selectedCalId, cal?.summary ?? '')
      setCalendarId(selectedCalId)
      setCalendarName(cal?.summary ?? '')
      toast.success('Calendario salvato')
    } catch {
      toast.error('Errore nel salvataggio del calendario')
    } finally {
      setSavingCalendar(false)
    }
  }

  const handleDisconnectCalendar = async () => {
    setDisconnectingCalendar(true)
    try {
      await disconnectGoogleCalendar(locationId)
      setCalendarConnected(false)
      setCalendarId(null)
      setCalendarName(null)
      setCalendarList([])
      setSelectedCalId('')
      toast.success('Google Calendar scollegato')
    } catch {
      toast.error('Errore durante la disconnessione')
    } finally {
      setDisconnectingCalendar(false)
    }
  }

  const handleSaveTheFork = async () => {
    setSavingThefork(true)
    try {
      const result = await saveTheForkCredentials(locationId, theforkForm)
      if (!result.success) { toast.error(result.error); return }
      setTheforkConnected(true)
      setTheforkRestaurantId(theforkForm.restaurantId)
      toast.success('TheFork salvato. Usa "Verifica connessione" per testare le credenziali.')
    } finally {
      setSavingThefork(false)
    }
  }

  const handleVerifyTheFork = async () => {
    setVerifyingThefork(true)
    try {
      const result = await verifyTheForkConnection(locationId)
      if (!result.success) { toast.error(result.error); return }
      toast.success('Connessione TheFork verificata con successo!')
    } finally {
      setVerifyingThefork(false)
    }
  }

  const handleDisconnectTheFork = async () => {
    setDisconnectingThefork(true)
    try {
      const result = await disconnectTheFork(locationId)
      if (!result.success) { toast.error(result.error); return }
      setTheforkConnected(false)
      setTheforkRestaurantId('')
      setTheforkForm({ restaurantId: '', apiKey: '', clientId: '', clientSecret: '', webhookSecret: '' })
      toast.success('TheFork scollegato')
    } finally {
      setDisconnectingThefork(false)
    }
  }

  return (
    <PageWrapper>
      <div className='flex flex-col gap-1'>
        <h1 className='text-3xl font-black tracking-tight'>Connessioni</h1>
        <p className='text-muted-foreground max-w-2xl'>Collega servizi esterni per arricchire le funzionalità della tua sede.</p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='bg-card text-card-foreground rounded-[32px] border-2 shadow-sm overflow-hidden lg:col-span-2'>
          <div className='px-6 py-5 border-b-2'>
            <h2 className='text-2xl font-bold tracking-tight'>Funzioni disponibili</h2>
          </div>

          <div className='p-6'>
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className='w-full'>
              <TabsList className='max-w-lg mb-4'>
                <TabsTrigger className='flex-1' value='google'>Google</TabsTrigger>
                <TabsTrigger className='flex-1' value='thefork'>TheFork</TabsTrigger>
                <TabsTrigger className='flex-1' value='quandoo'>Quandoo</TabsTrigger>
                <TabsTrigger className='flex-1' value='opentable'>OpenTable</TabsTrigger>
              </TabsList>
              <TabsContent value='google' className='divide-y-2'>
                <div className='flex flex-col sm:flex-row sm:items-start gap-6 pb-8'>
                  <div className='flex items-center gap-3 sm:w-56 shrink-0'>
                    <div className='w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center'>
                      <Star className='w-4 h-4 text-yellow-500' />
                    </div>
                    <div>
                      <p className='text-sm font-semibold'>Google Business</p>
                      <p className='text-xs text-muted-foreground'>Recensioni clienti</p>
                    </div>
                  </div>

                  <div className='flex-1 flex flex-col gap-3'>
                    <div className='flex items-center gap-2'>
                      {reviewUrl ? (
                        <span className='inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full'>
                          <CheckCircle2 className='w-3.5 h-3.5' />
                          Configurato
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full'>
                          <AlertCircle className='w-3.5 h-3.5' />
                          Non configurato
                        </span>
                      )}
                    </div>

                    <div className='space-y-1.5'>
                      <Label className='text-xs font-semibold ml-1'>URL pagina recensioni Google</Label>
                      <div className='flex gap-2'>
                        <Input
                          placeholder='https://g.page/r/PLACE_ID/review'
                          value={reviewUrl}
                          className='h-11 rounded-xl border-2 text-sm flex-1'
                          onChange={e => setReviewUrl(e.target.value)}
                        />
                        {reviewUrl && (
                          <a
                            href={reviewUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='h-11 w-11 shrink-0 rounded-xl border-2 flex items-center justify-center hover:bg-muted transition-colors'
                          >
                            <ExternalLink className='w-4 h-4 text-muted-foreground' />
                          </a>
                        )}
                      </div>
                      <p className='text-[11px] text-muted-foreground ml-1'>
                        Trovalo su Google Maps → la tua attività → &quot;Ottieni link alle recensioni&quot;
                      </p>
                    </div>
                    <div>
                      <Button
                        size='sm'
                        className='rounded-xl h-9 px-5'
                        onClick={handleSaveReviewUrl}
                        disabled={savingReview}
                      >
                        {savingReview && <Loader2 className='w-3.5 h-3.5 mr-1.5 animate-spin' />}
                        Salva
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Google Calendar */}
                <div className='flex flex-col sm:flex-row sm:items-start gap-6 mt-8'>
                  <div className='flex items-center gap-3 sm:w-56 shrink-0'>
                    <div className='w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center'>
                      <Calendar className='w-4 h-4 text-blue-500' />
                    </div>
                    <div>
                      <p className='text-sm font-semibold'>Google Calendar</p>
                      <p className='text-xs text-muted-foreground'>Visualizza eventi</p>
                    </div>
                  </div>

                  <div className='flex-1 flex flex-col gap-3'>
                    <div className='flex items-center gap-2'>
                      {calendarConnected ? (
                        <span className='inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full'>
                          <CheckCircle2 className='w-3.5 h-3.5' />
                          Collegato
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full'>
                          <AlertCircle className='w-3.5 h-3.5' />
                          Non collegato
                        </span>
                      )}
                    </div>

                    {!calendarConnected ? (
                      <div className='flex flex-col gap-2'>
                        <p className='text-sm text-muted-foreground'>
                          Collega il tuo Google Calendar per vedere gli eventi nel calendario prenotazioni.
                        </p>
                        <div>
                          <Button asChild size='sm' variant='outline' className='border-2 rounded-xl h-9'>
                            <a href={`/api/google/calendar/auth?locationId=${locationId}`}>
                              <Calendar className='w-3.5 h-3.5 mr-1.5' />
                              Connetti Google Calendar
                            </a>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className='flex flex-col gap-3'>
                        <div className='flex flex-col gap-1.5'>
                          <Label className='text-xs font-semibold ml-1'>Calendario da visualizzare</Label>
                          {calendarList.length === 0 && !loadingCalendars ? (
                            <Button
                              size='sm'
                              variant='outline'
                              className='border-2 rounded-xl h-9 w-fit'
                              onClick={fetchCalendarList}
                            >
                              Carica calendari
                            </Button>
                          ) : loadingCalendars ? (
                            <div className='flex items-center gap-2 text-sm text-muted-foreground py-1'>
                              <Loader2 className='w-3.5 h-3.5 animate-spin' />
                              Caricamento...
                            </div>
                          ) : (
                            <div className='flex items-center gap-2'>
                              <Select value={selectedCalId} onValueChange={setSelectedCalId}>
                                <SelectTrigger className='h-11 rounded-xl border-2 flex-1 max-w-sm text-sm'>
                                  <SelectValue placeholder='Seleziona calendario' />
                                </SelectTrigger>
                                <SelectContent>
                                  {calendarList.map(cal => (
                                    <SelectItem key={cal.id} value={cal.id}>
                                      {cal.summary}
                                      {cal.primary && <span className='ml-1 text-xs text-muted-foreground'>(principale)</span>}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                size='sm'
                                className='h-11 rounded-xl px-4'
                                onClick={handleSaveCalendar}
                                disabled={savingCalendar || !selectedCalId}
                              >
                                {savingCalendar && <Loader2 className='w-3.5 h-3.5 mr-1.5 animate-spin' />}
                                Salva
                              </Button>
                            </div>
                          )}
                          {calendarId && calendarName && calendarList.length === 0 && (
                            <p className='text-xs text-muted-foreground ml-1'>
                              Calendario attivo: <span className='font-medium text-foreground'>{calendarName}</span>
                            </p>
                          )}
                        </div>
                        <div>
                          <Button
                            size='sm'
                            variant='outline'
                            className='border-2 rounded-xl h-9 text-destructive hover:text-destructive'
                            onClick={handleDisconnectCalendar}
                            disabled={disconnectingCalendar}
                          >
                            {disconnectingCalendar
                              ? <Loader2 className='w-3.5 h-3.5 mr-1.5 animate-spin' />
                              : <Link2Off className='w-3.5 h-3.5 mr-1.5' />
                            }
                            Scollega
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value='thefork'>
                <div className='p-6 flex flex-col sm:flex-row sm:items-start gap-6'>
                  <div className='flex items-center gap-3 sm:w-56 shrink-0'>
                    <div className='w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center'>
                      <Utensils className='w-4 h-4 text-emerald-600' />
                    </div>
                    <div>
                      <p className='text-sm font-semibold'>TheFork</p>
                      <p className='text-xs text-muted-foreground'>Prenotazioni & ospiti</p>
                    </div>
                  </div>

                  <div className='flex-1 flex flex-col gap-3'>
                    <div className='flex items-center gap-2'>
                      {theforkConnected ? (
                        <span className='inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full'>
                          <CheckCircle2 className='w-3.5 h-3.5' />
                          Collegato{theforkRestaurantId ? ` · ID ${theforkRestaurantId}` : ''}
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full'>
                          <AlertCircle className='w-3.5 h-3.5' />
                          Non collegato
                        </span>
                      )}
                    </div>

                    {!theforkConnected ? (
                      <div className='flex flex-col gap-3'>
                        <p className='text-sm text-muted-foreground'>
                          Collega TheFork per importare prenotazioni, arricchire i profili clienti e ricevere notifiche di arrivo in tempo reale.
                        </p>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                          <div className='space-y-1.5'>
                            <Label className='text-xs font-semibold ml-1'>Restaurant ID (CustomerId)</Label>
                            <Input
                              placeholder='es: abc123'
                              value={theforkForm.restaurantId}
                              className='h-10 rounded-xl border-2 text-sm'
                              onChange={e => setTheforkForm(f => ({ ...f, restaurantId: e.target.value }))}
                            />
                          </div>
                          <div className='space-y-1.5'>
                            <Label className='text-xs font-semibold ml-1'>API Key (POS API)</Label>
                            <Input
                              placeholder='X-Api-Key'
                              type='password'
                              value={theforkForm.apiKey}
                              className='h-10 rounded-xl border-2 text-sm'
                              onChange={e => setTheforkForm(f => ({ ...f, apiKey: e.target.value }))}
                            />
                          </div>
                          <div className='space-y-1.5'>
                            <Label className='text-xs font-semibold ml-1'>Client ID (B2B API)</Label>
                            <Input
                              placeholder='OAuth2 client_id'
                              value={theforkForm.clientId}
                              className='h-10 rounded-xl border-2 text-sm'
                              onChange={e => setTheforkForm(f => ({ ...f, clientId: e.target.value }))}
                            />
                          </div>
                          <div className='space-y-1.5'>
                            <Label className='text-xs font-semibold ml-1'>Client Secret (B2B API)</Label>
                            <Input
                              placeholder='OAuth2 client_secret'
                              type='password'
                              value={theforkForm.clientSecret}
                              className='h-10 rounded-xl border-2 text-sm'
                              onChange={e => setTheforkForm(f => ({ ...f, clientSecret: e.target.value }))}
                            />
                          </div>
                          <div className='space-y-1.5 md:col-span-2'>
                            <Label className='text-xs font-semibold ml-1'>Webhook Secret (oauthClientSecret)</Label>
                            <Input
                              placeholder='Segreto per la verifica dei webhook TheFork'
                              type='password'
                              value={theforkForm.webhookSecret}
                              className='h-10 rounded-xl border-2 text-sm'
                              onChange={e => setTheforkForm(f => ({ ...f, webhookSecret: e.target.value }))}
                            />
                            <p className='text-[11px] text-muted-foreground ml-1'>
                              Generalo tu e comunicalo a TheFork durante la registrazione POS. URL webhook: <code className='text-xs bg-muted px-1 rounded'>/api/webhooks/thefork</code>
                            </p>
                          </div>
                        </div>
                        <div>
                          <Button
                            size='sm'
                            className='rounded-xl h-9 px-5'
                            onClick={handleSaveTheFork}
                            disabled={savingThefork || !theforkForm.restaurantId || !theforkForm.apiKey}
                          >
                            {savingThefork && <Loader2 className='w-3.5 h-3.5 mr-1.5 animate-spin' />}
                            Salva credenziali
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className='flex flex-col gap-3'>
                        <p className='text-sm text-muted-foreground'>
                          TheFork è collegato. Le prenotazioni arriveranno automaticamente e i profili clienti verranno arricchiti con i dati degli ospiti.
                        </p>
                        <div className='flex items-center gap-2 flex-wrap'>
                          <Button
                            size='sm'
                            variant='outline'
                            className='border-2 rounded-xl h-9'
                            onClick={handleVerifyTheFork}
                            disabled={verifyingThefork}
                          >
                            {verifyingThefork
                              ? <Loader2 className='w-3.5 h-3.5 mr-1.5 animate-spin' />
                              : <CheckCircle2 className='w-3.5 h-3.5 mr-1.5' />
                            }
                            Verifica connessione
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            className='border-2 rounded-xl h-9 text-destructive hover:text-destructive'
                            onClick={handleDisconnectTheFork}
                            disabled={disconnectingThefork}
                          >
                            {disconnectingThefork
                              ? <Loader2 className='w-3.5 h-3.5 mr-1.5 animate-spin' />
                              : <Link2Off className='w-3.5 h-3.5 mr-1.5' />
                            }
                            Scollega
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value='quandoo'>
                <div className='flex flex-col gap-1 items-center justify-center py-8'>
                  <h3 className='font-semibold text-xl'>Funzionalità in arrivo</h3>
                  <p className='text-muted-foreground'>Sarai notificato non appena questa funzione sara attivatà!</p>
                </div>
              </TabsContent>
              <TabsContent value='opentable'>
                <div className='flex flex-col gap-1 items-center justify-center py-8'>
                  <h3 className='font-semibold text-xl'>Funzionalità in arrivo</h3>
                  <p className='text-muted-foreground'>Sarai notificato non appena questa funzione sara attivatà!</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <div className='flex flex-col gap-6'>
          <FaqContent title='Domande frequenti' faqs={faqs} />
          <SupportCard />
        </div>
      </div>
    </PageWrapper>
  )
}

export default ConnectionsView
