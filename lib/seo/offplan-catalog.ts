import { routing, type AppLocale } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";

export const OFFPLAN_CONSTRUCTION = ["upcoming", "under_construction", "completed"] as const;
export type OffplanConstruction = (typeof OFFPLAN_CONSTRUCTION)[number];

export const CONSTRUCTION_CATALOG_KEYS = {
  upcoming: "construction.upcoming",
  under_construction: "construction.under_construction",
  completed: "construction.completed",
} as const satisfies Record<OffplanConstruction, string>;

export type OffplanFilters = {
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  construction?: OffplanConstruction;
  developer?: string;
};

function optionalInt(value: string | undefined) {
  if (!value?.trim()) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.floor(n);
}

function parseConstruction(value: string | undefined): OffplanConstruction | undefined {
  if (!value) return undefined;
  return (OFFPLAN_CONSTRUCTION as readonly string[]).includes(value) ? (value as OffplanConstruction) : undefined;
}

export function offplanFiltersFromSearch(search: {
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  beds?: string;
  construction?: string;
  developer?: string;
}): OffplanFilters {
  return {
    q: search.q?.trim() || undefined,
    minPrice: optionalInt(search.minPrice),
    maxPrice: optionalInt(search.maxPrice),
    beds: optionalInt(search.beds),
    construction: parseConstruction(search.construction),
    developer: search.developer?.trim() || undefined,
  };
}

export function offplanHasNarrowingFilters(filters: OffplanFilters) {
  return Boolean(
    filters.q ||
      filters.minPrice != null ||
      filters.maxPrice != null ||
      filters.beds != null ||
      filters.construction ||
      filters.developer,
  );
}

export function offplanQueryArgs(filters: OffplanFilters) {
  return {
    ...(filters.q ? { q: filters.q } : {}),
    ...(filters.minPrice != null ? { minPrice: filters.minPrice } : {}),
    ...(filters.maxPrice != null ? { maxPrice: filters.maxPrice } : {}),
    ...(filters.beds != null ? { beds: filters.beds } : {}),
    ...(filters.construction ? { construction: filters.construction } : {}),
    ...(filters.developer ? { developer: filters.developer } : {}),
  };
}

export function offplanSearchHref(filters: OffplanFilters = {}, page = 1) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.minPrice != null) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice != null) params.set("maxPrice", String(filters.maxPrice));
  if (filters.beds != null) params.set("beds", String(filters.beds));
  if (filters.construction) params.set("construction", filters.construction);
  if (filters.developer) params.set("developer", filters.developer);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/projects?${query}` : "/projects";
}

export function offplanAbsoluteUrl(locale: AppLocale, page = 1) {
  return `${siteUrl}/${locale}${offplanSearchHref({}, page)}`;
}

export function offplanLanguageAlternates(page = 1): Record<string, string> {
  return {
    ...Object.fromEntries(routing.locales.map((locale) => [locale, offplanAbsoluteUrl(locale, page)])),
    "x-default": offplanAbsoluteUrl("en", page),
  };
}
