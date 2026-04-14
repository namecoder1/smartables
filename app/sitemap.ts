import { MetadataRoute } from "next";
import { getArticles, getCaseStudies, getDocNav, getPaginatedVersions } from "@/utils/sanity/queries";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://smartables.it";

function entry(
  path: string,
  priority: number = 0.7,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "weekly"
): MetadataRoute.Sitemap[number] {
  return { url: `${BASE}${path}`, lastModified: new Date(), changeFrequency, priority };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ─── Static routes ───────────────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    entry("/", 1.0, "daily"),
    entry("/pricing", 0.9, "weekly"),
    entry("/solutions", 0.9, "weekly"),
    entry("/solutions/integrazione-ai", 0.8),
    entry("/solutions/gestione-prenotazioni", 0.8),
    entry("/solutions/gestione-sala", 0.8),
    entry("/solutions/crm", 0.8),
    entry("/solutions/menu-digitale", 0.8),
    entry("/solutions/analytics", 0.8),
    entry("/calculator", 0.7),
    entry("/blog", 0.8, "daily"),
    entry("/case-studies", 0.8, "weekly"),
    entry("/docs", 0.8, "weekly"),
    entry("/release-notes", 0.7, "weekly"),
    entry("/support", 0.7),
    entry("/legal/privacy-policy", 0.3, "yearly"),
    entry("/legal/terms-&-conditions", 0.3, "yearly"),
  ];

  // ─── Dynamic: blog articles ──────────────────────────────────────────────
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const articles = await getArticles();
    blogRoutes = articles.map((a) => ({
      ...entry(`/blog/${a.slug}`, 0.7, "monthly"),
      lastModified: a.publishedAt ? new Date(a.publishedAt) : new Date(),
    }));
  } catch { /* skip if Sanity unavailable at build time */ }

  // ─── Dynamic: case studies ───────────────────────────────────────────────
  let caseStudyRoutes: MetadataRoute.Sitemap = [];
  try {
    const caseStudies = await getCaseStudies();
    caseStudyRoutes = caseStudies.map((cs) => ({
      ...entry(`/case-studies/${cs.slug}`, 0.7, "monthly"),
      lastModified: cs.publishedAt ? new Date(cs.publishedAt) : new Date(),
    }));
  } catch { /* skip */ }

  // ─── Dynamic: docs ───────────────────────────────────────────────────────
  let docsRoutes: MetadataRoute.Sitemap = [];
  try {
    const sections = await getDocNav();
    for (const section of sections) {
      for (const topic of section.topics) {
        docsRoutes.push(entry(`/docs/${section.slug}/${topic.slug}`, 0.6, "monthly"));
      }
    }
  } catch { /* skip */ }

  // ─── Dynamic: release notes ──────────────────────────────────────────────
  let releaseRoutes: MetadataRoute.Sitemap = [];
  try {
    const versions = await getPaginatedVersions();
    releaseRoutes = (versions as { slug: string }[]).map((v) =>
      entry(`/release-notes/${v.slug}`, 0.5, "yearly")
    );
  } catch { /* skip */ }

  return [...staticRoutes, ...blogRoutes, ...caseStudyRoutes, ...docsRoutes, ...releaseRoutes];
}
