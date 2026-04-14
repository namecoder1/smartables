import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Note di Rilascio',
  description: 'Scopri le ultime funzionalità, miglioramenti e correzioni di Smartables. Tieniti aggiornato su ogni nuova versione della piattaforma.',
  alternates: { canonical: '/release-notes' },
  openGraph: {
    title: 'Note di Rilascio | Smartables',
    description: 'Scopri le ultime funzionalità, miglioramenti e correzioni di Smartables.',
    type: 'website',
    images: [
      {
        url: "/og-image.png",
        width: 1280,
        height: 800,
        alt: "Smartables - Note di Rilascio",
      },
    ],
  },
}

import { getPaginatedVersions, SanityVersion } from '@/utils/sanity/queries'
import ReleaseView from './release-view'


const ReleasesPage = async () => {
  const [paginatedVersions] = await Promise.all([
    getPaginatedVersions()
  ])

  return (
    <ReleaseView versions={paginatedVersions} />
  )
}

export default ReleasesPage