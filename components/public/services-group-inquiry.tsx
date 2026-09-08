"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { publicGutter } from "@/lib/public-layout";
import type { ServiceGroup } from "@/lib/service-desks";
import { cn } from "@/lib/utils";
import { ServiceIntakeWizard, type IntakeDeskItem } from "@/components/public/service-intake-wizard";

export type GroupDeskItem = IntakeDeskItem & { group: ServiceGroup };

function Mark({ children }: { children: ReactNode }) {
  return <span className="text-secondary">{children}</span>;
}

function InquiryBand({
  id,
  group,
  items,
  idPrefix,
  muted,
}: {
  id: string;
  group: ServiceGroup;
  items: IntakeDeskItem[];
  idPrefix: string;
  muted: boolean;
}) {
  const t = useTranslations("servicesPage");
  const headingId = `${id}-heading`;
  const badge = group === "visa" ? t("visaBadge") : t("licenseBadge");
  const intro = group === "visa" ? t("visaIntro") : t("licenseIntro");
  const note = group === "visa" ? t("visaNote") : t("licenseNote");
  const points =
    group === "visa"
      ? [t("visaPoint1"), t("visaPoint2"), t("visaPoint3")]
      : [t("licensePoint1"), t("licensePoint2"), t("licensePoint3")];

  return (
    <section
      id={id}
      className={cn("relative scroll-mt-28 text-foreground", muted ? "bg-muted" : "bg-background")}
      aria-labelledby={headingId}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-secondary" />
      <div className={cn("py-16 sm:py-20 lg:py-24", publicGutter)}>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-x-16 xl:gap-x-24">
          <div className="lg:sticky lg:top-28">
            <p className="inline-flex items-center gap-2 border border-secondary px-3 py-1 font-heading text-[0.7rem] font-medium tracking-[0.14em] text-secondary uppercase">
              <span className="size-1.5 shrink-0 bg-secondary" aria-hidden />
              {badge}
            </p>
            <h2
              id={headingId}
              className="mt-5 max-w-[12ch] font-heading text-[clamp(2.15rem,5.5vw,3.75rem)] font-semibold leading-[1.05] tracking-tight text-balance text-primary sm:mt-6"
            >
              {t.rich(group === "visa" ? "visaHeadline" : "licenseHeadline", {
                mark: (chunks) => <Mark>{chunks}</Mark>,
              })}
            </h2>
            <div className="mt-5 h-px w-16 bg-secondary sm:mt-6 sm:w-20" />
            <p className="mt-6 max-w-prose text-sm leading-relaxed text-pretty text-foreground/70 sm:text-base">
              {intro}
            </p>
            <ul className="mt-8 space-y-3">
              {points.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-pretty sm:text-base">
                  <Check className="mt-0.5 size-4 shrink-0 text-secondary" strokeWidth={2.25} aria-hidden />
                  <span className="min-w-0 text-foreground/80">{point}</span>
                </li>
              ))}
            </ul>
            <aside
              className={cn(
                "mt-8 px-5 py-5 shadow-[2px_3px_12px_rgba(31,31,31,0.06)]",
                muted ? "bg-background" : "bg-muted",
              )}
            >
              <p className="font-heading text-[0.65rem] font-medium tracking-[0.14em] text-secondary uppercase">
                {t("inquiryNoteLabel")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-pretty text-foreground/75">{note}</p>
            </aside>
          </div>
          <div className="lg:border-s lg:border-secondary lg:ps-12 xl:ps-16">
            <ServiceIntakeWizard group={group} items={items} idPrefix={idPrefix} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function ServicesGroupInquiry({
  visaItems,
  licenseItems,
}: {
  visaItems: GroupDeskItem[];
  licenseItems: GroupDeskItem[];
}) {
  return (
    <>
      <InquiryBand
        id="service-inquiry"
        group="visa"
        items={visaItems}
        idPrefix="visa-intake"
        muted
      />
      <InquiryBand
        id="license-inquiry"
        group="license"
        items={licenseItems}
        idPrefix="license-intake"
        muted={false}
      />
    </>
  );
}
