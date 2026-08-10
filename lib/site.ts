/**
 * Falling back to localhost silently in production would produce a
 * well-formed but useless sitemap/robots output instead of a build failure,
 * so unset is only tolerated outside production.
 */
function resolveSiteUrl(): string {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  if (value) return value;

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL must be set in production (see .env.example).");
  }

  return "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();
