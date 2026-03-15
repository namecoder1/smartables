import { Metadata } from 'next'
import ActivitiesView from './activites-view'
import { getFaqsByTopic } from '@/utils/sanity/queries'

export const metadata: Metadata = {
  title: "Gestisci le sedi",
  description: "Gestisci le sedi della tua organizzazione",
}

const ManageActivitiesPage = async () => {
  const [locationFaqs] = await Promise.all([
    getFaqsByTopic('locations')
  ])

  return (
    <ActivitiesView faqs={locationFaqs} />
  )
}

export default ManageActivitiesPage