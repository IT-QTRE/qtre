import { telHref, websiteHref, websiteLabel } from "@/components/public/profile-contact";

export function DirectoryContact({
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
    <dl className="border-t border-secondary bg-muted px-6 py-7 sm:px-8 sm:py-8">
      {rows.map((row) => (
        <div key={row.key} className="border-t border-secondary/50 py-5 first:border-t-0 first:pt-0 last:pb-0">
          <dd className="font-heading text-xl font-semibold tracking-tight text-pretty sm:text-2xl">
            <a
              href={row.href}
              className="text-primary break-all hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {row.value}
            </a>
          </dd>
          <dt className="mt-2 text-sm text-foreground/70">{row.label}</dt>
        </div>
      ))}
    </dl>
  );
}

export { DirectoryContact as DeveloperContact };
