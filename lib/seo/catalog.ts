import { routing, type AppLocale } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";

export type CatalogIntent = "sale" | "rent";

export type CatalogFilters = {
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  minArea?: number;
  maxArea?: number;
};

export function catalogIntentFromStatus(status: string | undefined): CatalogIntent {
  return status === "rent" ? "rent" : "sale";
}

export function catalogListingStatus(intent: CatalogIntent) {
  return intent === "rent" ? "for_rent" : "for_sale";
}

function optionalInt(value: string | undefined) {
  if (!value?.trim()) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.floor(n);
}

export function catalogFiltersFromSearch(search: {
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  beds?: string;
  baths?: string;
  minArea?: string;
  maxArea?: string;
}): CatalogFilters {
  return {
    q: search.q?.trim() || undefined,
    minPrice: optionalInt(search.minPrice),
    maxPrice: optionalInt(search.maxPrice),
    beds: optionalInt(search.beds),
    baths: optionalInt(search.baths),
    minArea: optionalInt(search.minArea),
    maxArea: optionalInt(search.maxArea),
  };
}

export function catalogHasNarrowingFilters(filters: CatalogFilters) {
  return Boolean(
    filters.q ||
      filters.minPrice != null ||
      filters.maxPrice != null ||
      filters.beds != null ||
      filters.baths != null ||
      filters.minArea != null ||
      filters.maxArea != null,
  );
}

export function catalogQueryArgs(filters: CatalogFilters) {
  return {
    ...(filters.q ? { q: filters.q } : {}),
    ...(filters.minPrice != null ? { minPrice: filters.minPrice } : {}),
    ...(filters.maxPrice != null ? { maxPrice: filters.maxPrice } : {}),
    ...(filters.beds != null ? { beds: filters.beds } : {}),
    ...(filters.baths != null ? { baths: filters.baths } : {}),
    ...(filters.minArea != null ? { minArea: filters.minArea } : {}),
    ...(filters.maxArea != null ? { maxArea: filters.maxArea } : {}),
  };
}

export function catalogSearchHref(intent: CatalogIntent, filters: CatalogFilters = {}, page = 1) {
  const params = new URLSearchParams();
  params.set("status", intent);
  if (filters.q) params.set("q", filters.q);
  if (filters.minPrice != null) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice != null) params.set("maxPrice", String(filters.maxPrice));
  if (filters.beds != null) params.set("beds", String(filters.beds));
  if (filters.baths != null) params.set("baths", String(filters.baths));
  if (filters.minArea != null) params.set("minArea", String(filters.minArea));
  if (filters.maxArea != null) params.set("maxArea", String(filters.maxArea));
  if (page > 1) params.set("page", String(page));
  return `/properties?${params.toString()}`;
}

export function catalogAbsoluteUrl(locale: AppLocale, intent: CatalogIntent, page = 1) {
  return `${siteUrl}/${locale}${catalogSearchHref(intent, {}, page)}`;
}

export function catalogLanguageAlternates(intent: CatalogIntent, page = 1): Record<string, string> {
  return {
    ...Object.fromEntries(routing.locales.map((locale) => [locale, catalogAbsoluteUrl(locale, intent, page)])),
    "x-default": catalogAbsoluteUrl("en", intent, page),
  };
}
