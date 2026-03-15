'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Store, Loader2, CalendarOff, Star, Calendar, CheckCircle2, AlertCircle, ExternalLink, CalendarClock, Info, Workflow } from 'lucide-react'
import { LocationBranding as Branding, Location } from '@/types/general'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateLocation, saveGoogleReviewUrl } from '@/app/actions/settings'
import { trackStorageUpload } from '@/app/actions/storage'
import ColorPicker from '@/components/ui/color-picker'
import { toast } from 'sonner'
import { PhoneInput } from '@/components/ui/phone-input'
import { ImageUpload } from '@/components/private/image-upload'
import { createClient } from '@/utils/supabase/client'
import { FaInstagram, FaFacebook, FaTiktok, FaGoogle } from 'react-icons/fa'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { WeeklyHoursSelector } from '@/components/utility/weekly-hours-selector'
import { NumberInput } from '@/components/ui/number-input'
import SupportCard from '@/components/utility/support-card'
import { FaqContent } from '@/components/private/faq-section'
import { SanityFaq } from '@/utils/sanity/queries'
import { SpecialClosuresPanel } from './special-closures-panel'

const SettingsView = ({ locations, faqs, googleReviewUrl }: { locations: any[], faqs: SanityFaq[], googleReviewUrl?: string | null }) => {
  const location = locations && locations.length > 0 ? locations[0] : undefined
  const [formData, setFormData] = useState<Partial<Location>>({})
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [reviewUrl, setReviewUrl] = useState(googleReviewUrl || '')

  const [branding, setBranding] = useState<Branding>({
    colors: { primary: '#000000', secondary: '#ffffff', accent: '#3b82f6' },
    logo_url: '',
    social_links: { instagram: '', facebook: '', tiktok: '' }
  })

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        address: location.address,
        phone_number: location.phone_number,
        seats: location.seats,
        max_covers_per_shift: location.max_covers_per_shift,
        standard_reservation_duration: location.standard_reservation_duration,
        opening_hours: location.opening_hours,
      })
      if (location.branding) {
        setBranding({
          colors: {
            primary: location.branding.colors?.primary || '#000000',
            secondary: location.branding.colors?.secondary || '#ffffff',
            accent: location.branding.colors?.accent || '#3b82f6'
          },
          logo_url: location.branding.logo_url || '',
          social_links: {
            instagram: location.branding.social_links?.instagram || '',
            facebook: location.branding.social_links?.facebook || '',
            tiktok: location.branding.social_links?.tiktok || ''
          }
        })
      }
    }
  }, [location])

  const handleSave = async () => {
    if (!location) return
    setIsLoading(true)
    try {
      let finalLogoUrl = branding.logo_url

      if (logoFile) {
        const supabase = createClient()
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${location.id}-${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('location-logo')
          .upload(filePath, logoFile, {
            upsert: true
          })

        if (uploadError) {
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from('location-logo')
          .getPublicUrl(filePath)

        finalLogoUrl = publicUrl
        await trackStorageUpload(logoFile.size)
      }

      await updateLocation(location.id, {
        ...formData,
        branding: {
          ...branding,
          logo_url: finalLogoUrl
        }
      })

      setBranding(prev => ({ ...prev, logo_url: finalLogoUrl }))
      setLogoFile(null)

      await saveGoogleReviewUrl(location.id, reviewUrl)

      toast.success('Impostazioni salvate con successo')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Errore nel salvataggio delle impostazioni')
    } finally {
      setIsLoading(false)
    }
  }

  if (!location) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-muted/30">
        <Store className="w-10 h-10 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Nessuna sede trovata</h3>
        <p className="text-sm text-muted-foreground text-center">Crea prima una sede nella sezione "Gestisci le attività".</p>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-8'>
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Main Form Section */}
        <div className='lg:col-span-2 flex flex-col gap-6'>
          <div className='bg-card text-card-foreground rounded-[32px] border-2 shadow-sm overflow-hidden'>
            <div className='px-6 py-5 border-b-2'>
              <h2 className='text-2xl font-bold tracking-tight'>Dati della Sede</h2>
            </div>

            <div className='p-6'>
              <Tabs defaultValue='info' className="w-full">
                <TabsList className='max-w-lg'>
                  <TabsTrigger value='info' className='flex-1'>
                    Informazioni
                  </TabsTrigger>
                  <TabsTrigger value='hours' className='flex-1'>
                    Orari
                  </TabsTrigger>
                  <TabsTrigger value='closures' className='flex-1'>
                    Chiusure
                  </TabsTrigger>
                  <TabsTrigger value='connections' className='flex-1'>
                    Connessioni
                  </TabsTrigger>
                </TabsList>

                <TabsContent value='info' className='mt-0 space-y-6'>
                  {/* Basic Info Grid */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold ml-1">Nome attività</Label>
                      <Input
                        id="name"
                        value={formData.name || ''}
                        placeholder="es: Pizzeria La Spianata"
                        className="h-12 rounded-2xl border-2 focus-visible:ring-primary/20"
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-semibold ml-1">Indirizzo</Label>
                      <Input
                        id="address"
                        placeholder='es: Via Roma 1, Roma'
                        value={formData.address || ''}
                        className="h-12 rounded-2xl border-2 focus-visible:ring-primary/20"
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-semibold ml-1">Numero di telefono</Label>
                      <PhoneInput
                        id="phone"
                        context='default'
                        defaultCountry='IT'
                        value={formData.phone_number || ''}
                        className="rounded-2xl border-2 h-12"
                        onChange={(e) => setFormData({ ...formData, phone_number: e })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seats" className="text-sm font-semibold ml-1">Coperti totali</Label>
                      <NumberInput
                        value={Number(formData.seats) || 0}
                        onValueChange={(e) => setFormData({ ...formData, seats: Number(e) })}
                        placeholder='es: 50'
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_covers" className="text-sm font-semibold ml-1">Max coperti per turno</Label>
                      <NumberInput
                        id="max_covers"
                        type="number"
                        placeholder='es: 100'
                        value={Number(formData.max_covers_per_shift) || 0}
                        className="h-12"
                        onValueChange={(e) => setFormData({ ...formData, max_covers_per_shift: Number(e) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-sm font-semibold ml-1">Durata standard (min)</Label>
                      <NumberInput
                        id="duration"
                        type="number"
                        placeholder='es: 90'
                        value={Number(formData.standard_reservation_duration) || 0}
                        className="h-12"
                        onValueChange={(e) => setFormData({ ...formData, standard_reservation_duration: Number(e) })}
                      />
                    </div>
                  </div>

                  <div className='h-0.5 bg-border' />

                  {/* Branding & Social Sections */}
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-10'>
                    {/* Visual Identity */}
                    <div className='space-y-6'>
                      <div>
                        <h4 className='text-lg font-bold tracking-tight'>Identità Visiva</h4>
                        <p className='text-muted-foreground text-xs'>Personalizza i colori e il logo del tuo locale.</p>
                      </div>

                      <div className='space-y-4'>
                        <div className='flex items-center justify-between rounded-3xl border-2 bg-muted/5'>
                          <div className='flex items-center justify-between w-full gap-3'>
                            <ColorPicker
                              shape="square"
                              color={branding.colors.primary}
                              onChange={(color) => setBranding({ ...branding, colors: { ...branding.colors, primary: color } })}
                            />
                            <div className='ml-auto mr-4'>
                              <span className='text-sm'>Colore Primario</span>
                            </div>
                          </div>
                        </div>

                        <div className='flex items-center justify-between rounded-3xl border-2 bg-muted/5'>
                          <div className='flex items-center justify-between w-full gap-3'>
                            <ColorPicker
                              shape="square"
                              color={branding.colors.accent}
                              onChange={(color) => setBranding({ ...branding, colors: { ...branding.colors, accent: color } })}
                            />
                            <div className='ml-auto mr-4'>
                              <span className='text-sm'>Colore Accento</span>
                            </div>
                          </div>
                        </div>


                        <div className='flex items-center justify-between rounded-3xl border-2 bg-muted/5'>
                          <div className='flex items-center justify-between w-full gap-3'>
                            <ColorPicker
                              shape="square"
                              color={branding.colors.secondary}
                              onChange={(color) => setBranding({ ...branding, colors: { ...branding.colors, secondary: color } })}
                            />
                            <div className='ml-auto mr-4'>
                              <span className='text-sm'>Colore Secondario</span>
                            </div>
                          </div>
                        </div>

                        <div className='pt-2'>
                          <div className='flex flex-col items-center gap-4'>
                            <ImageUpload
                              value={branding.logo_url}
                              aspect="square"
                              title='Logo Attività'
                              onChange={(url, file) => {
                                if (file) setLogoFile(file)
                                setBranding(prev => ({ ...prev, logo_url: url || '' }))
                              }}
                            />
                            <p className="text-[10px] text-muted-foreground text-center line-clamp-2 max-w-50">
                              Consigliato 200x200px (JPG, PNG, WebP)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Social Connect */}
                    <div className='space-y-6'>
                      <div>
                        <h4 className='text-lg font-bold tracking-tight'>Social Network</h4>
                        <p className='text-muted-foreground text-xs'>I tuoi link social verranno mostrati ai clienti.</p>
                      </div>

                      <div className='space-y-4'>
                        <div className='space-y-1.5'>
                          <div className='flex items-center gap-2 pl-1'>
                            <FaInstagram className="text-pink-500 text-sm" />
                            <span className='text-xs font-bold'>Instagram</span>
                          </div>
                          <Input
                            placeholder="@tuoristorante"
                            value={branding.social_links.instagram}
                            className="h-11 rounded-xl border-2"
                            onChange={e => setBranding({ ...branding, social_links: { ...branding.social_links, instagram: e.target.value } })}
                          />
                        </div>

                        <div className='space-y-1.5'>
                          <div className='flex items-center gap-2 pl-1'>
                            <FaFacebook className="text-blue-600 text-sm" />
                            <span className='text-xs font-bold'>Facebook</span>
                          </div>
                          <Input
                            placeholder="facebook.com/pagina"
                            value={branding.social_links.facebook}
                            className="h-11 rounded-xl border-2"
                            onChange={e => setBranding({ ...branding, social_links: { ...branding.social_links, facebook: e.target.value } })}
                          />
                        </div>

                        <div className='space-y-1.5'>
                          <div className='flex items-center gap-2 pl-1'>
                            <FaTiktok className="text-sm" />
                            <span className='text-xs font-bold'>TikTok</span>
                          </div>
                          <Input
                            placeholder="@tuoristorante"
                            value={branding.social_links.tiktok}
                            className="h-11 rounded-xl border-2"
                            onChange={e => setBranding({ ...branding, social_links: { ...branding.social_links, tiktok: e.target.value } })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value='hours' className='mt-0'>
                  <WeeklyHoursSelector
                    key={location.id}
                    initialData={formData.opening_hours || undefined}
                    context='settings'
                    onChange={(hours) => setFormData(prev => ({ ...prev, opening_hours: hours }))}
                  />
                </TabsContent>

                <TabsContent value='closures' className='mt-0'>
                  <SpecialClosuresPanel locationId={location.id} />
                </TabsContent>

                <TabsContent value='connections' className='mt-0'>
                  <div>

                    <div className='divide-y-2'>
                      {/* Google Business Profile */}
                      <div className='p-6 flex flex-col sm:flex-row sm:items-start gap-6'>
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
                        </div>
                      </div>

                      {/* Google Calendar */}
                      <div className='p-6 flex flex-col sm:flex-row sm:items-start gap-6 opacity-60'>
                        <div className='flex items-center gap-3 sm:w-56 shrink-0'>
                          <div className='w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center'>
                            <Calendar className='w-4 h-4 text-blue-500' />
                          </div>
                          <div>
                            <p className='text-sm font-semibold'>Google Calendar</p>
                            <p className='text-xs text-muted-foreground'>Sync prenotazioni</p>
                          </div>
                        </div>

                        <div className='flex-1 flex flex-col gap-3'>
                          <div className='flex items-center gap-2'>
                            <span className='inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full'>
                              In arrivo
                            </span>
                          </div>
                          <p className='text-sm text-muted-foreground'>
                            La sincronizzazione automatica delle prenotazioni su Google Calendar sarà disponibile dopo l&apos;approvazione API da parte di Google.
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className='px-8 py-6 bg-muted/20 border-t-2 flex items-center justify-between'>
              <p className='text-xs text-muted-foreground hidden sm:block italic'>
                Le modifiche verranno applicate istantaneamente dopo il salvataggio.
              </p>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className='rounded-2xl h-12 px-8 font-bold text-md'
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Salvataggio...
                  </>
                ) : 'Salva modifiche'}
              </Button>
            </div>
          </div>
        </div>

        {/* FAQ Side Section */}
        <div className='flex flex-col gap-6'>
          <FaqContent title='Domande frequenti' faqs={faqs} />
          <SupportCard />
        </div>
      </div>
    </div>
  )
}

export default SettingsView
