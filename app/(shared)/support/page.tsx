import { Metadata } from 'next'
import SupportView from './support-view'
import { getArticles, getDocNav } from '@/utils/sanity/queries'

export const metadata: Metadata = {
  title: 'Supporto',
  description: 'Trova risposte immediate nelle nostre guide o contatta il nostro team di supporto dedicato.'
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