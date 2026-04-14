import { Metadata } from 'next'
import PageView from './page-view'

export const metadata: Metadata = {
  title: 'Gestione Prenotazioni Ristorante',
  description: "Conferme via WhatsApp, reminder automatici, carta a garanzia anti no-show. Riduci i no-show fino all'80% e tieni il tuo ristorante sempre pieno.",
  alternates: { canonical: '/solutions/gestione-prenotazioni' },
  openGraph: {
    title: 'Gestione Prenotazioni Ristorante | Smartables',
    description: "Conferme WhatsApp, reminder automatici e carta a garanzia. Riduci i no-show fino all'80%.",
    type: 'website',
    images: [
      {
        url: "solutions/gestione-prenotazioni.png",
        width: 1280,
        height: 800,
        alt: "Smartables - Gestione Prenotazioni",
      },
    ],
  },
}

const BookingsPage = () => {
  return (
    <PageView />
  )
}

export default BookingsPage