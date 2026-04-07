import { Metadata } from 'next'
import { getCaseStudies } from '@/utils/sanity/queries'
import CaseStudiesView from './case-studies-view'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Case Studies | Smartables',
  description: 'Scopri come i nostri clienti hanno trasformato il loro ristorante con Smartables.',
}

const CaseStudiesPage = async () => {
  const caseStudies = await getCaseStudies()
  return <CaseStudiesView caseStudies={caseStudies} />
}

export default CaseStudiesPage