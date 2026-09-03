"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { SearchIcon } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { formatAed } from "@/lib/format/aed";
import {
  COUNT_PRESETS,
  pricePresetsFor,
  presetIdFromRange,
  rangeFromPreset,
  SIZE_PRESETS,
  type RangePreset,
} from "@/lib/catalog-filter-presets";
import { publicGutter } from "@/lib/public-layout";
import {
  catalogHasNarrowingFilters,
  catalogSearchHref,
  type CatalogFilters,
  type CatalogIntent,
} from "@/lib/seo/catalog";
import type { AppLocale } from "@/i18n/routing";
import { useCatalogChrome } from "@/components/public/catalog-chrome";
import { PlaceSearchField } from "@/components/public/place-search-field";
import { cn } from "@/lib/utils";
import { searchPlaceKind } from "@/lib/search-places";

const chipTrigger =
  "h-11 min-h-11 min-w-28 touch-manipulation rounded-lg border border-border bg-background px-3 shadow-none data-[size=default]:h-11";

type Draft = {
  query: string;
  priceId: string;
  sizeId: string;
  beds: string;
  baths: string;
};

export function CatalogFilterBar({
  intent,
  filters,
}: {
  intent: CatalogIntent;
  filters: CatalogFilters;
}) {
  const t = useTranslations("catalog");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const { setFilterReachesNav } = useCatalogChrome();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const [isPending, startTransition] = useTransition();
  const pricePresets = pricePresetsFor(intent);

  const [query, setQuery] = useState(filters.q ?? "");
  const [priceId, setPriceId] = useState(presetIdFromRange(pricePresets, filters.minPrice, filters.maxPrice));
  const [sizeId, setSizeId] = useState(presetIdFromRange(SIZE_PRESETS, filters.minArea, filters.maxArea));
  const [beds, setBeds] = useState(filters.beds == null ? "any" : String(Math.min(filters.beds, 4)));
  const [baths, setBaths] = useState(filters.baths == null ? "any" : String(Math.min(filters.baths, 4)));

  const clearHref = catalogSearchHref(intent);
  const hasFilters = catalogHasNarrowingFilters(filters);
  const priceCustomLabel = customRangeLabel(
    filters.minPrice,
    filters.maxPrice,
    (n) => formatAed(n, locale),
    t,
  );
  const sizeCustomLabel = customRangeLabel(filters.minArea, filters.maxArea, (n) => t("area", { area: n }), t);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const header = document.querySelector("[data-site-header]");
    const headerHeight = header instanceof HTMLElement ? header.getBoundingClientRect().height : 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const reachesNav = !entry.isIntersecting;
        setStuck(reachesNav);
        setFilterReachesNav(reachesNav);
      },
      { threshold: 0, rootMargin: `-${Math.round(headerHeight)}px 0px 0px 0px` },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      setFilterReachesNav(false);
    };
  }, [setFilterReachesNav]);

  useEffect(() => {
    setQuery(filters.q ?? "");
    setPriceId(presetIdFromRange(pricePresetsFor(intent), filters.minPrice, filters.maxPrice));
    setSizeId(presetIdFromRange(SIZE_PRESETS, filters.minArea, filters.maxArea));
    setBeds(filters.beds == null ? "any" : String(Math.min(filters.beds, 4)));
    setBaths(filters.baths == null ? "any" : String(Math.min(filters.baths, 4)));
  }, [filters.q, filters.minPrice, filters.maxPrice, filters.minArea, filters.maxArea, filters.beds, filters.baths, intent]);

  function hrefFromDraft(draft: Draft) {
    const price =
      draft.priceId === "custom"
        ? { min: filters.minPrice, max: filters.maxPrice }
        : rangeFromPreset(pricePresets, draft.priceId);
    const size =
      draft.sizeId === "custom"
        ? { min: filters.minArea, max: filters.maxArea }
        : rangeFromPreset(SIZE_PRESETS, draft.sizeId);
    return catalogSearchHref(intent, {
      q: draft.query,
      minPrice: price.min,
      maxPrice: price.max,
      minArea: size.min,
      maxArea: size.max,
      beds: draft.beds === "any" ? undefined : Number(draft.beds),
      baths: draft.baths === "any" ? undefined : Number(draft.baths),
    });
  }

  function apply(patch: Partial<Draft>) {
    const draft: Draft = {
      query,
      priceId,
      sizeId,
      beds,
      baths,
      ...patch,
    };
    startTransition(() => {
      router.push(hrefFromDraft(draft), { scroll: false });
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    apply({ query });
  }

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px" />
      <div
        className={cn(
          "sticky top-0 z-50 border-y border-border bg-background transition-shadow duration-200 ease-out motion-reduce:transition-none",
          stuck && "shadow-[0_12px_32px_color-mix(in_oklab,var(--foreground)_12%,transparent)]",
        )}
      >
        <form
          onSubmit={onSubmit}
          aria-busy={isPending}
          className={cn("flex flex-col gap-2 py-3 sm:flex-row sm:flex-wrap sm:items-center", publicGutter, stuck && "pt-4")}
        >
          <div className="flex min-h-11 w-full min-w-0 items-center gap-2 rounded-lg border border-border bg-background px-3 sm:min-w-52 sm:flex-1">
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <PlaceSearchField
              id="catalog-location"
              kind={searchPlaceKind(intent === "rent" ? "rent" : "sale")}
              value={query}
              onChange={setQuery}
              onPick={(name) => {
                setQuery(name);
                apply({ query: name });
              }}
              placeholder={t("filterPlaceholder")}
              label={t("filterLocation")}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label={t("filterPrice")}
              value={priceId}
              onValueChange={(next) => {
                setPriceId(next);
                apply({ priceId: next });
              }}
              options={[
                ...pricePresets.map((preset) => ({
                  value: preset.id,
                  label: rangeLabel(preset, (n) => formatAed(n, locale), t("filterAny"), t),
                })),
                ...(priceId === "custom" && priceCustomLabel
                  ? [{ value: "custom", label: priceCustomLabel }]
                  : []),
              ]}
            />
            <FilterSelect
              label={t("filterBeds")}
              value={beds}
              onValueChange={(next) => {
                setBeds(next);
                apply({ beds: next });
              }}
              options={COUNT_PRESETS.map((value) => ({
                value,
                label: countLabel(value, t("filterAny"), t("filterStudio"), t("filterCountPlus", { count: 4 }), (n) =>
                  t("beds", { count: n }),
                ),
              }))}
            />
            <FilterSelect
              label={t("filterSize")}
              value={sizeId}
              onValueChange={(next) => {
                setSizeId(next);
                apply({ sizeId: next });
              }}
              options={[
                ...SIZE_PRESETS.map((preset) => ({
                  value: preset.id,
                  label: rangeLabel(preset, (n) => t("area", { area: n }), t("filterAny"), t),
                })),
                ...(sizeId === "custom" && sizeCustomLabel
                  ? [{ value: "custom", label: sizeCustomLabel }]
                  : []),
              ]}
            />
            <FilterSelect
              label={t("filterBaths")}
              value={baths}
              onValueChange={(next) => {
                setBaths(next);
                apply({ baths: next });
              }}
              options={COUNT_PRESETS.filter((value) => value !== "0").map((value) => ({
                value,
                label:
                  value === "any"
                    ? t("filterBathsAny")
                    : countLabel(value, t("filterAny"), t("filterStudio"), t("filterCountPlus", { count: 4 }), (n) =>
                        t("baths", { count: n }),
                      ),
              }))}
            />

            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "inline-flex min-h-11 shrink-0 cursor-pointer touch-manipulation items-center gap-2 rounded-lg bg-primary px-4 font-heading text-sm font-semibold tracking-tight text-primary-foreground",
                "transition-colors duration-200 ease-out motion-reduce:transition-none hover:bg-primary/90",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:cursor-wait disabled:opacity-80",
              )}
            >
              <SearchIcon className="size-4" aria-hidden />
              {isPending ? t("filterApplying") : t("filterApply")}
            </button>

            {hasFilters ? (
              <Link
                href={clearHref}
                scroll={false}
                className="inline-flex min-h-11 shrink-0 touch-manipulation items-center px-2 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("filterClear")}
              </Link>
            ) : null}
          </div>
        </form>
      </div>
    </>
  );
}

function FilterSelect({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const selected = options.find((option) => option.value === value);

  return (
    <Select value={value} onValueChange={(next) => onValueChange(next ?? "any")}>
      <SelectTrigger aria-label={label} className={chipTrigger}>
        <span className="truncate">{selected && selected.value !== "any" ? selected.label : label}</span>
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false} className="min-w-48">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function rangeLabel(
  preset: RangePreset,
  format: (n: number) => string,
  anyLabel: string,
  t: ReturnType<typeof useTranslations>,
) {
  return customRangeLabel(preset.min, preset.max, format, t) ?? anyLabel;
}

function customRangeLabel(
  min: number | undefined,
  max: number | undefined,
  format: (n: number) => string,
  t: ReturnType<typeof useTranslations>,
) {
  if (min == null && max == null) return null;
  if (min == null && max != null) return t("filterUnder", { value: format(max) });
  if (min != null && max == null) return t("filterPlus", { value: format(min) });
  return t("filterRange", { min: format(min!), max: format(max!) });
}

function countLabel(
  value: string,
  anyLabel: string,
  studioLabel: string,
  plusLabel: string,
  numbered: (n: number) => string,
) {
  if (value === "any") return anyLabel;
  if (value === "0") return studioLabel;
  if (value === "4") return plusLabel;
  return numbered(Number(value));
}
