import CalculatorView from './calculator-view'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calcolatore Performance',
  description: 'Calcolatore per stimare le performance del tuo locale in base a vari parametri come il numero di clienti, il fatturato e le spese.',
}

const CalculatorPage = () => {
  return (
    <CalculatorView />
  )
}

export default CalculatorPage