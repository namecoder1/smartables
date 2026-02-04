import { Metadata } from 'next'
import SettingsView from '../manage-activities/activites-view'

export const metadata: Metadata = {
  title: "Impostazioni Generali",
  description: "Gestisci le impostazioni generali della tua organizzazione.",
}

const GeneralSettingsPage = () => {
  return (
    <SettingsView />
  )
}

export default GeneralSettingsPage