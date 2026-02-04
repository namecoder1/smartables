import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://smartables.it";

  const routes = [
    "",
    "/pricing",
    "/support",
    "/solutions",
    "/solutions/crm",
    "/solutions/gestione-prenotazioni",
    "/solutions/gestione-sala",
    "/solutions/integrazione-ai",
    "/legal/privacy-policy",
    "/legal/terms-&-conditions",
    "/login",
    "/register",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  return routes;
}
