import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'
import { getDocNav } from '@/utils/sanity/queries'

type Props = { params: Promise<{ sectionSlug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sectionSlug } = await params
  const sections = await getDocNav()
  const section = sections.find((s) => s.slug === sectionSlug)
  return {
    title: section ? `${section.title} | Documentazione Smartables` : 'Documentazione | Smartables',
    robots: { index: false, follow: true }, // redirects immediately
  }
}

export default async function DocSectionPage({ params }: Props) {
  const { sectionSlug } = await params
  const sections = await getDocNav()
  const section = sections.find((s) => s.slug === sectionSlug)

  if (!section) notFound()

  const firstTopic = section.topics[0]
  if (firstTopic) {
    redirect(`/docs/${section.slug}/${firstTopic.slug}`)
  }

  notFound()
}
