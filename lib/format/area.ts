import type { AppLocale } from "@/i18n/routing";

const SQ_FT_TO_SQ_M = 0.09290304;

const localeTags: Record<AppLocale, string> = {
  en: "en-AE",
  ar: "ar-AE",
  tr: "tr-TR",
};

export function numericRange(values: number[]): { min: number; max: number } | null {
  let min = Infinity;
  let max = -Infinity;
  for (const value of values) {
    if (!Number.isFinite(value) || value <= 0) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (!Number.isFinite(min)) return null;
  return { min, max };
}

export function sqftToSqm(sqft: number) {
  return Math.round(sqft * SQ_FT_TO_SQ_M);
}

export function sqmToSqft(sqm: number) {
  return Math.round(sqm / SQ_FT_TO_SQ_M);
}

export function rangeFromEnds(min: number | null | undefined, max: number | null | undefined) {
  return numericRange([min, max].filter((value): value is number => value != null));
}

export function mergeRanges(...ranges: Array<{ min: number; max: number } | null | undefined>) {
  const values: number[] = [];
  for (const range of ranges) {
    if (!range) continue;
    values.push(range.min, range.max);
  }
  return numericRange(values);
}

export function formatCatalogNumber(value: number, locale: AppLocale) {
  return new Intl.NumberFormat(localeTags[locale]).format(value);
}

export function formatCatalogRange(min: number, max: number, locale: AppLocale) {
  const low = formatCatalogNumber(min, locale);
  if (min === max) return low;
  return `${low}–${formatCatalogNumber(max, locale)}`;
}

export function formatMeasureRange(min: number, max: number, locale: AppLocale, unit: string) {
  return `${formatCatalogRange(min, max, locale)} ${unit}`;
}

export function formatSqftRange(minSqft: number, maxSqft: number, locale: AppLocale, unit: string) {
  return formatMeasureRange(minSqft, maxSqft, locale, unit);
}

export function formatSqmRange(minSqft: number, maxSqft: number, locale: AppLocale, unit: string) {
  return formatMeasureRange(sqftToSqm(minSqft), sqftToSqm(maxSqft), locale, unit);
}

export function formatSqmRangeFromSqm(minSqm: number, maxSqm: number, locale: AppLocale, unit: string) {
  return formatMeasureRange(minSqm, maxSqm, locale, unit);
}

export function formatSqftRangeFromSqm(minSqm: number, maxSqm: number, locale: AppLocale, unit: string) {
  return formatMeasureRange(sqmToSqft(minSqm), sqmToSqft(maxSqm), locale, unit);
}
