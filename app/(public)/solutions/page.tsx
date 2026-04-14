import { Metadata } from 'next'
import SolutionsIndexView from './solutions-index-view'

export const metadata: Metadata = {
  title: 'Soluzioni per Ristoranti',
  description: 'Scopri la suite completa di Smartables: prenotazioni, gestione sala, CRM clienti, menu digitale QR, analytics e integrazione AI per il tuo ristorante.',
  alternates: { canonical: '/solutions' },
  openGraph: {
    title: 'Soluzioni per Ristoranti | Smartables',
    description: 'Scopri la suite completa di Smartables: prenotazioni, gestione sala, CRM clienti, menu digitale QR, analytics e integrazione AI per il tuo ristorante.',
    type: 'website',
    images: [
      {
        url: "/og-image.png",
        width: 1280,
        height: 800,
        alt: "Smartables - Soluzioni per Ristoranti",
      },
    ],
  },
}

export default function SolutionsPage() {
  return <SolutionsIndexView />
}
