import PageView from './page-view'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CRM & Loyalty per Ristoranti',
  description: 'Schede cliente automatiche, campagne WhatsApp personalizzate, tag VIP e loyalty program. Fai tornare i tuoi clienti più spesso con Smartables.',
  alternates: { canonical: '/solutions/crm' },
  openGraph: {
    title: 'CRM & Loyalty per Ristoranti | Smartables',
    description: 'Schede cliente automatiche, campagne WhatsApp personalizzate, tag VIP e loyalty program.',
    type: 'website',
    images: [
      {
        url: "solutions/crm.jpg",
        width: 1280,
        height: 800,
        alt: "Smartables - CRM & Loyalty",
      },
    ],
  },
}

export default function CrmPage() {
  return (
    <PageView />
  )
}
