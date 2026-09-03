import type { ReactNode } from "react";
import { Calendar, Landmark, Sparkles, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

const FACTS = [
  { titleKey: "visaGolden", detailKey: "visaGoldenDetail", icon: Calendar },
  { titleKey: "visaInvestor", detailKey: "visaInvestorDetail", icon: Landmark },
  { titleKey: "visaFamily", detailKey: "visaFamilyDetail", icon: Users },
] as const;

export async function VisaBand({
  headingLevel,
  columnHref,
  footer,
  className,
}: {
  headingLevel: "h1" | "h2";
  columnHref?: "/services";
  footer?: ReactNode;
  className?: string;
}) {
  const t = await getTranslations("home");
  const Title = headingLevel;

  return (
    <section className={cn("relative bg-primary text-primary-foreground", className)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-secondary" />
      <div className={cn("w-full py-12 sm:py-16", publicGutter)}>
        <div className="flex flex-col items-center lg:grid lg:grid-cols-[minmax(0,0.9fr)_1px_minmax(0,1.4fr)] lg:items-center lg:gap-x-10">
          <div className="flex flex-col items-center lg:items-start">
            <p className="inline-flex items-center gap-2 rounded-full border border-secondary px-3 py-1 font-heading text-[0.7rem] font-medium tracking-[0.14em] text-secondary uppercase">
              <Sparkles className="size-3" aria-hidden />
              {t("visaBadge")}
            </p>
            <Title className="mt-5 max-w-[20ch] text-center font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl lg:text-start">
              {t.rich("visaHeadline", {
                mark: (chunks) => <span className="text-secondary">{chunks}</span>,
              })}
            </Title>
          </div>
          <div className="hidden self-stretch bg-secondary lg:block" />
          <ul className="mt-8 grid w-full gap-3 lg:mt-0 lg:grid-cols-3">
            {FACTS.map((fact) => {
              const Icon = fact.icon;
              const inner = (
                <div className="flex h-full items-center justify-start gap-3 rounded-xl border border-secondary/40 bg-primary-foreground/8 px-3.5 py-3.5 lg:justify-center">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-secondary text-secondary">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 text-start">
                    <span className="block font-heading text-sm font-semibold tracking-tight">
                      {t(fact.titleKey)}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-primary-foreground/80">
                      {t(fact.detailKey)}
                    </span>
                  </span>
                </div>
              );

              return (
                <li key={fact.titleKey}>
                  {columnHref ? (
                    <Link
                      href={columnHref}
                      className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                    >
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        {footer ? <div className="mt-8">{footer}</div> : null}
      </div>
    </section>
  );
}
