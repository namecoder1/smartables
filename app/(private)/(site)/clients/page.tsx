import PageWrapper from '@/components/private/page-wrapper'
import ClientsView from './clients-view'
import { Metadata } from 'next'
import { getFaqsByTopic } from '@/utils/sanity/queries'

export const metadata: Metadata = {
  title: 'Clienti',
  description: 'In questa pagina puoi analizzare i dati sui tuoi clienti, modificarli e capire trend che potrebbero aiutarti.',
}

const ClientsPage = async () => {
  const [clientFaqs] = await Promise.all([
    getFaqsByTopic('clients')
  ])

  return (
    <ClientsView faqs={clientFaqs} />
  )
}

export default ClientsPage