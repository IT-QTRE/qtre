import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // No trailing slash: "/admin/" would not match the exact path "/admin".
      disallow: ["/admin", "/sign-in", "/sign-up", "/api", "/preview"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
