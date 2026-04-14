import { Metadata } from 'next'
import { getArticles, SanityArticleCard } from '@/utils/sanity/queries'
import BlogView from './blog-view'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Consigli, news e approfondimenti sulla gestione intelligente del tuo ristorante. Strategie, casi studio e aggiornamenti dal mondo della ristorazione.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog | Smartables',
    description: 'Consigli, news e approfondimenti sulla gestione intelligente del tuo ristorante.',
    type: 'website',
    images: [
      {
        url: "/og-image.png",
        width: 1280,
        height: 800,
        alt: "Smartables - Blog",
      },
    ],
  },
}

const BlogPage = async () => {
  const articles = await getArticles()
  return <BlogView articles={articles} />
}

export default BlogPage
