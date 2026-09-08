import { GoldRule } from "@/components/public/gold-rule";
import { Link } from "@/i18n/navigation";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

export function ServicesIdentityHero({
  label,
  title,
  intro,
  contactLabel,
  ctaHref = "/contact",
  headingId,
}: {
  label: string;
  title: string;
  intro: string;
  contactLabel: string;
  ctaHref?: string;
  headingId: string;
}) {
  return (
    <header
      className={cn(
        "relative -mt-24 bg-primary pt-24 text-primary-foreground sm:-mt-26 sm:pt-26",
        publicGutter,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-secondary" />
      <div className="relative grid gap-12 py-20 sm:py-28 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-x-16 lg:py-32 xl:gap-x-24">
        <div>
          <p className="font-heading text-sm font-medium tracking-[0.16em] text-secondary uppercase">{label}</p>
          <h1
            id={headingId}
            className="mt-6 max-w-[12ch] scroll-mt-28 font-heading text-[clamp(2.75rem,10vw,6rem)] font-semibold leading-[1.02] tracking-tight text-balance"
          >
            {title}
          </h1>
          <GoldRule draw className="mt-8 w-28 sm:mt-10 sm:w-32" />
        </div>

        <div className="lg:border-s lg:border-secondary lg:ps-12 xl:ps-16">
          <p className="max-w-prose text-base leading-relaxed text-pretty text-primary-foreground/85 sm:text-lg">
            {intro}
          </p>
          {ctaHref.startsWith("#") ? (
            <a
              href={ctaHref}
              className="mt-10 inline-flex min-h-12 items-center justify-center bg-secondary px-6 font-heading text-sm font-medium tracking-[0.14em] text-primary uppercase transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              {contactLabel}
            </a>
          ) : (
            <Link
              href={ctaHref}
              className="mt-10 inline-flex min-h-12 items-center justify-center bg-secondary px-6 font-heading text-sm font-medium tracking-[0.14em] text-primary uppercase transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              {contactLabel}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
