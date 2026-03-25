import { createAdminClient } from '@/utils/supabase/admin'
import HomeView from './home-view'
import { getFaqsByTopic } from '@/utils/sanity/queries'
import * as Sentry from '@sentry/nextjs'


const HomePage = async () => {
  const supabase = createAdminClient()
  const setupFee = process.env.NEXT_PUBLIC_ENABLE_SETUP_FEE === "true" ? false : true
  const { count: reservationCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })

  const [landingFaqs] = await Promise.all([
    getFaqsByTopic('landing')
  ])

  Sentry.captureException(new Error("TestGlitchTip"))

  return (
    <HomeView reservations={reservationCount} setupFee={setupFee} faqs={landingFaqs} />
  )
}

export default HomePage