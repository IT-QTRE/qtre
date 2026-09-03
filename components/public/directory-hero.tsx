import type { ReactNode } from "react";
import { GoldRule } from "@/components/public/gold-rule";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

export function DirectoryHero({
  title,
  intro,
  countLabel,
  headingId,
  lead,
  action,
}: {
  title: string;
  intro: string;
  countLabel: string | null;
  headingId: string;
  lead?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header
      className={cn(
        "relative -mt-24 bg-primary pt-24 text-primary-foreground sm:-mt-26 sm:pt-26",
        publicGutter,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-secondary" />
      <div className="relative py-10 sm:py-28 lg:py-32">
        {lead ? <div className="mb-6 sm:mb-12">{lead}</div> : null}
        <h1
          id={headingId}
          className="max-w-[11ch] font-heading text-[clamp(2.25rem,9vw,6rem)] font-semibold leading-[1.02] tracking-tight text-balance"
        >
          {title}
        </h1>
        <GoldRule draw className="mt-5 w-20 sm:mt-10 sm:w-32" />
        <p className="mt-5 max-w-prose text-sm leading-relaxed text-pretty text-primary-foreground/85 sm:mt-8 sm:text-lg">
          {intro}
        </p>
        {countLabel ? (
          <p className="mt-4 font-heading text-base font-medium text-secondary sm:mt-5 sm:text-lg">{countLabel}</p>
        ) : null}
        {action ? <div className="mt-8 sm:mt-12">{action}</div> : null}
      </div>
    </header>
  );
}
