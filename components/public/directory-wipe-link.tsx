"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const MotionLink = motion.create(Link);

const fillEase = [0.16, 1, 0.3, 1] as const;

function wipeTransition(reduced: boolean, entering: boolean) {
  if (reduced) return { duration: 0 };
  return { duration: entering ? 0.75 : 0.55, ease: fillEase };
}

export function DirectoryWipeLink({
  href,
  name,
  leading,
  scale = "directory",
}: {
  href: string;
  name: string;
  leading?: ReactNode;
  scale?: "roster" | "directory";
}) {
  const reduced = useReducedMotion() ?? false;
  const rtl = useLocale() === "ar";
  const transition = wipeTransition(reduced, true);
  const exitTransition = wipeTransition(reduced, false);

  return (
    <MotionLink
      href={href}
      className={cn(
        "relative flex items-center overflow-hidden font-heading font-semibold",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        scale === "directory" && "py-5 text-[clamp(2rem,7vw,4.5rem)] sm:py-6",
        scale === "roster" && "py-4 text-[clamp(1.75rem,5.5vw,3.25rem)] sm:py-5",
      )}
      initial="rest"
      whileHover="hover"
      whileFocus="hover"
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-secondary"
        style={{ originX: rtl ? 1 : 0 }}
        variants={{
          rest: { scaleX: 0, transition: exitTransition },
          hover: { scaleX: 1, transition },
        }}
      />
      {leading}
      <span className="relative z-10 min-w-0 leading-[1.15] tracking-tight text-balance text-primary">{name}</span>
      <motion.span
        className={cn("relative z-10 ms-[0.3em] size-[0.42em] shrink-0", rtl && "-scale-x-100")}
        variants={{
          rest: { opacity: 0, x: rtl ? 8 : -8, transition: exitTransition },
          hover: { opacity: 1, x: 0, transition },
        }}
      >
        <svg fill="none" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg" aria-hidden className="size-full">
          <path
            d="M1.004 9.166 9.337.833m0 0v8.333m0-8.333H1.004"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.span>
    </MotionLink>
  );
}
