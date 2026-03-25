import { Metadata } from 'next'
import PricingView from './pricing-view'

export const metadata: Metadata = {
  title: 'Prezzi'
}

const PricingPage = () => {
  return (
    <PricingView />
  )
}

export default PricingPage