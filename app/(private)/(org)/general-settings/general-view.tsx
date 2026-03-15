"use client"

import { useState, useTransition } from "react"
import { Organization, UxSettings } from "@/types/general"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Building2, Globe, Bell } from "lucide-react"
import { toast } from "sonner"
import { updateOrganizationInfo, updateUxSettings } from "./actions"
import { PhoneInput } from "@/components/ui/phone-input"

const CURRENCIES = [
  { value: "EUR", label: "Euro (€)" },
  { value: "USD", label: "Dollaro USA ($)" },
  { value: "GBP", label: "Sterlina (£)" },
  { value: "CHF", label: "Franco Svizzero (CHF)" },
] as const

const LANGUAGES = [
  { value: "it", label: "Italiano" },
  { value: "en", label: "English" },
  { value: "sp", label: "Español" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
] as const

const TIMEZONES = [
  { value: "Europe/Rome", label: "Roma (UTC+1/+2)" },
  { value: "Europe/London", label: "Londra (UTC+0/+1)" },
  { value: "Europe/Berlin", label: "Berlino (UTC+1/+2)" },
  { value: "Europe/Andorra", label: "Andorra (UTC+1/+2)" },
] as const

const NOTIFICATION_PREFERENCES = [
  {
    key: "push_new_order" as const,
    label: "Notifica push: nuovo ordine",
    description: "Ricevi una notifica push sull'app mobile ogni volta che arriva un nuovo ordine",
  },
  {
    key: "push_new_booking" as const,
    label: "Notifica push: nuova prenotazione",
    description: "Ricevi una notifica push quando arriva una prenotazione (WhatsApp, manuale o dal sito)",
  },
  {
    key: "email_plan_ending" as const,
    label: "Email: rinnovo piano",
    description: "Ricevi un'email 3 giorni prima del rinnovo (o scadenza) del piano",
  },
  {
    key: "email_limit_reached" as const,
    label: "Email: limite raggiunto",
    description: "Ricevi un'email quando contatti WhatsApp, storage o account staff raggiungono il 100%",
  },
  {
    key: "email_monthly_recap" as const,
    label: "Email: riepilogo mensile",
    description: "Ricevi un riepilogo ogni mese con ordini, revenue, prenotazioni e altri dati chiave",
  },
] as const

const GeneralView = ({ organization }: { organization: Organization }) => {
  // --- Dati organizzazione ---
  const [orgName, setOrgName] = useState(organization.name)
  const [orgSlug, setOrgSlug] = useState(organization.slug)
  const [billingEmail, setBillingEmail] = useState(organization.billing_email)
  const [isPendingOrg, startOrgTransition] = useTransition()

  // --- Localizzazione ---
  const [currency, setCurrency] = useState(organization.ux_settings.localization.currency)
  const [language, setLanguage] = useState(organization.ux_settings.localization.language)
  const [timezone, setTimezone] = useState(organization.ux_settings.localization.timezone)
  const [isPendingLocale, startLocaleTransition] = useTransition()

  // --- Notifiche ---
  const [personalEmail, setPersonalEmail] = useState(organization.ux_settings.notifications.personal_email)
  const [personalPhone, setPersonalPhone] = useState(organization.ux_settings.notifications.personal_phone)
  const [prefs, setPrefs] = useState(organization.ux_settings.notifications.preferences)
  const [isPendingNotif, startNotifTransition] = useTransition()

  const handleSaveOrg = () => {
    startOrgTransition(async () => {
      const formData = new FormData()
      formData.set("name", orgName)
      formData.set("slug", orgSlug)
      formData.set("billing_email", billingEmail)
      const result = await updateOrganizationInfo(formData)
      if (result.success) {
        toast.success("Dati organizzazione aggiornati")
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleSaveLocale = () => {
    startLocaleTransition(async () => {
      const settings: UxSettings = {
        ...organization.ux_settings,
        localization: { currency, language, timezone },
      }
      const result = await updateUxSettings(settings)
      if (result.success) {
        toast.success("Localizzazione aggiornata")
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleSaveNotif = () => {
    startNotifTransition(async () => {
      const settings: UxSettings = {
        ...organization.ux_settings,
        notifications: {
          preferences: prefs,
          personal_email: personalEmail,
          personal_phone: personalPhone,
        },
      }
      const result = await updateUxSettings(settings)
      if (result.success) {
        toast.success("Preferenze notifiche aggiornate")
      } else {
        toast.error(result.error)
      }
    })
  }

  const togglePref = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 border border-primary/20 bg-primary/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              Dati organizzazione
            </CardTitle>
            <CardDescription>
              Nome pubblico, slug URL e email di fatturazione.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Nome organizzazione</Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Il tuo ristorante"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-slug">Slug URL</Label>
                <Input
                  id="org-slug"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  placeholder="il-tuo-ristorante"
                />
                <p className="text-xs text-muted-foreground">
                  Usato nei link pubblici — usa solo lettere minuscole e trattini.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-email">Email di fatturazione</Label>
              <Input
                id="billing-email"
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                placeholder="fatturazione@esempio.com"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveOrg} disabled={isPendingOrg}>
                {isPendingOrg ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salva"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 border border-primary/20 bg-primary/10 flex items-center justify-center">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              Localizzazione
            </CardTitle>
            <CardDescription>
              Valuta, lingua e fuso orario della tua organizzazione. Queste impostazioni saranno utilizzate nelle future funzionalità multi-mercato.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Valuta</Label>
                <Select value={currency} onValueChange={(v) => setCurrency(v as typeof currency)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lingua</Label>
                <Select value={language} onValueChange={(v) => setLanguage(v as typeof language)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fuso orario</Label>
                <Select value={timezone} onValueChange={(v) => setTimezone(v as typeof timezone)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveLocale} disabled={isPendingLocale}>
                {isPendingLocale ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salva"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 border border-primary/20 bg-primary/10 flex items-center justify-center">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            Preferenze notifiche
          </CardTitle>
          <CardDescription>
            Scegli come e quando ricevere notifiche push (app mobile) ed email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="personal-email">Email personale</Label>
              <Input
                id="personal-email"
                type="email"
                value={personalEmail}
                onChange={(e) => setPersonalEmail(e.target.value)}
                placeholder="tu@esempio.com"
              />
              <p className="text-xs text-muted-foreground">
                Usata per le email transazionali (se diversa dalla email di fatturazione).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="personal-phone">Telefono personale</Label>
              <PhoneInput
                id="personal-phone"
                value={personalPhone}
                onChange={(value) => setPersonalPhone(value)}
                defaultCountry="IT"
                className="border-2 h-9 rounded-xl shadow-sm"
              />
              <p className="text-xs text-muted-foreground">
                Riservato a futuri canali di notifica (es. SMS).
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {NOTIFICATION_PREFERENCES.map((pref) => (
              <div
                key={pref.key}
                className="flex items-start justify-between gap-4 p-4 border bg-input/30"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{pref.label}</p>
                  <p className="text-xs text-muted-foreground">{pref.description}</p>
                </div>
                <Switch
                  checked={prefs[pref.key]}
                  onCheckedChange={() => togglePref(pref.key)}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveNotif} disabled={isPendingNotif}>
              {isPendingNotif ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salva"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default GeneralView
