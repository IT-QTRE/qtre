function trimOrigin(value: string) {
  return value.replace(/\/+$/, "");
}

function httpsOrigin(hostOrUrl: string) {
  const trimmed = hostOrUrl.trim();
  if (!trimmed) return "";
  return trimOrigin(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
}

/**
 * Prefer an explicit public origin. On Vercel, fall back to the project
 * production host, then the deployment host, so a first production build
 * does not die before env is wired. Local `next build` still needs
 * NEXT_PUBLIC_SITE_URL in `.env.local` (see `.env.example`).
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return trimOrigin(explicit);

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProduction) return httpsOrigin(vercelProduction);

  const vercelDeployment = process.env.VERCEL_URL?.trim();
  if (vercelDeployment) return httpsOrigin(vercelDeployment);

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL must be set in production (see .env.example).");
  }

  return "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();
