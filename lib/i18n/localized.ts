import type { AppLocale } from "@/i18n/routing";

export type LocalizedText = {
  en: string;
  ar?: string;
  tr?: string;
};

export function pickLocalized(text: LocalizedText, locale: AppLocale): string {
  const value = text[locale];
  return value && value.trim().length > 0 ? value : text.en;
}
