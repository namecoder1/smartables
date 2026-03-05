import PageWrapper from '@/components/private/page-wrapper'
import WhatsappView from './whatsapp-view'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Gestione WhatsApp",
  description: "Gestisci il profilo WhatsApp, le richieste di richiamata e i contatti automatici.",
}

const WhatsappPage = () => {
  return (
    <PageWrapper>
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestione WhatsApp
          </h1>
          <p className="text-muted-foreground">
            Gestisci il profilo WhatsApp, le richieste di richiamata e i
            contatti automatici.
          </p>
        </div>
      </div>
      <WhatsappView />
    </PageWrapper>
  )
}

export default WhatsappPage