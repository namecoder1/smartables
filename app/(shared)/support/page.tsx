import { Metadata } from 'next'
import SupportView from './support-view'
import { getArticles, getDocNav } from '@/utils/sanity/queries'

export const metadata: Metadata = {
  title: 'Supporto',
  description: 'Trova risposte immediate nelle nostre guide o contatta il nostro team di supporto dedicato. Siamo disponibili via chat, email e telefono.',
  alternates: { canonical: '/support' },
  openGraph: {
    title: 'Supporto | Smartables',
    description: 'Trova risposte immediate nelle nostre guide o contatta il nostro team di supporto dedicato.',
    type: 'website',
    images: [
      {
        url: "/og-image.png",
        width: 1280,
        height: 800,
        alt: "Smartables - Supporto",
      },
    ],
  },
}

const SupportPage = async () => {
  const [blogArticles, docSections] = await Promise.all([
    getArticles(),
    getDocNav()
  ])

  return (
    <SupportView articles={blogArticles} sections={docSections as any} />
  )
}

export default SupportPage