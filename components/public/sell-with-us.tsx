import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { GoldRule } from "@/components/public/gold-rule";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

export async function SellWithUs() {
  const t = await getTranslations("home");
  const beats = [t("sellBeat1"), t("sellBeat2"), t("sellBeat3")];

  return (
    <section className="relative bg-primary text-primary-foreground" aria-labelledby="sell-with-us-heading">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-secondary" />
      <div className={cn("w-full py-12 sm:py-20 lg:py-24", publicGutter)}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end lg:gap-x-16">
          <div>
            <h2
              id="sell-with-us-heading"
              className="max-w-[11ch] font-heading text-[clamp(2.25rem,7vw,4.5rem)] font-semibold leading-[1.05] tracking-tight text-balance"
            >
              {t("sellTitle")}
            </h2>
            <GoldRule draw className="mt-6 w-16 sm:mt-8 sm:w-24" />
          </div>
          <div className="max-w-prose lg:pb-1">
            <p className="text-base leading-relaxed text-pretty text-primary-foreground/85 sm:text-lg">
              {t("sellBody")}
            </p>
            <ol className="mt-8 flex list-none flex-col gap-3 sm:mt-10">
              {beats.map((beat) => (
                <li
                  key={beat}
                  className="flex items-baseline gap-3 font-heading text-sm font-medium tracking-tight text-primary-foreground"
                >
                  <span className="h-px w-6 shrink-0 bg-secondary" aria-hidden />
                  {beat}
                </li>
              ))}
            </ol>
            <Link
              href="/contact"
              className="mt-8 inline-flex min-h-12 items-center justify-center bg-secondary px-6 font-heading text-sm font-medium tracking-[0.14em] text-primary uppercase transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary motion-reduce:transition-none sm:mt-10"
            >
              {t("sellCta")}
            </Link>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-secondary" />
    </section>
  );
}
