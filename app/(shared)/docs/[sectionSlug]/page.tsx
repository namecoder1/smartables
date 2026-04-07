import { notFound, redirect } from 'next/navigation'
import { getDocNav } from '@/utils/sanity/queries'

type Props = { params: Promise<{ sectionSlug: string }> }

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
