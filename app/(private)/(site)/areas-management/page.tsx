import { Metadata } from 'next'
import AreasView from './areas-view'

export const metadata: Metadata = {
  title: 'Gestione sala',
  description: 'Gestisci le zone e i tavoli del tuo locale',
}

const ManageAreasPage = () => {
  return (
    <AreasView />
  )
}

export default ManageAreasPage