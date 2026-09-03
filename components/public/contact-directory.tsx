import { CatalogEmpty } from "@/components/public/catalog-empty";
import { DirectoryHero } from "@/components/public/directory-hero";
import { GoldRule } from "@/components/public/gold-rule";
import { GhlFormEmbed } from "@/components/public/ghl-form-embed";
import { telHref, websiteHref, websiteLabel } from "@/components/public/profile-contact";
import { whatsappHref } from "@/lib/whatsapp-href";
import { WhatsAppMark } from "@/components/public/whatsapp-mark";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

type SocialKey = "facebook" | "instagram" | "linkedin" | "twitter";

const SOCIAL_ORDER: SocialKey[] = ["facebook", "instagram", "linkedin", "twitter"];

export function ContactDirectory({
  title,
  intro,
  email,
  phone,
  whatsapp,
  socialLinks,
  formUrl,
  emailLabel,
  phoneLabel,
  whatsappLabel,
  detailsLabel,
  detailsTitle,
  detailsLead,
  formTitle,
  formLead,
  formEmpty,
  socialLabels,
  whatsappMessage,
}: {
  title: string;
  intro: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  socialLinks?: Partial<Record<SocialKey, string>> | null;
  formUrl?: string | null;
  emailLabel: string;
  phoneLabel: string;
  whatsappLabel: string;
  detailsLabel: string;
  detailsTitle: string;
  detailsLead?: string;
  formTitle: string;
  formLead?: string;
  formEmpty: string;
  socialLabels: Record<SocialKey, string>;
  whatsappMessage?: string;
}) {
  const phoneHref = phone ? telHref(phone) : null;
  const whatsappLink = whatsapp ? whatsappHref(whatsapp, whatsappMessage) : null;
  const socials = SOCIAL_ORDER.flatMap((key) => {
    const raw = socialLinks?.[key];
    if (!raw) return [];
    const href = websiteHref(raw);
    if (!href) return [];
    return [{ key, href, label: socialLabels[key], value: websiteLabel(href, raw) }];
  });
  const hasDetails = Boolean(email || phoneHref || whatsappLink || socials.length > 0);

  return (
    <main id="main">
      <DirectoryHero title={title} intro={intro} countLabel={null} headingId="contact-heading" />

      <section
        aria-label={detailsLabel}
        className={cn("bg-background py-16 sm:py-20 lg:py-24", publicGutter)}
      >
        <div
          className={cn(
            hasDetails
              ? "grid gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-16 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] xl:gap-20"
              : "mx-auto w-full max-w-3xl",
          )}
        >
          {hasDetails ? (
            <div>
              <h2
                id="contact-details-heading"
                className="font-heading text-2xl font-semibold tracking-tight text-pretty text-foreground sm:text-3xl"
              >
                {detailsTitle}
              </h2>
              <GoldRule draw className="mt-4 w-10" />
              {detailsLead ? (
                <p className="mt-4 max-w-prose text-sm leading-relaxed text-pretty text-foreground/80 sm:text-base">
                  {detailsLead}
                </p>
              ) : null}
              <dl className="mt-6 grid grid-cols-2 gap-x-4 lg:grid-cols-1">
              {email ? (
                <div className="min-w-0 border-t border-secondary/50 py-4 lg:py-5 lg:first:border-t-0 lg:first:pt-0">
                  <dd className="font-heading text-sm font-semibold tracking-tight text-pretty sm:text-base lg:text-2xl">
                    <a
                      href={`mailto:${email}`}
                      className="text-primary break-all hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {email}
                    </a>
                  </dd>
                  <dt className="mt-1.5 text-xs text-foreground/70 sm:text-sm lg:mt-2">{emailLabel}</dt>
                </div>
              ) : null}
              {phone && phoneHref ? (
                <div className="min-w-0 border-t border-secondary/50 py-4 lg:py-5 lg:first:border-t-0 lg:first:pt-0">
                  <dd className="font-heading text-sm font-semibold tracking-tight text-pretty sm:text-base lg:text-2xl">
                    <a
                      href={phoneHref}
                      className="text-primary break-all hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {phone}
                    </a>
                  </dd>
                  <dt className="mt-1.5 text-xs text-foreground/70 sm:text-sm lg:mt-2">{phoneLabel}</dt>
                </div>
              ) : null}
              {whatsapp && whatsappLink ? (
                <div className="min-w-0 border-t border-secondary/50 py-4 lg:py-5 lg:first:border-t-0 lg:first:pt-0">
                  <dd className="font-heading text-sm font-semibold tracking-tight text-pretty sm:text-base lg:text-2xl">
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary break-all hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {whatsapp}
                    </a>
                  </dd>
                  <dt className="mt-1.5 flex items-center gap-2 text-xs text-foreground/70 sm:text-sm lg:mt-2">
                    <WhatsAppMark />
                    {whatsappLabel}
                  </dt>
                </div>
              ) : null}
              {socials.map((row) => (
                <div key={row.key} className="min-w-0 border-t border-secondary/50 py-4 lg:py-5 lg:first:border-t-0 lg:first:pt-0">
                  <dd className="font-heading text-sm font-semibold tracking-tight text-pretty sm:text-base lg:text-2xl">
                    <a
                      href={row.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary break-all hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {row.value}
                    </a>
                  </dd>
                  <dt className="mt-1.5 text-xs text-foreground/70 sm:text-sm lg:mt-2">{row.label}</dt>
                </div>
              ))}
            </dl>
            </div>
          ) : null}

          {formUrl ? (
            <div>
              <h2 className="font-heading text-2xl font-semibold tracking-tight text-pretty text-foreground sm:text-3xl">
                {formTitle}
              </h2>
              <GoldRule draw className="mt-4 w-10" />
              {formLead ? (
                <p className="mt-4 max-w-prose text-sm leading-relaxed text-pretty text-foreground/80 sm:text-base">
                  {formLead}
                </p>
              ) : null}
              <div className="mt-6">
                <GhlFormEmbed src={formUrl} title={formTitle} />
              </div>
            </div>
          ) : (
            <CatalogEmpty>{formEmpty}</CatalogEmpty>
          )}
        </div>
      </section>
    </main>
  );
}
