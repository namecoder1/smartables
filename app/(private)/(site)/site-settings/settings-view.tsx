'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Store, Loader2 } from 'lucide-react'
import { LocationBranding as Branding, Location } from '@/types/general'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateLocation } from '@/app/actions/settings'
import { trackStorageUpload } from '@/app/actions/storage'
import ColorPicker from '@/components/ui/color-picker'
import { toast } from 'sonner'
import { PhoneInput } from '@/components/ui/phone-input'
import { ImageUpload } from '@/components/private/image-upload'
import { createClient } from '@/utils/supabase/client'
import { FaInstagram, FaFacebook, FaTiktok } from 'react-icons/fa'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { WeeklyHoursSelector } from '@/components/utility/weekly-hours-selector'
import { NumberInput } from '@/components/ui/number-input'
import SupportCard from '@/components/utility/support-card'
import { FaqContent } from '@/components/private/faq-section'
import { SanityFaq } from '@/utils/sanity/queries'
import { SpecialClosuresPanel } from './special-closures-panel'

const SettingsView = ({
  locations,
  faqs,
}: {
  locations: any[]
  faqs: SanityFaq[]
}) => {
  const location = locations && locations.length > 0 ? locations[0] : undefined
  const [formData, setFormData] = useState<Partial<Location>>({})
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('info')

  const [branding, setBranding] = useState<Branding>({
    colors: { primary: '#000000', secondary: '#ffffff', accent: '#3b82f6' },
    logo_url: '',
    social_links: { instagram: '', facebook: '', tiktok: '' }
  })

  // Restore tab from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab) {
      setActiveTab(tab)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

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
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
