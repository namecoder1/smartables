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
      _id,
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
      _id,
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
  _id: string;
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
      _id,
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
      _id,
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
