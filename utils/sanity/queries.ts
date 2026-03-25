import { sanityClient } from "./client";

// Types
export type SanityGuide = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  icon: string;
  minutes: number;
  order: number;
  category: {
    _id: string;
    title: string;
    slug: string;
    description: string;
    order: number;
  };
  tags: { _id: string; title: string; slug: string }[];
  content: any[];
};

export type GuidesByCategory = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  order: number;
  guides: SanityGuide[];
};

// Get all guides grouped by category (for the list page)
export async function getGuidesGroupedByCategory(): Promise<
  GuidesByCategory[]
> {
  const guides = await sanityClient.fetch<SanityGuide[]>(`
    *[_type == "guide"] | order(order asc) {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      icon,
      minutes,
      order,
      category->{
        _id,
        title,
        "slug": slug.current,
        description,
        order
      },
      tags[]->{
        _id,
        title,
        "slug": slug.current
      }
    }
  `);

  // Group by category
  const categoryMap = new Map<string, GuidesByCategory>();

  for (const guide of guides) {
    if (!guide.category) continue;
    const catId = guide.category._id;

    if (!categoryMap.has(catId)) {
      categoryMap.set(catId, {
        ...guide.category,
        guides: [],
      });
    }
    categoryMap.get(catId)!.guides.push(guide);
  }

  // Sort categories by order
  return Array.from(categoryMap.values()).sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
}

// Get a single guide by slug (for the detail page)
export async function getGuideBySlug(
  slug: string,
): Promise<SanityGuide | null> {
  const guide = await sanityClient.fetch<SanityGuide | null>(
    `
    *[_type == "guide" && slug.current == $slug][0] {
      'id': _id,
      title,
      "slug": slug.current,
      excerpt,
      icon,
      minutes,
      order,
      category->{
        _id,
        title,
        "slug": slug.current,
        description,
        order
      },
      tags[]->{
        _id,
        title,
        "slug": slug.current
      },
      content
    }
  `,
    { slug },
  );

  return guide;
}

// Get adjacent guides for prev/next navigation
export async function getAdjacentGuides(
  currentSlug: string,
  categoryId: string,
) {
  const guides = await sanityClient.fetch<
    { title: string; slug: string; order: number }[]
  >(
    `
    *[_type == "guide" && category._ref == $categoryId] | order(order asc) {
      title,
      "slug": slug.current,
      order
    }
  `,
    { categoryId },
  );

  const currentIndex = guides.findIndex((g) => g.slug === currentSlug);

  return {
    prev: currentIndex > 0 ? guides[currentIndex - 1] : null,
    next: currentIndex < guides.length - 1 ? guides[currentIndex + 1] : null,
  };
}

// Get suggested guides (all guides except current, for sidebar)
export async function getSuggestedGuides(currentSlug: string) {
  return sanityClient.fetch<
    {
      _id: string;
      title: string;
      slug: string;
      icon: string;
      minutes: number;
      excerpt: string;
      category: { title: string };
    }[]
  >(
    `
    *[_type == "guide" && slug.current != $currentSlug] | order(order asc) {
      'id': _id,
      title,
      "slug": slug.current,
      icon,
      minutes,
      excerpt,
      category->{ title }
    }
  `,
    { currentSlug },
  );
}

// Get featured guides (for the dashboard resources section)
export async function getFeaturedGuides(limit: number = 4) {
  return sanityClient.fetch<
    {
      _id: string;
      title: string;
      slug: string;
      icon: string;
      minutes: number;
      excerpt: string;
      category: { title: string };
    }[]
  >(
    `
    *[_type == "guide"] | order(order asc)[0...$limit] {
      'id': _id,
      title,
      "slug": slug.current,
      icon,
      minutes,
      excerpt,
      category->{ title }
    }
  `,
    { limit },
  );
}

// ─── FAQ ───────────────────────────────────────────────────────

export type SanityFaq = {
  id: string;
  question: string;
  answer: string;
  topic: string;
  order: number;
};

export type FaqsByTopic = {
  topic: string;
  label: string;
  faqs: SanityFaq[];
};

const topicLabels: Record<string, string> = {
  billing: "Fatturazione",
  reservations: "Prenotazioni",
  whatsapp: "WhatsApp & AI",
  menus: "Menu",
  settings: "Impostazioni",
  general: "Generale",
};

// Get FAQs filtered by topic
export async function getFaqsByTopic(topic: string): Promise<SanityFaq[]> {
  return sanityClient.fetch<SanityFaq[]>(
    `
    *[_type == "faq" && topic == $topic] | order(order asc) {
      'id': _id,
      question,
      answer,
      topic,
      order
    }
  `,
    { topic },
  );
}

// Get all FAQs grouped by topic (for the full FAQs page)
export async function getAllFaqsGroupedByTopic(): Promise<FaqsByTopic[]> {
  const faqs = await sanityClient.fetch<SanityFaq[]>(`
    *[_type == "faq"] | order(order asc) {
      'id': _id,
      question,
      answer,
      topic,
      order
    }
  `);

  const topicMap = new Map<string, FaqsByTopic>();

  for (const faq of faqs) {
    if (!topicMap.has(faq.topic)) {
      topicMap.set(faq.topic, {
        topic: faq.topic,
        label: topicLabels[faq.topic] || faq.topic,
        faqs: [],
      });
    }
    topicMap.get(faq.topic)!.faqs.push(faq);
  }

  // Order topics: general first, then alphabetical
  const order = [
    "general",
    "reservations",
    "billing",
    "whatsapp",
    "menus",
    "settings",
  ];
  return Array.from(topicMap.values()).sort(
    (a, b) => order.indexOf(a.topic) - order.indexOf(b.topic),
  );
}

// ─── VERSIONS ───────────────────────────────────────────────────────

export async function getPaginatedVersions() {
  return sanityClient.fetch(
    `
    *[_type == "version" ] | order(_createdAt desc) {
      'id': _id,
      'createdAt': _createdAt,
      title,
      'slug': slug.current,
      version,
      excerpt,
      content
    }
    `
  )
}

export async function getVersionBySlug(slug: string): Promise<SanityVersion | null> {
  const results = await sanityClient.fetch(
    `
    *[_type == "version" && slug.current == $slug] {
      'id': _id,
      'createdAt': _createdAt,
      title,
      'slug': slug.current,
      version,
      excerpt,
      content
    }
    `,
    { slug }
  )
  return results?.[0] ?? null
}

export async function getAdjacentVersions(slug: string): Promise<{ prev: Pick<SanityVersion, 'title' | 'slug' | 'version'> | null; next: Pick<SanityVersion, 'title' | 'slug' | 'version'> | null }> {
  const all: SanityVersion[] = await sanityClient.fetch(
    `*[_type == "version"] | order(order desc) { 'id': _id, title, 'slug': slug.current, version, 'createdAt': _createdAt, excerpt, content }`
  )
  const idx = all.findIndex(v => v.slug === slug)
  return {
    prev: idx < all.length - 1 ? { title: all[idx + 1].title, slug: all[idx + 1].slug, version: all[idx + 1].version } : null,
    next: idx > 0 ? { title: all[idx - 1].title, slug: all[idx - 1].slug, version: all[idx - 1].version } : null,
  }
}

export type SanityVersion = {
  id: string;
  createdAt: string;
  title: string;
  slug: string;
  version: string;
  excerpt: string;
  content: any[];
}

// ─── ARTICLES (BLOG) ─────────────────────────────────────────────────────────

export type SanityArticle = {
  id: string;
  title: string;
  slug: string;
  publishedAt: string;
  category: string;
  tags: string[];
  featured: boolean;
  author: string;
  authorRole: string;
  readingTime: number;
  excerpt: string;
  image: { url: string; alt?: string } | null;
  content: any[];
  seo: { metaTitle?: string; metaDescription?: string } | null;
};

export type SanityArticleCard = Omit<SanityArticle, 'content' | 'seo'>;

const ARTICLE_CARD_PROJECTION = `
  'id': _id,
  title,
  'slug': slug.current,
  publishedAt,
  category,
  tags,
  featured,
  author,
  authorRole,
  readingTime,
  excerpt,
  'image': image { 'url': asset->url, alt },
`;

export async function getArticles(): Promise<SanityArticleCard[]> {
  return sanityClient.fetch(`
    *[_type == "article"] | order(featured desc, publishedAt desc) {
      ${ARTICLE_CARD_PROJECTION}
    }
  `);
}

export async function getArticleBySlug(slug: string): Promise<SanityArticle | null> {
  const results = await sanityClient.fetch(
    `*[_type == "article" && slug.current == $slug][0] {
      ${ARTICLE_CARD_PROJECTION}
      content,
      seo,
    }`,
    { slug },
  );
  return results ?? null;
}

export async function getAdjacentArticles(slug: string): Promise<{
  prev: Pick<SanityArticleCard, 'title' | 'slug'> | null;
  next: Pick<SanityArticleCard, 'title' | 'slug'> | null;
}> {
  const all: Pick<SanityArticleCard, 'title' | 'slug'>[] = await sanityClient.fetch(
    `*[_type == "article"] | order(publishedAt desc) { title, 'slug': slug.current }`,
  );
  const idx = all.findIndex((a) => a.slug === slug);
  return {
    prev: idx > 0 ? all[idx - 1] : null,
    next: idx < all.length - 1 ? all[idx + 1] : null,
  };
}

// ─── DOCS ────────────────────────────────────────────────────────────────────

export type DocChapter = {
  title: string;
  anchor: string;
  content: any[];
};

export type DocTopic = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  order: number;
  hasChapters: boolean;
  content: any[];
  chapters: DocChapter[];
  section: {
    _id: string;
    title: string;
    slug: string;
  };
};

// Versione leggera usata nella sidebar (senza content)
export type DocTopicNav = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  order: number;
  hasChapters: boolean;
  chapters: Pick<DocChapter, "title" | "anchor">[];
};

export type DocSection = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  topics: DocTopicNav[];
};

// Navigazione completa (sezioni + topics + anchors, senza content)
export async function getDocNav(): Promise<DocSection[]> {
  return sanityClient.fetch<DocSection[]>(`
    *[_type == "docSection"] | order(order asc) {
      _id,
      title,
      "slug": slug.current,
      description,
      icon,
      order,
      "topics": *[_type == "docTopic" && references(^._id)] | order(order asc) {
        _id,
        title,
        "slug": slug.current,
        excerpt,
        order,
        "hasChapters": count(chapters) > 0,
        "chapters": chapters[] { title, "anchor": anchor.current }
      }
    }
  `);
}

// Singolo topic con contenuto completo
export async function getDocTopicBySlug(slug: string): Promise<DocTopic | null> {
  return sanityClient.fetch<DocTopic | null>(
    `
    *[_type == "docTopic" && slug.current == $slug][0] {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      order,
      content,
      "hasChapters": count(chapters) > 0,
      chapters[] { title, "anchor": anchor.current, content },
      "section": section->{ _id, title, "slug": slug.current }
    }
  `,
    { slug },
  );
}

// Topic precedente e successivo nella stessa sezione (per la navigazione prev/next)
export async function getAdjacentDocTopics(
  currentSlug: string,
  sectionId: string,
) {
  const topics = await sanityClient.fetch<
    { title: string; slug: string; order: number }[]
  >(
    `
    *[_type == "docTopic" && section._ref == $sectionId] | order(order asc) {
      title,
      "slug": slug.current,
      order
    }
  `,
    { sectionId },
  );

  const currentIndex = topics.findIndex((t) => t.slug === currentSlug);

  return {
    prev: currentIndex > 0 ? topics[currentIndex - 1] : null,
    next: currentIndex < topics.length - 1 ? topics[currentIndex + 1] : null,
  };
}