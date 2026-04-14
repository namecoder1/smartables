import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://smartables.it";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/home",
          "/onboarding",
          "/login",
          "/register",
          "/manage",
          "/order/",
          "/p/",
          "/m/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
