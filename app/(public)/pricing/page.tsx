import { Metadata } from 'next'
import PricingView from './pricing-view'

export const metadata: Metadata = {
  title: 'Prezzi & Piani',
  description: 'Piani trasparenti per ristoranti di ogni dimensione. Starter, Pro e Enterprise. Soddisfatti o rimborsati entro 14 giorni. Nessun costo nascosto.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Prezzi & Piani | Smartables',
    description: 'Piani trasparenti per ristoranti di ogni dimensione. Soddisfatti o rimborsati entro 14 giorni.',
    type: 'website',
    images: [
      {
        url: "/og-image.png",
        width: 1280,
        height: 800,
        alt: "Smartables - Pricing & Piani",
      },
    ],
  },
}

const PricingPage = () => {
  return (
    <PricingView />
  )
}

export default PricingPage