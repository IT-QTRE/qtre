import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { catalogAbsoluteUrl } from "@/lib/seo/catalog";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: `${siteUrl}/en`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...routing.locales.map((locale) => ({
      url: catalogAbsoluteUrl(locale, "sale"),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...routing.locales.flatMap((locale) => [
      {
        url: `${siteUrl}/${locale}/privacy`,
        lastModified: now,
        changeFrequency: "yearly" as const,
        priority: 0.3,
      },
      {
        url: `${siteUrl}/${locale}/terms`,
        lastModified: now,
        changeFrequency: "yearly" as const,
        priority: 0.3,
      },
    ]),
  ];
}
