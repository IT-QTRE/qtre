export function websiteHref(value: string) {
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

export function websiteLabel(href: string, fallback: string) {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return fallback;
  }
}

export function telHref(value: string) {
  const digits = value.replace(/[^\d+]/g, "");
  return digits.length > 0 ? `tel:${digits}` : null;
}

export function ProfileContact({
  website,
  email,
  phone,
  websiteLabel: websiteFieldLabel,
  emailLabel,
  phoneLabel,
}: {
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  websiteLabel: string;
  emailLabel: string;
  phoneLabel: string;
}) {
  const rows: { key: string; label: string; value: string; href: string }[] = [];
  if (website) {
    const href = websiteHref(website);
    if (href) rows.push({ key: "website", label: websiteFieldLabel, value: websiteLabel(href, website), href });
  }
  if (email) rows.push({ key: "email", label: emailLabel, value: email, href: `mailto:${email}` });
  if (phone) {
    const href = telHref(phone);
    if (href) rows.push({ key: "phone", label: phoneLabel, value: phone, href });
  }
  if (rows.length === 0) return null;

  return (
    <dl className="mt-8 flex flex-col md:flex-row md:flex-wrap">
      {rows.map((row) => (
        <div
          key={row.key}
          className="border-s-2 border-secondary py-1 ps-5 not-last:pb-6 md:min-w-36 md:flex-1 md:border-s-0 md:border-t-2 md:py-0 md:ps-0 md:pt-5 md:pe-8 md:not-last:pb-0"
        >
          <dd className="font-heading text-xl font-semibold tracking-tight text-pretty sm:text-2xl">
            <a
              href={row.href}
              className="text-primary break-all hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {row.value}
            </a>
          </dd>
          <dt className="mt-2 text-sm text-muted-foreground">{row.label}</dt>
        </div>
      ))}
    </dl>
  );
}
