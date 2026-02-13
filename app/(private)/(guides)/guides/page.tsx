import PageWrapper from "@/components/private/page-wrapper"
import { Metadata } from "next"
import { getGuidesGroupedByCategory } from "@/utils/sanity/queries"
import GuidesList from "@/components/private/guides/guides-list"

export const metadata: Metadata = {
  title: "Guide pratiche",
  description: "Scopri come usare Smartables al meglio con le nostre guide passo-passo.",
}

export const revalidate = 60

export default async function GuidesPage() {
  const categories = await getGuidesGroupedByCategory()

  return (
    <PageWrapper>
      <GuidesList categories={categories} />
    </PageWrapper>
  )
}