import type { AppLocale } from "@/i18n/routing";

export const COMPLETION_QUARTERS = [1, 2, 3, 4] as const;

export type CompletionQuarter = (typeof COMPLETION_QUARTERS)[number];

export type CompletionDate = {
  quarter: CompletionQuarter;
  year: number;
};

const AR_QUARTER: Record<CompletionQuarter, string> = {
  1: "الأول",
  2: "الثاني",
  3: "الثالث",
  4: "الرابع",
};

export function isCompletionQuarter(value: number): value is CompletionQuarter {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

export function completionYearOptions(now = new Date(), extraYear?: number) {
  const current = now.getFullYear();
  const years = new Set<number>();
  for (let year = current - 1; year <= current + 15; year++) years.add(year);
  if (extraYear != null && Number.isInteger(extraYear)) years.add(extraYear);
  return [...years].sort((a, b) => a - b);
}

export function formatCompletionDate(date: CompletionDate, locale: AppLocale = "en") {
  if (locale === "ar") return `الربع ${AR_QUARTER[date.quarter]} ${date.year}`;
  if (locale === "tr") return `${date.year} ${date.quarter}. çeyrek`;
  return `Q${date.quarter} ${date.year}`;
}

export function parseCompletionDate(quarter: string, year: string): CompletionDate | undefined {
  if (!quarter || !year) return undefined;
  const parsedQuarter = Number(quarter);
  const parsedYear = Number(year);
  if (!isCompletionQuarter(parsedQuarter) || !Number.isInteger(parsedYear)) return undefined;
  return { quarter: parsedQuarter, year: parsedYear };
}
