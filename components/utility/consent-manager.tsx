'use client'

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { ConsentManagerProvider, CookieBanner, ConsentManagerDialog } from '@c15t/nextjs/client'
import { baseTranslations } from '@c15t/translations'
import { saveConsentRecord } from '@/app/actions/consent'
import { AnalyticsWithConsent } from './analytics-with-consent'
import { updateGAConsent } from './google-analytics'

const italianTranslations = baseTranslations.it

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const ORANGE = '#FF9710'
const ORANGE_HOVER = '#e4870e'
const ORANGE_SUBTLE = '#FF971015'

// ─── Banner theme ─────────────────────────────────────────────────────────────
const bannerTheme = {
  // Card container — stile Smartables: bordi sottili, shadow leggera, angoli arrotondati
  'banner.card': {
    style: {
      '--banner-border-radius': '16px',
      '--banner-background-color': '#ffffff',
      '--banner-background-color-dark': '#18181b',
      '--banner-border-color': '#e5e7eb',
      '--banner-border-color-dark': '#27272a',
      '--banner-border-width': '1px',
      '--banner-shadow': '0 8px 32px rgba(0,0,0,0.08)',
      '--banner-shadow-dark': '0 8px 32px rgba(0,0,0,0.4)',
    },
  },
  // Titolo
  'banner.header.title': {
    style: {
      '--banner-title-color': '#111827',
      '--banner-title-color-dark': '#f9fafb',
    },
  },
  // Descrizione
  'banner.header.description': {
    style: {
      '--banner-description-color': '#6b7280',
      '--banner-description-color-dark': '#9ca3af',
    },
  },
  // Footer sfondo
  'banner.footer': {
    style: {
      '--banner-footer-background-color': '#f9fafb',
      '--banner-footer-background-color-dark': '#1f1f23',
    },
  },
  // Bottone Accetta — arancione brand
  'banner.footer.accept-button': {
    style: {
      '--button-primary': ORANGE,
      '--button-primary-dark': ORANGE_HOVER,
      '--button-primary-hover': ORANGE_SUBTLE,
      '--button-border-radius': '8px',
      '--button-font-weight': '600',
    },
  },
  // Bottone Rifiuta — neutro
  'banner.footer.reject-button': {
    style: {
      '--button-border-radius': '8px',
      '--button-font-weight': '500',
    },
  },
  // Bottone Personalizza — neutro
  'banner.footer.customize-button': {
    style: {
      '--button-border-radius': '8px',
      '--button-font-weight': '500',
    },
  },
}

export function ConsentManager({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  // c15t fires onConsentSet once on store init (restoring from localStorage).
  // We skip that first call and only persist explicit user actions.
  const isInitRestoreRef = useRef(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleConsentSet = useCallback(
    (payload: { preferences: unknown }) => {
      if (isInitRestoreRef.current) {
        isInitRestoreRef.current = false
        return
      }
      const prefs = payload.preferences as Record<'necessary' | 'measurement', boolean>
      updateGAConsent(prefs.measurement ?? false)
      saveConsentRecord(prefs)
    },
    [],
  )

  // On the server and during first client render, return children only.
  // This guarantees the HTML matches between server and client (no localStorage reads).
  // After hydration the provider mounts on the client and starts reading consent state.
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ConsentManagerProvider
      options={{
        mode: 'offline',
        consentCategories: ['necessary', 'measurement'],
        ignoreGeoLocation: true,
        translations: {
          translations: { it: italianTranslations },
          defaultLanguage: 'it',
        },
        legalLinks: {
          privacyPolicy: { href: '/privacy-policy', target: '_self', label: 'Informativa Privacy' },
        },
        callbacks: {
          onConsentSet: handleConsentSet,
        },
      }}
    >
      <CookieBanner theme={bannerTheme} />
      <ConsentManagerDialog
        theme={{
          'dialog.card': {
            style: { borderRadius: '16px' },
          },
        }}
      />
      {children}
      <AnalyticsWithConsent />
    </ConsentManagerProvider>
  )
}
