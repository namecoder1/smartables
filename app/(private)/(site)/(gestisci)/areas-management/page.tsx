import { Metadata } from 'next'
import SeatsView from './seats-view'

export const metadata: Metadata = {
  title: 'Gestione sala',
  description: 'Gestisci le zone e i tavoli del tuo locale',
}

const ManageSeatsPage = () => {
  return (
    <SeatsView />
  )
}

export default ManageSeatsPage