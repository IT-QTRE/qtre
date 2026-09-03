import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

const closerLinkClass =
  "text-sm text-primary-foreground/70 hover:text-secondary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-primary";

export async function ContactCloser({
  email,
  phone,
  compact = false,
  headingId,
  title,
  body,
}: {
  email?: string;
  phone?: string;
  compact?: boolean;
  headingId?: string;
  title?: string;
  body?: string;
}) {
  const t = await getTranslations("home");
  const tNav = await getTranslations("nav");
  const resolvedHeadingId = headingId ?? (compact ? "contact-closer-compact-heading" : "contact-closer-heading");
  const heading = title ?? t("contactTitle");
  const copy = body ?? (compact ? undefined : t("contactBody"));

  return (
    <section className="relative bg-primary text-primary-foreground" aria-labelledby={resolvedHeadingId}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-secondary" />
      <div className={cn("w-full", publicGutter, compact ? "py-6 sm:py-7" : "py-20 sm:py-28")}>
        {compact ? (
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-8">
            <div className="min-w-0">
              <h2 id={resolvedHeadingId} className="font-heading text-lg font-semibold tracking-tight text-pretty sm:text-xl">
                {heading}
              </h2>
              {copy ? <p className="mt-1 max-w-prose text-sm text-pretty text-primary-foreground/70">{copy}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link
                href="/contact"
                className="group inline-flex min-h-11 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                <span className="font-heading text-sm font-medium tracking-[0.16em] text-secondary uppercase">
                  {tNav("contact")}
                </span>
                <span className="h-px w-8 bg-secondary transition-[width] duration-300 ease-out group-hover:w-12 motion-reduce:transition-none" />
              </Link>
              {email ? (
                <a href={`mailto:${email}`} className={closerLinkClass}>
                  {email}
                </a>
              ) : null}
              {phone ? (
                <a href={`tel:${phone}`} className={closerLinkClass}>
                  {phone}
                </a>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-xl flex-col items-center text-center">
            <h2
              id={resolvedHeadingId}
              className="max-w-[16ch] font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
            >
              {heading}
            </h2>
            {copy ? (
              <p className="mt-6 max-w-prose text-base leading-relaxed text-pretty text-primary-foreground/80">{copy}</p>
            ) : null}
            <Link
              href="/contact"
              className="group mt-10 inline-flex min-h-11 flex-col items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              <span className="font-heading text-sm font-medium tracking-[0.16em] text-secondary uppercase">
                {tNav("contact")}
              </span>
              <span className="mt-3 h-px w-10 bg-secondary transition-[width] duration-300 ease-out group-hover:w-16 motion-reduce:transition-none" />
            </Link>
            {email || phone ? (
              <div className="mt-4 space-y-1 text-sm text-primary-foreground/70">
                {email ? (
                  <a href={`mailto:${email}`} className={cn(closerLinkClass, "block text-secondary")}>
                    {email}
                  </a>
                ) : null}
                {phone ? (
                  <a href={`tel:${phone}`} className={cn(closerLinkClass, "block text-secondary")}>
                    {phone}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
