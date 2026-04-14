import CalculatorView from './calculator-view'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calcolatore ROI Ristorante',
  description: 'Scopri quante prenotazioni e quanto fatturato stai perdendo ogni mese. Calcola il ritorno sull\'investimento di Smartables per il tuo ristorante in pochi secondi.',
  alternates: { canonical: '/calculator' },
  openGraph: {
    title: 'Calcolatore ROI Ristorante | Smartables',
    description: "Scopri quante prenotazioni stai perdendo ogni mese e calcola il ROI di Smartables per il tuo locale.",
    type: 'website',
    images: [
      {
        url: "/og-image.png",
        width: 1280,
        height: 800,
        alt: "Smartables - Calcolatore ROI Ristorante",
      },
    ],
  },
}

const CalculatorPage = () => {
  return (
    <CalculatorView />
  )
}

export default CalculatorPage