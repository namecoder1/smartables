import { Metadata } from 'next'
import { getArticles, SanityArticleCard } from '@/utils/sanity/queries'
import BlogView from './blog-view'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Blog | Smartables',
  description: 'Consigli, news e approfondimenti sulla gestione intelligente del tuo ristorante.',
}

const BlogPage = async () => {
  const articles = await getArticles()
  return <BlogView articles={articles} />
}

export default BlogPage
