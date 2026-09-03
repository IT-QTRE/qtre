import type { AppLocale } from "@/i18n/routing";

const localeTags: Record<AppLocale, string> = {
  en: "en-AE",
  ar: "ar-AE",
  tr: "tr-TR",
};

export function formatPublishedAt(ms: number, locale: AppLocale) {
  return new Intl.DateTimeFormat(localeTags[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(ms));
}
