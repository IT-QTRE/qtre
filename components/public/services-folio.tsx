import { ContactCloser } from "@/components/public/contact-closer";
import { ServicesIdentityHero } from "@/components/public/services-identity-hero";
import { VisaBand } from "@/components/public/visa-band";
import { Link } from "@/i18n/navigation";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

type DeskItem = {
  name: string;
  body: string;
  types?: string;
  href: string;
};

function DeskColumn({
  headingId,
  title,
  items,
}: {
  headingId: string;
  title: string;
  items: DeskItem[];
}) {
  return (
    <div>
      <h3
        id={headingId}
        className="font-heading text-lg font-semibold tracking-tight text-balance text-primary sm:text-xl"
      >
        {title}
      </h3>
      <div className="mt-4 h-px w-8 bg-secondary" />
      <ul className="mt-8 border-t border-foreground/10">
        {items.map((item) => (
          <li key={item.name} className="border-b border-foreground/10 py-5">
            <p className="font-heading text-base font-semibold tracking-tight text-balance">
              <Link
                href={item.href}
                className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.name}
              </Link>
            </p>
            {item.types ? <p className="mt-1.5 text-sm text-secondary">{item.types}</p> : null}
            <p className="mt-2.5 text-sm leading-relaxed text-pretty text-foreground/70">{item.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function ServicesFolio({
  label,
  identityTitle,
  intro,
  catalogTitle,
  catalogItems,
  wrapTitle,
  wrapItems,
  groupTitle,
  groupIntro,
  visaTitle,
  visaItems,
  licenseTitle,
  licenseItems,
  contactLabel,
  contactTitle,
  contactBody,
}: {
  label: string;
  identityTitle: string;
  intro: string;
  catalogTitle: string;
  catalogItems: DeskItem[];
  wrapTitle: string;
  wrapItems: { title: string; body: string }[];
  groupTitle: string;
  groupIntro: string;
  visaTitle: string;
  visaItems: DeskItem[];
  licenseTitle: string;
  licenseItems: DeskItem[];
  contactLabel: string;
  contactTitle: string;
  contactBody: string;
}) {
  return (
    <main id="main">
      <ServicesIdentityHero
        label={label}
        title={identityTitle}
        intro={intro}
        contactLabel={contactLabel}
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
            <div>
              <h2
                id="services-wrap-heading"
                className="max-w-[12ch] font-heading text-[clamp(2.25rem,6vw,4.25rem)] font-semibold leading-[1.05] tracking-tight text-balance text-primary"
              >
                {wrapTitle}
              </h2>
              <div className="mt-8 h-px w-28 bg-secondary sm:mt-10 sm:w-32" />
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

      <section className="relative bg-muted text-foreground" aria-labelledby="services-group-heading">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-secondary" />
        <div className={cn("py-16 sm:py-20", publicGutter)}>
          <div className="max-w-2xl">
            <h2
              id="services-group-heading"
              className="font-heading text-xl font-semibold tracking-tight text-balance sm:text-2xl"
            >
              {groupTitle}
            </h2>
            <div className="mt-5 h-px w-10 bg-secondary" />
            <p className="mt-6 text-base leading-relaxed text-pretty text-foreground/70">{groupIntro}</p>
          </div>
          <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-x-16 xl:gap-x-24">
            <DeskColumn headingId="services-visa-heading" title={visaTitle} items={visaItems} />
            <DeskColumn headingId="services-license-heading" title={licenseTitle} items={licenseItems} />
          </div>
        </div>
      </section>

      <ContactCloser title={contactTitle} body={contactBody} />
    </main>
  );
}
