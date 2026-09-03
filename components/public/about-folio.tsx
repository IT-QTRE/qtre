import { DirectoryHero } from "@/components/public/directory-hero";
import { Link } from "@/i18n/navigation";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

export function AboutFolio({
  title,
  intro,
  founderName,
  founderRole,
  founderBody,
  quote,
  quoteAttr,
  whoTitle,
  whoBody,
  foundationTitle,
  foundationBody,
  networkTitle,
  entities,
  pillarsTitle,
  pillars,
  commitTitle,
  commitBody,
  contactLabel,
}: {
  title: string;
  intro: string;
  founderName: string;
  founderRole: string;
  founderBody: string;
  quote: string;
  quoteAttr: string;
  whoTitle: string;
  whoBody: string;
  foundationTitle: string;
  foundationBody: string;
  networkTitle: string;
  entities: { name: string; place: string; body: string }[];
  pillarsTitle: string;
  pillars: { title: string; body: string }[];
  commitTitle: string;
  commitBody: string;
  contactLabel: string;
}) {
  return (
    <main id="main">
      <DirectoryHero title={title} intro={intro} countLabel={null} headingId="about-heading" />

      <section
        className="relative bg-background text-foreground"
        aria-labelledby="about-founder-heading"
      >
        <div className={cn("py-20 sm:py-28 lg:py-32", publicGutter)}>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-x-20 xl:gap-x-28">
            <div>
              <h2
                id="about-founder-heading"
                className="max-w-[14ch] font-heading text-[clamp(2.25rem,6vw,4.25rem)] font-semibold leading-[1.05] tracking-tight text-balance text-primary"
              >
                {founderName}
              </h2>
              <div className="mt-8 h-px w-28 bg-secondary sm:mt-10 sm:w-32" />
              <p className="mt-6 text-sm text-secondary">{founderRole}</p>
            </div>
            <p className="max-w-prose text-base leading-relaxed text-pretty text-foreground/80 sm:text-lg lg:mt-3 lg:border-s lg:border-secondary lg:ps-12 xl:ps-16">
              {founderBody}
            </p>
          </div>
        </div>
      </section>

      <section className="relative bg-primary text-primary-foreground" aria-label={quoteAttr}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-secondary" />
        <div className={cn("py-20 sm:py-24 lg:py-28", publicGutter)}>
          <blockquote className="max-w-[42rem]">
            <p className="font-heading text-[clamp(1.25rem,2.4vw,1.75rem)] font-semibold leading-snug tracking-tight text-pretty">
              {quote}
            </p>
            <footer className="mt-10 text-sm text-secondary">{quoteAttr}</footer>
          </blockquote>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-secondary" />
      </section>

      <section
        className="relative bg-background text-foreground"
        aria-labelledby="about-who-heading"
      >
        <div className={cn("py-20 sm:py-28 lg:py-32", publicGutter)}>
          <h2
            id="about-who-heading"
            className="max-w-[10ch] font-heading text-[clamp(2.25rem,6vw,4.25rem)] font-semibold leading-[1.05] tracking-tight text-balance text-primary"
          >
            {whoTitle}
          </h2>
          <div className="mt-8 h-px w-28 bg-secondary sm:mt-10 sm:w-32" />
          <p className="mt-10 max-w-[42rem] text-base leading-relaxed text-pretty text-foreground/80 sm:mt-12 sm:text-lg">
            {whoBody}
          </p>
        </div>
      </section>

      <section
        className="relative bg-muted text-foreground"
        aria-labelledby="about-foundation-heading"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-secondary" />
        <div className={cn("py-20 sm:py-28 lg:py-32", publicGutter)}>
          <div className="flex flex-col gap-12 lg:flex-row-reverse lg:items-start lg:gap-x-20 xl:gap-x-28">
            <div className="lg:w-1/2 lg:text-end">
              <h2
                id="about-foundation-heading"
                className="max-w-[12ch] font-heading text-[clamp(2.25rem,6vw,4.25rem)] font-semibold leading-[1.05] tracking-tight text-balance text-primary lg:ms-auto"
              >
                {foundationTitle}
              </h2>
              <div className="mt-8 h-px w-28 bg-secondary sm:mt-10 sm:w-32 lg:ms-auto" />
            </div>
            <p className="max-w-prose text-base leading-relaxed text-pretty text-foreground/80 sm:text-lg lg:w-1/2 lg:border-e lg:border-secondary lg:pe-12 xl:pe-16">
              {foundationBody}
            </p>
          </div>
        </div>
      </section>

      <section
        className="relative bg-background text-foreground"
        aria-labelledby="about-network-heading"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-secondary" />
        <div className={cn("py-20 sm:py-28", publicGutter)}>
          <h2
            id="about-network-heading"
            className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
          >
            {networkTitle}
          </h2>
          <ul className="mt-12 grid gap-12 border-t border-foreground/10 pt-12 sm:mt-16 sm:pt-16 lg:grid-cols-3 lg:gap-x-12 lg:gap-y-0">
            {entities.map((entity) => (
              <li key={entity.name}>
                <p className="text-sm text-secondary">{entity.place}</p>
                <h3 className="mt-4 font-heading text-[clamp(1.35rem,2.4vw,1.85rem)] font-semibold leading-tight tracking-tight text-balance text-primary">
                  {entity.name}
                </h3>
                <div className="mt-5 h-px w-10 bg-secondary" />
                <p className="mt-5 text-base leading-relaxed text-pretty text-foreground/80">{entity.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="relative bg-muted text-foreground"
        aria-labelledby="about-pillars-heading"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-secondary" />
        <div className={cn("py-20 sm:py-28", publicGutter)}>
          <h2
            id="about-pillars-heading"
            className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
          >
            {pillarsTitle}
          </h2>
          <div className="mt-6 h-px w-12 bg-secondary" />
          <ul className="mt-12 border-t border-foreground/10 sm:mt-16">
            {pillars.map((pillar) => (
              <li key={pillar.title} className="border-b border-foreground/10 py-8 sm:py-10">
                <h3 className="font-heading text-xl font-semibold tracking-tight text-balance text-primary sm:text-2xl">
                  {pillar.title}
                </h3>
                <p className="mt-4 max-w-prose text-base leading-relaxed text-pretty text-foreground/80">
                  {pillar.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="relative bg-primary text-primary-foreground"
        aria-labelledby="about-commit-heading"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-secondary" />
        <div className={cn("py-20 sm:py-28 lg:py-32", publicGutter)}>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-end lg:gap-x-20 xl:gap-x-28">
            <div>
              <h2
                id="about-commit-heading"
                className="max-w-[12ch] font-heading text-[clamp(2.25rem,6vw,4.25rem)] font-semibold leading-[1.05] tracking-tight text-balance"
              >
                {commitTitle}
              </h2>
              <div className="mt-8 h-px w-28 bg-secondary sm:mt-10 sm:w-32" />
            </div>
            <div className="lg:border-s lg:border-secondary lg:ps-12 xl:ps-16">
              <p className="max-w-prose text-base leading-relaxed text-pretty text-primary-foreground/85 sm:text-lg">
                {commitBody}
              </p>
              <Link
                href="/contact"
                className="mt-10 inline-flex min-h-12 items-center justify-center bg-secondary px-6 font-heading text-sm font-medium tracking-[0.14em] text-primary uppercase transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                {contactLabel}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
