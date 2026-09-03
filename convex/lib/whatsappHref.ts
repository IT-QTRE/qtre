const WHATSAPP_HOSTS = new Set([
  "wa.me",
  "api.whatsapp.com",
  "web.whatsapp.com",
  "www.whatsapp.com",
  "whatsapp.com",
]);

function digitsForWaMe(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withPrefix = trimmed.startsWith("00") ? trimmed.slice(2) : trimmed;
  const digits = withPrefix.replace(/[^\d]/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

/** Returns a https://wa.me/… or official WhatsApp URL, or null. Optional `text` prefills the chat. */
export function whatsappHref(value: string | null | undefined, text?: string): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  let href: string | null = null;

  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.includes(".")) {
    try {
      const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
      if (url.protocol !== "https:") return null;
      if (url.username || url.password) return null;
      if (!WHATSAPP_HOSTS.has(url.hostname.toLowerCase())) return null;
      href = url.href;
    } catch {
      return null;
    }
  } else {
    const digits = digitsForWaMe(trimmed);
    href = digits ? `https://wa.me/${digits}` : null;
  }

  if (!href) return null;
  const message = text?.trim();
  if (!message) return href;

  const url = new URL(href);
  url.searchParams.set("text", message);
  return url.href;
}
