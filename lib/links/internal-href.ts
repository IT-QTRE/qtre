export function isInternalHref(href: string, siteOrigin: string): boolean {
  const trimmed = href.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  try {
    const url = new URL(trimmed);
    const site = new URL(siteOrigin);
    return url.origin === site.origin;
  } catch {
    return false;
  }
}

export function linkRelAndTarget(href: string, siteOrigin: string): { target?: string; rel?: string } {
  if (isInternalHref(href, siteOrigin)) return {};
  return { target: "_blank", rel: "noopener noreferrer" };
}
