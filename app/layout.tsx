import type { Metadata } from "next";
import './globals.css'
import { Manrope } from 'next/font/google'
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip";
import { PWARegister } from "@/components/utility/pwa-register";
import { ConsentManager } from "@/components/utility/consent-manager";
import { GoogleAnalytics } from "@/components/utility/google-analytics";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://smartables.it";

const orgSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Smartables",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icons/icon-512x512.png`,
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Smartables",
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/blog?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://smartables.it"),
  title: {
    default: "Smartables | Mai più tavoli vuoti",
    template: "%s | Smartables"
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Smartables",
    startupImage: "/icons/apple-touch-icon.png",
  },
  description: "Mai più tavoli vuoti. Smartables gestisce prenotazioni, CRM clienti, menu digitale QR, ordini al tavolo e analytics per ristoranti. Prova gratis 14 giorni.",
  openGraph: {
    title: "Smartables | Mai più tavoli vuoti",
    description: "Trasforma le chiamate perse in prenotazioni confermate.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://smartables.it",
    siteName: "Smartables",
    locale: "it_IT",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1280,
        height: 800,
        alt: "Smartables - Gestione ristorante",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  twitter: {
    card: "summary_large_image",
    title: "Smartables | Mai più tavoli vuoti",
    description: "Trasforma le chiamate perse in prenotazioni confermate.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={`antialiased ${manrope.className}`}>
      <GoogleAnalytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <ConsentManager>
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster richColors position="top-center" />
          <PWARegister />
        </ConsentManager>
      </body>
    </html>
  );
}
