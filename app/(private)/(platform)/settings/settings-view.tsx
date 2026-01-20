'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import MenusTab from '../../../../components/private/menus-tab'
import PhoneSettings from '../../../../components/private/phone-settings'
import { Info, BookOpen } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink, QrCode, Store, MapPin, Phone, Loader2, Save, Palette, Share2, ImageIcon } from 'lucide-react'
import { Branding, InfoTabProps, Location, SettingsViewProps } from '@/types/components'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateLocation } from '@/app/actions/settings'
import QRCode from '../../../../components/private/qr-code'
import ColorPicker from '@/components/ui/color-picker'
import { toast } from 'sonner'
import { PhoneInput } from '@/components/ui/phone-input'


const SettingsView = ({ locations, menus, organizationId }: SettingsViewProps) => {
  const [activeTab, setActiveTab] = useState<'info' | 'menus' | 'phone'>('info')
  const location = locations && locations.length > 0 ? locations[0] : undefined

  return (
    <div className="space-y-6 w-full">
      <Tabs defaultValue="info" className='w-full' value={activeTab} onValueChange={(value) => setActiveTab(value as 'info' | 'menus')}>
        <TabsList className='max-w-md w-full grid grid-cols-3'>
          <TabsTrigger value="info" className='flex items-center gap-1.5'>
            <Info className="w-4 h-4" /> Informazioni
          </TabsTrigger>
          <TabsTrigger value="menus" className='flex items-center gap-1.5'>
            <BookOpen className="w-4 h-4" /> Menu
          </TabsTrigger>
          <TabsTrigger value="phone" className='flex items-center gap-1.5'>
            <Phone className="w-4 h-4" /> Telefono
          </TabsTrigger>
        </TabsList>
        <Separator className='mb-2' />
        <TabsContent value="info" className='w-full'>
          <InfoTab location={location} />
        </TabsContent>
        <TabsContent value="menus" className='w-full'>
          <MenusTab menus={menus} organizationId={organizationId} locations={locations || []} />
        </TabsContent>
        <TabsContent value="phone" className='w-full'>
          {location ? (
            <PhoneSettings location={location} />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
              <Store className="w-10 h-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Activity Found</h3>
              <p className="text-sm text-muted-foreground">Please create an activity first.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

const InfoTab = ({ location }: InfoTabProps) => {
  const [formData, setFormData] = useState<Partial<Location>>({})
  const [branding, setBranding] = useState<Branding>({
    colors: { primary: '#000000', secondary: '#ffffff', accent: '#3b82f6' },
    logo_url: '',
    social_links: { instagram: '', facebook: '', tiktok: '' }
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        address: location.address,
        phone_number: location.phone_number,
        seats: location.seats,
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
      await updateLocation(location.id, {
        ...formData,
        branding: branding
      })
      toast.success('Location info updated successfully')
    } catch (error) {
      toast.error('Failed to update location info')
    } finally {
      setIsLoading(false)
    }
  }

  if (!location) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
        <Store className="w-10 h-10 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No Activity Found</h3>
        <p className="text-sm text-muted-foreground">Please create an activity in the "Manage Activities" section first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="w-full gap-6">
        <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4'>
          <Card className='lg:col-span-2'>
            <CardHeader className='flex items-center gap-3'>
              <div className='bg-orange-400 p-3 rounded-lg w-fit'>
                <Info color='white' size={20} />
              </div>
              <div>
                <CardTitle className='text-xl font-bold'>Informazioni</CardTitle>
                <CardDescription>Informazioni di base sull'attività.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className='grid grid-cols-2 gap-4'>
                <div className="grid gap-2">
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
                <div className="grid gap-2">
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
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Numero di telefono</Label>
                  <PhoneInput
                    id="phone"
                    defaultCountry='IT'
                    value={formData.phone_number || ''}
                    placeholder="es: +39 333 123 4567"
                    onChange={(e) => setFormData({ ...formData, phone_number: e })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="seats">Coperti totali</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="seats"
                      type="number"
                      placeholder='es: 100'
                      className="pl-9"
                      value={formData.seats || ''}
                      onChange={(e) => setFormData({ ...formData, seats: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Colori dell'attività</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="col-primary" className="text-xs">Primario</Label>
                    <div className="flex items-center gap-3">
                      <ColorPicker
                        shape="circle"
                        color={branding.colors.primary}
                        onChange={(color) => setBranding({ ...branding, colors: { ...branding.colors, primary: color } })}
                      />
                      <span className="text-xs font-mono text-muted-foreground">{branding.colors.primary}</span>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="col-secondary" className="text-xs">Secondario</Label>
                    <div className="flex items-center gap-3">
                      <ColorPicker
                        shape="circle"
                        color={branding.colors.secondary}
                        onChange={(color) => setBranding({ ...branding, colors: { ...branding.colors, secondary: color } })}
                      />
                      <span className="text-xs font-mono text-muted-foreground">{branding.colors.secondary}</span>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="col-accent" className="text-xs">Accento</Label>
                    <div className="flex items-center gap-3">
                      <ColorPicker
                        shape="circle"
                        color={branding.colors.accent}
                        onChange={(color) => setBranding({ ...branding, colors: { ...branding.colors, accent: color } })}
                      />
                      <span className="text-xs font-mono text-muted-foreground">{branding.colors.accent}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Logo */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Logo
                </h3>
                <div className="grid gap-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    placeholder="https://example.com/logo.png"
                    value={branding.logo_url}
                    onChange={e => setBranding({ ...branding, logo_url: e.target.value })}
                  />
                  <p className="text-[0.8rem] text-muted-foreground">Enter the full URL of your logo image.</p>
                </div>
              </div>

              <Separator />

              {/* Social Links */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Social Media
                </h3>
                <div className="grid gap-3">
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label htmlFor="instagram" className="col-span-1">Instagram</Label>
                    <Input
                      id="instagram"
                      className="col-span-2"
                      placeholder="@username or URL"
                      value={branding.social_links.instagram}
                      onChange={e => setBranding({ ...branding, social_links: { ...branding.social_links, instagram: e.target.value } })}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label htmlFor="facebook" className="col-span-1">Facebook</Label>
                    <Input
                      id="facebook"
                      className="col-span-2"
                      placeholder="Page URL"
                      value={branding.social_links.facebook}
                      onChange={e => setBranding({ ...branding, social_links: { ...branding.social_links, facebook: e.target.value } })}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label htmlFor="tiktok" className="col-span-1">TikTok</Label>
                    <Input
                      id="tiktok"
                      className="col-span-2"
                      placeholder="@username or URL"
                      value={branding.social_links.tiktok}
                      onChange={e => setBranding({ ...branding, social_links: { ...branding.social_links, tiktok: e.target.value } })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-end">
              <Button onClick={handleSave} size="lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Salva
              </Button>
            </CardFooter>
          </Card>
          <Card className='h-fit'>
            <CardHeader>
              <CardTitle className='text-lg font-bold'>Come compilare questo form?</CardTitle>
              <CardDescription>Se non hai un logo, puoi usare un URL di un'immagine online.</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <h4 className='text-lg font-semibold'>Informazioni principali</h4>
                <span className='font-bold bg-orange-200 py-1 px-2 rounded text-xs'>Nome | Indirizzo | Telefono</span>
                <p className='text-sm text-muted-foreground mt-1'>Queste informazioni sono richieste per farti identificare dai clienti, sono inoltre essenziali per poterti riconoscere tra gli altri clienti di Smartables.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SettingsView
