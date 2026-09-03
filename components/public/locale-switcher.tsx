"use client";

import { useLocale, useTranslations } from "next-intl";
import { routing, type AppLocale } from "@/i18n/routing";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const CODES: Record<AppLocale, string> = {
  en: "EN",
  ar: "AR",
  tr: "TR",
};

const NATIVE_NAMES: Record<AppLocale, string> = {
  en: "English",
  ar: "العربية",
  tr: "Türkçe",
};

export function LocaleSwitcher({ query }: { query?: string }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const href = query ? `${pathname}?${query}` : pathname;

  return (
    <nav
      aria-label={t("language")}
      className="inline-flex rounded-md border border-border bg-background"
    >
      {routing.locales.map((code) => {
        const isActive = locale === code;
        return (
          <Link
            key={code}
            href={href}
            locale={code}
            hrefLang={code}
            title={NATIVE_NAMES[code]}
            aria-label={NATIVE_NAMES[code]}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "inline-flex min-h-11 min-w-9 items-center justify-center px-2.5 text-xs font-medium tracking-[0.08em] transition-colors first:rounded-s-md last:rounded-e-md sm:min-w-10 sm:text-sm",
              "not-last:border-e not-last:border-border",
              "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
              isActive
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {CODES[code]}
          </Link>
        );
      })}
    </nav>
  );
}
