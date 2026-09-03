import type { AppLocale } from "@/i18n/routing";

const localeTags: Record<AppLocale, string> = {
  en: "en-AE",
  ar: "ar-AE",
  tr: "tr-TR",
};

export function formatAed(amount: number, locale: AppLocale): string {
  return new Intl.NumberFormat(localeTags[locale], {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatAedRange(min: number, max: number, locale: AppLocale): string {
  if (min === max) return formatAed(min, locale);
  return `${formatAed(min, locale)}–${formatAed(max, locale)}`;
}
