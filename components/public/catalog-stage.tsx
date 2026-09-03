"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "@/i18n/navigation";
import type { SearchIntent } from "@/lib/public-nav";
import { IntentMark } from "@/components/public/intent-mark";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

const INTENTS: SearchIntent[] = ["buy", "rent", "offplan"];

const HREFS: Record<SearchIntent, string> = {
  buy: "/properties?status=sale",
  rent: "/properties?status=rent",
  offplan: "/projects",
};

export function CatalogStage({
  heading,
  seeAllLabel,
  seeAllHrefs,
  intentGroupLabel,
  labels,
  panels,
  intents = INTENTS,
  markId = "catalog-stage-intent",
}: {
  heading: string;
  seeAllLabel: string;
  seeAllHrefs?: Partial<Record<SearchIntent, string>>;
  intentGroupLabel: string;
  labels: Record<SearchIntent, string>;
  panels: Partial<Record<SearchIntent, ReactNode>>;
  intents?: readonly SearchIntent[];
  markId?: string;
}) {
  const reduced = useReducedMotion() ?? false;
  const tabs = intents.length > 0 ? intents : INTENTS;
  const [intent, setIntent] = useState<SearchIntent>(tabs[0] ?? "buy");

  function selectIntent(value: SearchIntent) {
    setIntent(value);
    requestAnimationFrame(() => {
      document.getElementById(`catalog-stage-tab-${value}`)?.focus();
    });
  }

  function onTabListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.indexOf(intent);
    const rtl = document.documentElement.dir === "rtl";
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const forward = event.key === "ArrowRight";
      const delta = forward === rtl ? -1 : 1;
      const next = tabs[(index + delta + tabs.length) % tabs.length]!;
      selectIntent(next);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      selectIntent(tabs[0]!);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      selectIntent(tabs[tabs.length - 1]!);
    }
  }

  return (
    <section className={cn("w-full py-16 sm:py-20", publicGutter)}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <motion.h2
          className="text-pretty font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          initial={{ y: reduced ? 0 : 12 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={reduced ? { duration: 0 } : { duration: 0.55, ease }}
        >
          {heading}
        </motion.h2>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 lg:justify-end">
          <div
            className="flex items-stretch"
            role="tablist"
            aria-label={intentGroupLabel}
            onKeyDown={onTabListKeyDown}
          >
            {tabs.map((value) => {
              const selected = value === intent;
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="catalog-stage-panel"
                  id={`catalog-stage-tab-${value}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => selectIntent(value)}
                  className={cn(
                    "min-h-11 cursor-pointer px-3 font-heading text-sm font-medium tracking-tight touch-manipulation transition-colors duration-200 ease-out motion-reduce:transition-none sm:px-4",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="relative inline-flex min-h-11 items-center py-2">
                    {labels[value]}
                    <IntentMark layoutId={markId} selected={selected} />
                  </span>
                </button>
              );
            })}
          </div>
          <Link
            href={seeAllHrefs?.[intent] ?? HREFS[intent]}
            className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {seeAllLabel}
          </Link>
        </div>
      </div>
      <div id="catalog-stage-panel" role="tabpanel" aria-labelledby={`catalog-stage-tab-${intent}`}>
        {panels[intent]}
      </div>
    </section>
  );
}
