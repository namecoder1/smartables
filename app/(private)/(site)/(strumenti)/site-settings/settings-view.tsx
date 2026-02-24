'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Store, MapPin, Loader2, Share2, ImageIcon, Palette, Users, HelpCircle, Timer, Armchair } from 'lucide-react'
import { LocationBranding as Branding, Location } from '@/types/general'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateLocation } from '@/app/actions/settings'
import ColorPicker from '@/components/ui/color-picker'
import { toast } from 'sonner'
import { PhoneInput } from '@/components/ui/phone-input'
import { ImageUpload } from '@/components/private/image-upload'
import { createClient } from '@/utils/supabase/client'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { FaInstagram, FaFacebook, FaTiktok } from 'react-icons/fa'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { WeeklyHoursSelector } from '@/components/utility/weekly-hours-selector'

const faqs = [
  {
    id: 1,
    title: 'A cosa servono queste informazioni?',
    text: 'Le informazioni della sede vengono utilizzate per identificare la tua attività nel sistema, nei menu pubblici e nelle comunicazioni con i clienti. Assicurati che siano sempre aggiornate.'
  },
  {
    id: 2,
    title: 'Cosa sono i "Coperti totali"?',
    text: 'I coperti totali rappresentano il numero massimo di clienti che il tuo locale può ospitare contemporaneamente. Questo valore viene usato per calcolare la disponibilità nelle prenotazioni e per le analitiche.'
  },
  {
    id: 3,
    title: 'A cosa servono i colori?',
    text: 'I colori personalizzano l\'aspetto del tuo menu pubblico e delle pagine rivolte ai clienti. Il colore primario è usato per titoli e pulsanti, il secondario per sfondi, e l\'accento per elementi di evidenza.'
  },
  {
    id: 4,
    title: 'Che formato deve avere il logo?',
    text: 'Il logo deve essere un\'immagine in formato JPG, PNG o WebP con dimensione massima di 2MB. Ti consigliamo un\'immagine quadrata di almeno 200x200px per una resa ottimale.'
  },
  {
    id: 5,
    title: 'I social media sono obbligatori?',
    text: 'No, i link ai social media sono opzionali. Se inseriti, verranno mostrati nel footer del tuo menu pubblico per permettere ai clienti di seguirti.'
  }
]

const SettingsView = ({ locations }: { locations: any[] }) => {
  const location = locations && locations.length > 0 ? locations[0] : undefined
  const [formData, setFormData] = useState<Partial<Location>>({})
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
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
    <div className='grid grid-cols-1 xl:grid-cols-3 gap-4'>
      {/* Main Form Card */}
      <Card className='xl:col-span-2'>
        <CardHeader>
          <CardTitle className='text-lg'>Dati della Sede</CardTitle>
          <CardDescription>Modifica le informazioni principali della tua attività.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue='info'>
            <TabsList className='w-full max-w-md'>
              <TabsTrigger value='info' className='w-1/2'>Informazioni</TabsTrigger>
              <TabsTrigger value='hours' className='w-1/2'>Orari</TabsTrigger>
            </TabsList>
            <TabsContent value='info'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome attività</Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      className="pl-9"
                      value={formData.name || ''}
                      placeholder="es: Pizzeria La Spianata"
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Indirizzo</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      className="pl-9"
                      placeholder='es: Via Roma 1, 00100 Roma'
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Numero di telefono</Label>
                  <PhoneInput
                    id="phone"
                    context='default'
                    defaultCountry='IT'
                    value={formData.phone_number || ''}
                    placeholder="es: +39 333 123 4567"
                    onChange={(e) => setFormData({ ...formData, phone_number: e })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seats">Coperti totali</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="seats"
                      type="number"
                      placeholder='es: 50'
                      className="pl-9"
                      value={formData.seats || ''}
                      onChange={(e) => setFormData({ ...formData, seats: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_covers">Max coperti per turno</Label>
                  <div className="relative">
                    <Armchair className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="max_covers"
                      type="number"
                      placeholder='es: 100'
                      className="pl-9"
                      value={formData.max_covers_per_shift || ''}
                      onChange={(e) => setFormData({ ...formData, max_covers_per_shift: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Durata standard (min)</Label>
                  <div className="relative">
                    <Timer className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="duration"
                      type="number"
                      placeholder='es: 90'
                      className="pl-9"
                      value={formData.standard_reservation_duration || ''}
                      onChange={(e) => setFormData({ ...formData, standard_reservation_duration: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <Accordion type='multiple' defaultValue={['branding']} className="w-full h-full space-y-4">
                {/* Branding Section */}
                <AccordionItem value="branding" className="border px-4 rounded-xl bg-input/10">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30">
                        <Palette className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Personalizzazione</p>
                        <p className="text-xs text-muted-foreground font-normal">Colori e logo del brand</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="gap-4 space-y-4 flex items-start w-full">
                    <div className="space-y-2 w-full">
                      <Label className="text-sm">Colori del brand</Label>
                      <div className="grid grid-rows-3 gap-2">
                        <div className="flex justify-between rounded-2xl h-fit p-2 items-center gap-2 border bg-muted/30">
                          <ColorPicker
                            shape="square"
                            color={branding.colors.primary}
                            onChange={(color) => setBranding({ ...branding, colors: { ...branding.colors, primary: color } })}
                          />
                          <span className="text-xs text-muted-foreground">Primario</span>
                        </div>
                        <div className="flex justify-between rounded-2xl h-fit p-2 items-center gap-2 border bg-muted/30">
                          <ColorPicker
                            shape="square"
                            color={branding.colors.secondary}
                            onChange={(color) => setBranding({ ...branding, colors: { ...branding.colors, secondary: color } })}
                          />
                          <span className="text-xs text-muted-foreground">Secondario</span>
                        </div>
                        <div className="flex justify-between rounded-2xl h-fit p-2 items-center gap-2 border bg-muted/30">
                          <ColorPicker
                            shape="square"
                            color={branding.colors.accent}
                            onChange={(color) => setBranding({ ...branding, colors: { ...branding.colors, accent: color } })}
                          />
                          <span className="text-xs text-muted-foreground">Accento</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 w-full">
                      <ImageUpload
                        value={branding.logo_url}
                        aspect="square"
                        title='Logo'
                        onChange={(url, file) => {
                          if (file) setLogoFile(file)
                          setBranding(prev => ({ ...prev, logo_url: url || '' }))
                        }}
                      />
                      <p className="text-[10px] text-muted-foreground">JPG, PNG o WebP • Max 2MB • Consigliato 200x200px</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Social Media Section */}
                <AccordionItem value="social" className="border px-4 border-b! rounded-xl bg-input/10">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30">
                        <Share2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Social Media</p>
                        <p className="text-xs text-muted-foreground font-normal">Link ai tuoi profili social</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-4 px-1">
                    <div className="space-y-2">
                      <Label htmlFor="instagram" className="flex items-center gap-1.5 text-sm">
                        <FaInstagram className="text-pink-500" /> Instagram
                      </Label>
                      <Input
                        id="instagram"
                        placeholder="@tuoristorante"
                        value={branding.social_links.instagram}
                        onChange={e => setBranding({ ...branding, social_links: { ...branding.social_links, instagram: e.target.value } })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="facebook" className="flex items-center gap-1.5 text-sm">
                        <FaFacebook className="text-blue-600" /> Facebook
                      </Label>
                      <Input
                        id="facebook"
                        placeholder="https://facebook.com/tuapagina"
                        value={branding.social_links.facebook}
                        onChange={e => setBranding({ ...branding, social_links: { ...branding.social_links, facebook: e.target.value } })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tiktok" className="flex items-center gap-1.5 text-sm">
                        <FaTiktok /> TikTok
                      </Label>
                      <Input
                        id="tiktok"
                        placeholder="@tuoristorante"
                        value={branding.social_links.tiktok}
                        onChange={e => setBranding({ ...branding, social_links: { ...branding.social_links, tiktok: e.target.value } })}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            <TabsContent value='hours'>
              <WeeklyHoursSelector
                key={location.id}
                initialData={formData.opening_hours || undefined}
                context='settings'
                onChange={(hours) => setFormData(prev => ({ ...prev, opening_hours: hours }))}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex items-center justify-end border-t mt-2">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salva modifiche
          </Button>
        </CardFooter>
      </Card>

      {/* FAQ Card */}
      <SettingsFAQ />
    </div>
  )
}

const SettingsFAQ = () => {
  return (
    <Card className="h-fit gap-2">
      <CardHeader>
        <CardTitle className="text-lg">Domande Frequenti</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={`item-${faq.id}`}>
              <AccordionTrigger className="text-sm text-left">{faq.title}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {faq.text}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}

export default SettingsView
