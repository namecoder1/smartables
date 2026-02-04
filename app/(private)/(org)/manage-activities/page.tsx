import { Metadata } from 'next'
import ActivitiesView from './activites-view'

export const metadata: Metadata = {
  title: "Gestisci le sedi",
  description: "Gestisci le sedi della tua organizzazione",
}

const ManageActivitiesPage = () => {
  return (
    <ActivitiesView />
  )
}

export default ManageActivitiesPage