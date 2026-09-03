const GHL_HOST_SUFFIXES = [
  "leadconnectorhq.com",
  "msgsndr.com",
  "gohighlevel.com",
  "quicktalkbusiness.com",
] as const;

function isAllowedGhlHost(hostname: string) {
  const host = hostname.toLowerCase();
  return GHL_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

function candidateUrl(value: string) {
  const straight = value.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
  const iframeSrc = /<iframe\b[\s\S]*?\bsrc\s*=\s*["']([^"']+)["']/i.exec(straight);
  if (iframeSrc?.[1]) return iframeSrc[1].trim();
  const widget = /https:\/\/[^\s"'<>]+\/widget\/form\/[^\s"'<>]+/i.exec(straight);
  if (widget) return widget[0].replace(/[.,);]+$/u, "");
  return straight.trim();
}

/** Returns a canonical https GHL form URL, or null if it must not be embedded. */
export function safeGhlFormUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(candidateUrl(trimmed));
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    if (!isAllowedGhlHost(url.hostname)) return null;
    if (!url.pathname.includes("/widget/form/") && !url.pathname.includes("/form/")) return null;
    return url.href;
  } catch {
    return null;
  }
}
