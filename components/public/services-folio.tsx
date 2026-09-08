import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ServicesGroupInquiry, type GroupDeskItem } from "@/components/public/services-group-inquiry";
import { ServicesIdentityHero } from "@/components/public/services-identity-hero";
import { VisaBand } from "@/components/public/visa-band";
import { Link } from "@/i18n/navigation";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

type CatalogItem = {
  name: string;
  body: string;
  href: string;
};

export async function ServicesFolio({
  label,
  identityTitle,
  intro,
  catalogTitle,
  catalogItems,
  wrapItems,
  visaItems,
  licenseItems,
  contactLabel,
}: {
  label: string;
  identityTitle: string;
  intro: string;
  catalogTitle: string;
  catalogItems: CatalogItem[];
  wrapItems: { title: string; body: string }[];
  visaItems: GroupDeskItem[];
  licenseItems: GroupDeskItem[];
  contactLabel: string;
}) {
  const t = await getTranslations("servicesPage");
  const wrapPoints = [t("wrapPoint1"), t("wrapPoint2"), t("wrapPoint3")];

  return (
    <main id="main">
      <ServicesIdentityHero
        label={label}
        title={identityTitle}
        intro={intro}
        contactLabel={contactLabel}
        ctaHref="#service-inquiry"
        headingId="services-heading"
      />

      <section className="relative bg-background text-foreground" aria-labelledby="services-catalog-heading">
        <div className={cn("py-8 sm:py-10", publicGutter)}>
          <h2 id="services-catalog-heading" className="sr-only">
            {catalogTitle}
          </h2>
          <ul className="border-t border-foreground/10">
            {catalogItems.map((item) => (
              <li key={item.href} className="border-b border-foreground/10">
                <Link
                  href={item.href}
                  className="group grid gap-4 py-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:py-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:items-end lg:gap-x-16 lg:py-16"
                >
                  <span className="font-heading text-[clamp(2.5rem,8vw,5.25rem)] font-semibold leading-[0.95] tracking-tight text-balance text-primary transition-colors group-hover:text-primary/80">
                    {item.name}
                  </span>
                  <span className="max-w-prose pb-1 text-base leading-relaxed text-pretty text-foreground/75 sm:text-lg">
                    {item.body}
                    <span className="mt-5 block h-px w-10 bg-secondary transition-[width] duration-300 ease-out group-hover:w-16 motion-reduce:transition-none" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <VisaBand headingLevel="h2" />

      <section className="relative bg-background text-foreground" aria-labelledby="services-wrap-heading">
        <div className={cn("py-20 sm:py-28 lg:py-32", publicGutter)}>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-x-20 xl:gap-x-28">
            <div className="lg:sticky lg:top-28">
              <p className="inline-flex items-center gap-2 border border-secondary px-3 py-1 font-heading text-[0.7rem] font-medium tracking-[0.14em] text-secondary uppercase">
                <span className="size-1.5 shrink-0 bg-secondary" aria-hidden />
                {t("wrapBadge")}
              </p>
              <h2
                id="services-wrap-heading"
                className="mt-5 max-w-[12ch] font-heading text-[clamp(2.15rem,5.5vw,3.75rem)] font-semibold leading-[1.05] tracking-tight text-balance text-primary sm:mt-6"
              >
                {t.rich("wrapHeadline", {
                  mark: (chunks) => <span className="text-secondary">{chunks}</span>,
                })}
              </h2>
              <div className="mt-5 h-px w-16 bg-secondary sm:mt-6 sm:w-20" />
              <p className="mt-6 max-w-prose text-sm leading-relaxed text-pretty text-foreground/70 sm:text-base">
                {t("wrapIntro")}
              </p>
              <ul className="mt-8 space-y-3">
                {wrapPoints.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-pretty sm:text-base">
                    <Check className="mt-0.5 size-4 shrink-0 text-secondary" strokeWidth={2.25} aria-hidden />
                    <span className="min-w-0 text-foreground/80">{point}</span>
                  </li>
                ))}
              </ul>
              <aside className="mt-8 bg-muted px-5 py-5 shadow-[2px_3px_12px_rgba(31,31,31,0.06)]">
                <p className="font-heading text-[0.65rem] font-medium tracking-[0.14em] text-secondary uppercase">
                  {t("inquiryNoteLabel")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-pretty text-foreground/75">{t("wrapNote")}</p>
              </aside>
            </div>
            <ol className="list-none lg:mt-3 lg:border-s lg:border-secondary lg:ps-12 xl:ps-16">
              {wrapItems.map((item) => (
                <li key={item.title} className="border-b border-foreground/10 py-7 first:pt-0 last:border-b-0 last:pb-0 sm:py-8">
                  <h3 className="font-heading text-lg font-semibold tracking-tight text-balance sm:text-xl">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-pretty text-foreground/80">{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <ServicesGroupInquiry visaItems={visaItems} licenseItems={licenseItems} />
    </main>
  );
}
