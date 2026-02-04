import type { Metadata } from "next";
import "./globals.css";
import { Manrope } from 'next/font/google'
import { ThemeProvider } from "@/components/utility/theme-provider";
import { Analytics } from "@vercel/analytics/next"

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
  description: "Mai più tavoli vuoti. Trasforma le chiamate perse in prenotazioni confermate.",
  openGraph: {
    title: "Smartables | Mai più tavoli vuoti",
    description: "Trasforma le chiamate perse in prenotazioni confermate.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://smartables.it",
    siteName: "Smartables",
    locale: "it_IT",
    type: "website",
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
    title: "Smartables",
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased ${manrope.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
