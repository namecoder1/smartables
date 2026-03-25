import { Metadata } from 'next'
import SupportView from './support-view'

export const metadata: Metadata = {
  title: 'Supporto',
  description: 'Trova risposte immediate nelle nostre guide o contatta il nostro team di supporto dedicato.'
}

const SupportPage = () => {
  return (
    <SupportView />
  )
}

export default SupportPage