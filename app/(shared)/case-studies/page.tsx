import { Metadata } from 'next'
import { getCaseStudies } from '@/utils/sanity/queries'
import CaseStudiesView from './case-studies-view'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Case Studies',
  description: 'Scopri come i nostri clienti hanno trasformato il loro ristorante con Smartables. Storie reali di successo con risultati misurabili.',
  alternates: { canonical: '/case-studies' },
  openGraph: {
    title: 'Case Studies | Smartables',
    description: 'Storie reali di ristoratori che hanno trasformato il loro locale con Smartables. Risultati misurabili.',
    type: 'website',
    images: [
      {
        url: "/og-image.png",
        width: 1280,
        height: 800,
        alt: "Smartables - Case Studies",
      },
    ],
  },
}

const CaseStudiesPage = async () => {
  const caseStudies = await getCaseStudies()
  return <CaseStudiesView caseStudies={caseStudies} />
}

export default CaseStudiesPage