import Script from 'next/script'

const GA_ID = 'G-BDJXMQL9YN'

/**
 * Google Analytics with Consent Mode v2.
 *
 * All three scripts use `afterInteractive` — the App Router does not support
 * `beforeInteractive` for Script components. The consent defaults are set
 * in the first script which still runs before gtag.js because Next.js
 * preserves the render order within the same strategy bucket.
 *
 * Consent signals are updated from ConsentManager via window.gtag()
 * whenever the user makes an explicit choice.
 */
export function GoogleAnalytics() {
  return (
    <>
      {/* Initialize dataLayer and set consent defaults before gtag.js loads */}
      <Script id="gtag-consent-init" strategy="afterInteractive">{`
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
