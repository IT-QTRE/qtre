"use client";

import { useReducedMotion } from "motion/react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { DeveloperRow } from "@/components/public/developer-name-link";

const MARQUEE_REPEAT = 4;
const MARQUEE_MIN = 3;

function LogoPlate({ developer }: { developer: DeveloperRow }) {
  return (
    <Link
      href={developer.href}
      className={cn(
        "flex h-20 min-w-44 shrink-0 items-center justify-center border border-secondary/55 bg-background px-8",
        "touch-manipulation transition-colors duration-300 ease-out",
        "hover:border-secondary hover:bg-card",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "motion-reduce:transition-none",
      )}
    >
      <Image
        src={developer.imageUrl!}
        alt={developer.name}
        width={200}
        height={72}
        className="h-10 w-auto max-w-36 object-contain sm:h-11"
      />
    </Link>
  );
}

function StaticMarks({ items }: { items: DeveloperRow[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
      {items.map((developer) => (
        <LogoPlate key={developer.id} developer={developer} />
      ))}
    </div>
  );
}

export function DeveloperLogoMarquee({
  items,
  label,
}: {
  items: DeveloperRow[];
  label: string;
}) {
  const reduced = useReducedMotion() ?? false;
  const rtl = useLocale() === "ar";
  const duration = `${Math.max(28, items.length * 9)}s`;

  if (items.length === 0) return null;

  return (
    <section
      aria-label={label}
      className="border-y border-secondary/35 bg-muted py-8 sm:py-10"
    >
      {reduced || items.length < MARQUEE_MIN ? (
        <div className="px-4 sm:px-6">
          <StaticMarks items={items} />
        </div>
      ) : (
        <div
          className={cn(
            "group flex overflow-hidden [--qtre-marquee-gap:1rem]",
            "mask-[linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
          )}
          style={{
            gap: "var(--qtre-marquee-gap)",
            ["--qtre-marquee-duration" as string]: duration,
          }}
        >
          {Array.from({ length: MARQUEE_REPEAT }, (_, copy) => (
            <div
              key={copy}
              className={cn(
                "flex shrink-0 justify-around animate-qtre-marquee",
                "group-hover:paused group-focus-within:paused",
                rtl && "[animation-direction:reverse]",
              )}
              style={{ gap: "var(--qtre-marquee-gap)" }}
              aria-hidden={copy > 0 ? true : undefined}
            >
              {items.map((developer) => (
                <LogoPlate key={`${copy}-${developer.id}`} developer={developer} />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
