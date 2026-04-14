import { Metadata } from 'next'
import PageView from './page-view'

export const metadata: Metadata = {
  title: 'Gestione Sala & Mappa Tavoli',
  description: 'Mappa interattiva drag & drop, timer per tavolo e turni multipli. Massima rotazione dei coperti, zero stress. Aumenta la capacità del tuo ristorante del 40%.',
  alternates: { canonical: '/solutions/gestione-sala' },
  openGraph: {
    title: 'Gestione Sala & Mappa Tavoli | Smartables',
    description: 'Mappa interattiva, timer tavolo e turni multipli. Aumenta la rotazione dei coperti del 40%.',
    type: 'website',
    images: [
      {
        url: "solutions/gestione-sala.png",
        width: 1280,
        height: 800,
        alt: "Smartables - Gestione Sala",
      },
    ],
  },
}

export default function HallManagementPage() {
  return (
    <PageView />
  )
}

