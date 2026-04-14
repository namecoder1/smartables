import { Metadata } from 'next'
import PageView from './page-view'

export const metadata: Metadata = {
  title: 'Analytics & Report per Ristoranti',
  description: "Dashboard live con coperti per fascia oraria, fatturato recuperato, piatti più ordinati e clienti fedeli. Capisci il tuo ristorante in un colpo d'occhio.",
  alternates: { canonical: '/solutions/analytics' },
  openGraph: {
    title: 'Analytics & Report per Ristoranti | Smartables',
    description: 'Dashboard live con coperti, fatturato, piatti più ordinati e report clienti. Tutto in tempo reale.',
    type: 'website',
    images: [
      {
        url: "solutions/analitiche.jpg",
        width: 1280,
        height: 800,
        alt: "Smartables - Analytics & Report",
      },
    ],
  },
}

const AnalyticsPage = () => {
  return (
    <PageView />
  )
}

export default AnalyticsPage