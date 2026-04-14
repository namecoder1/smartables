import Script from 'next/script'

const GA_ID = 'G-BDJXMQL9YN'

/**
 * Google Analytics with Consent Mode v2.
 *
 * The default consent script runs `beforeInteractive` (injected into <head>
 * before any other JS) so that GA never fires before the user has been asked.
 * The gtag.js library and config tag load `afterInteractive` (after hydration).
 *
 * Consent signals are updated from ConsentManager via window.gtag()
 * whenever the user makes an explicit choice.
 */
export function GoogleAnalytics() {
  return (
    <>
      {/* Must run before gtag.js to block analytics_storage by default */}
      <Script id="gtag-consent-init" strategy="beforeInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('consent', 'default', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          wait_for_update: 2000
        });
        gtag('js', new Date());
      `}</Script>

      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />

      <Script id="gtag-config" strategy="afterInteractive">{`
        gtag('config', '${GA_ID}');
      `}</Script>
    </>
  )
}

/** Called from ConsentManager after an explicit user consent action. */
export function updateGAConsent(measurement: boolean) {
  if (typeof window === 'undefined') return
  const win = window as Window & { gtag?: (...args: unknown[]) => void }
  if (typeof win.gtag !== 'function') return
  win.gtag('consent', 'update', {
    analytics_storage: measurement ? 'granted' : 'denied',
    // We don't run ad campaigns — keep ad signals denied
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })
}
