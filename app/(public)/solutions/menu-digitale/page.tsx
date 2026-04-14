import { Metadata } from 'next'
import PageView from './page-view'

export const metadata: Metadata = {
  title: 'Menu Digitale & Ordini al Tavolo con QR Code',
  description: 'QR code sul tavolo: il cliente sfoglia il menu, ordina e paga senza aspettare il cameriere. Nessuna app richiesta, sempre aggiornato in tempo reale.',
  alternates: { canonical: '/solutions/menu-digitale' },
  openGraph: {
    title: 'Menu Digitale QR Code & Ordini al Tavolo | Smartables',
    description: 'QR code sul tavolo: il cliente sfoglia il menu, ordina e paga senza aspettare. Nessuna app.',
    type: 'website',
    images: [
      {
        url: "solutions/menu-digitale.png",
        width: 1280,
        height: 800,
        alt: "Smartables - Menu digitale",
      },
    ],
  },
}

const DigitalMenuPage = () => {
  return (
    <PageView />
  )
}

export default DigitalMenuPage