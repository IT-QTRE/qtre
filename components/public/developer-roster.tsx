"use client";

import { motion, useReducedMotion } from "motion/react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DeveloperNameLink, type DeveloperRow } from "@/components/public/developer-name-link";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

export type { DeveloperRow };

const MotionLink = motion.create(Link);

const fillEase = [0.16, 1, 0.3, 1] as const;

function wipeTransition(reduced: boolean, entering: boolean) {
  if (reduced) return { duration: 0 };
  return { duration: entering ? 0.75 : 0.55, ease: fillEase };
}

function SeeAllLink({
  label,
  reduced,
  rtl,
}: {
  label: string;
  reduced: boolean;
  rtl: boolean;
}) {
  const transition = wipeTransition(reduced, true);
  const exitTransition = wipeTransition(reduced, false);

  return (
    <MotionLink
      href="/developers"
      className="relative shrink-0 pb-0.5 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      initial="rest"
      whileHover="hover"
      whileFocus="hover"
    >
      {label}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-current"
        style={{ originX: rtl ? 1 : 0 }}
        variants={{
          rest: { scaleX: 0, transition: exitTransition },
          hover: { scaleX: 1, transition },
        }}
      />
    </MotionLink>
  );
}

export function DeveloperRoster({
  heading,
  body,
  seeAllLabel,
  hint,
  developers,
}: {
  heading: string;
  body: string;
  seeAllLabel: string;
  hint?: string;
  developers: DeveloperRow[];
}) {
  const reduced = useReducedMotion() ?? false;
  const rtl = useLocale() === "ar";

  return (
    <section className="relative bg-background text-foreground" aria-labelledby="developer-roster-heading">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-secondary" />
      <div className={cn("w-full py-20 sm:py-28", publicGutter)}>
        <div className="flex items-baseline justify-between gap-4">
          <h2
            id="developer-roster-heading"
            className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
          >
            {heading}
          </h2>
          <SeeAllLink label={seeAllLabel} reduced={reduced} rtl={rtl} />
        </div>
        <p className="mt-6 max-w-prose text-base leading-relaxed text-pretty text-foreground/80 sm:text-lg">
          {body}
        </p>
        {hint ? (
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-foreground/80">{hint}</p>
        ) : null}

        <ul className="mt-12 border-t border-foreground/10 sm:mt-16">
          {developers.map((developer) => (
            <li key={developer.id} className="border-b border-foreground/10">
              <DeveloperNameLink developer={developer} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
