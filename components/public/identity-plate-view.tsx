"use client";

import { motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

export function IdentityPlateView({
  title,
  body,
  aboutLabel,
}: {
  title: string;
  body: string;
  aboutLabel: string;
}) {
  const reduced = useReducedMotion() ?? false;
  const rtl = useLocale() === "ar";
  const tBrand = useTranslations("brand");
  const words = title.split(/\s+/).filter(Boolean);
  const lineDelay = reduced ? 0 : words.length * 0.09 + 0.12;

  return (
    <section className="relative bg-background text-foreground" aria-labelledby="identity-plate-heading">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-secondary" />
      <div className={cn("w-full py-24 sm:py-32 lg:py-36", publicGutter)}>
        <div className="grid gap-10 text-center lg:grid-cols-2 lg:items-start lg:gap-x-20 lg:text-start xl:gap-x-28">
          <div className="flex flex-col items-center lg:items-start">
            <h2
              id="identity-plate-heading"
              className="max-w-[11ch] font-heading text-[clamp(2.5rem,8vw,5.5rem)] font-semibold leading-[1.05] tracking-tight text-primary"
            >
              {reduced
                ? title
                : words.map((word, index) => (
                    <motion.span
                      key={`${word}-${index}`}
                      className="inline-block me-[0.28em] last:me-0"
                      initial={{ opacity: 0.22, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.55 }}
                      transition={{ duration: 0.55, delay: index * 0.09, ease }}
                    >
                      {word}
                    </motion.span>
                  ))}
            </h2>
            <motion.div
              aria-hidden
              className={cn(
                "mt-8 h-px w-28 origin-center bg-secondary sm:mt-10 sm:w-32",
                rtl ? "lg:origin-right" : "lg:origin-left",
              )}
              initial={{ scaleX: reduced ? 1 : 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={reduced ? { duration: 0 } : { duration: 0.75, delay: lineDelay, ease }}
            />
          </div>

          <div className="mx-auto flex max-w-md flex-col items-center lg:mx-0 lg:mt-3 lg:max-w-none lg:items-start lg:border-s lg:border-secondary lg:ps-12 xl:ps-16">
            <p className="font-heading text-sm font-medium tracking-tight text-primary">{tBrand("taglineFirst")}</p>
            <div className="mt-3 h-px w-8 bg-secondary" />
            <p className="mt-3 font-heading text-sm font-medium tracking-tight text-primary">{tBrand("taglineSecond")}</p>
            <p className="mt-8 text-base leading-relaxed text-pretty text-foreground/80 sm:text-lg">{body}</p>
            <Link
              href="/about"
              className="group mt-10 inline-flex min-h-11 flex-col items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:items-start"
            >
              <span className="font-heading text-sm font-medium tracking-[0.16em] text-secondary uppercase">
                {aboutLabel}
              </span>
              <span className="mt-3 h-px w-10 bg-secondary transition-[width] duration-300 ease-out group-hover:w-16 motion-reduce:transition-none" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
