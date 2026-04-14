import { Metadata } from 'next'
import PageView from './page-view'

export const metadata: Metadata = {
  title: 'Recupero Chiamate AI per Ristoranti',
  description: 'Ogni chiamata senza risposta diventa un messaggio WhatsApp automatico. Il cliente prenota da solo 24/7, tu non perdi più nessuna prenotazione.',
  alternates: { canonical: '/solutions/integrazione-ai' },
  openGraph: {
    title: 'Recupero Chiamate AI per Ristoranti | Smartables',
    description: 'Ogni chiamata persa diventa un messaggio WhatsApp automatico. Il cliente prenota da solo, 24 ore su 24.',
    type: 'website',
    images: [
      {
        url: "solutions/integrazione-ai.jpg",
        width: 1280,
        height: 800,
        alt: "Smartables - Integrazione AI",
      },
    ],
  },
}

const AiIntegrationPage = () => {
  return (
    <PageView />
  )
}

export default AiIntegrationPage