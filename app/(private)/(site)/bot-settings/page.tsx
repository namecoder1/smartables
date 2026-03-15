import PageWrapper from '@/components/private/page-wrapper'
import { Metadata } from 'next'
import { getFaqsByTopic } from '@/utils/sanity/queries'
import BotView from './bot-view'

export const metadata: Metadata = {
  title: "Gestione WhatsApp",
  description: "Gestisci il profilo WhatsApp, le richieste di richiamata e i contatti automatici.",
}

const WhatsappPage = async () => {
  const [whatsappFaqs] = await Promise.all([
    getFaqsByTopic('whatsapp'),
  ])

  return (
    <PageWrapper>
      <div className="flex justify-between items-end">
        <div className='flex flex-col gap-1'>
          <h1 className="text-3xl font-bold tracking-tight">
            Impostazioni Bot
          </h1>
          <p className="text-muted-foreground">
            Gestisci le impostazioni del tuo bot Whatsapp, le richieste di richiamata e i contatti automatici.
          </p>
        </div>
      </div>
      <BotView faqs={whatsappFaqs} />
    </PageWrapper>
  )
}

export default WhatsappPage