import InboxView from './inbox-view'
import { getAuthContext } from '@/lib/auth'
import { Metadata } from 'next'
import { getFaqsByTopic } from '@/utils/sanity/queries'

export const metadata: Metadata = {
  title: "Il tuo Inbox",
  description: "Gestisci le conversazioni WhatsApp e prendi il controllo del Bot AI.",
  openGraph: {
    title: "Il tuo Inbox",
    description: "Gestisci le conversazioni WhatsApp e prendi il controllo del Bot AI.",
  }
}

const InboxPage = async () => {
  const { organizationId } = await getAuthContext()

  const [inboxFaqs] = await Promise.all([
    getFaqsByTopic('inbox')
  ])

  return (
    <InboxView organizationId={organizationId} faqs={inboxFaqs} />
  )
}

export default InboxPage