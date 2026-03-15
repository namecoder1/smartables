import PageWrapper from '@/components/private/page-wrapper'
import { getAuthContext } from '@/lib/auth'
import { Metadata } from 'next'
import GeneralView from './general-view'

export const metadata: Metadata = {
  title: "Impostazioni Generali",
  description: "Gestisci le impostazioni generali della tua organizzazione.",
}

const GeneralSettingsPage = async () => {
  const { organization } = await getAuthContext()

  // Cosa gestiamo in questa pagina
  // - dettagli dell'organizzazione (slug, name, billing_email)
  // - dettagli transazioni 

  console.log(organization)

  return (
    <PageWrapper>
      <div className='flex flex-col'>
        <h1 className="text-3xl font-bold tracking-tight">Impostazioni generali</h1>
        <p className="text-muted-foreground">Gestisci le tue preferenze, dati personali e la tua esperienza su Smartables.</p>
      </div>
      <GeneralView
        organization={organization}
      />
    </PageWrapper>
  )
}

export default GeneralSettingsPage