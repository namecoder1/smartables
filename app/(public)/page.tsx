import { createAdminClient } from '@/utils/supabase/admin'
import HomeView from './home-view'
import { getFaqsByTopic } from '@/utils/sanity/queries'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Smartables | Mai più tavoli vuoti' },
  description: 'Trasforma le chiamate perse in prenotazioni confermate. Gestione prenotazioni, CRM clienti, menu digitale e analytics per il tuo ristorante.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Smartables | Mai più tavoli vuoti',
    description: 'Trasforma le chiamate perse in prenotazioni confermate. Gestione prenotazioni, CRM clienti, menu digitale e analytics per il tuo ristorante.',
    type: 'website',
    images: [
      {
        url: "/og-image.png",
        width: 1280,
        height: 800,
        alt: "Smartables - Gestione ristorante",
      },
    ],
  },
}


const HomePage = async () => {
  const supabase = createAdminClient()
  const setupFee = process.env.NEXT_PUBLIC_ENABLE_SETUP_FEE === "true" ? false : true
  const { count: reservationCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })

  const landingFaqs = await getFaqsByTopic('landing')

  const faqSchema = landingFaqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: landingFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  } : null

  return (
    <>
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <HomeView reservations={reservationCount} setupFee={setupFee} faqs={landingFaqs} />
    </>
  )
}

export default HomePage