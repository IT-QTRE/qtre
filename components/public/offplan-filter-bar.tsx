"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { SearchIcon } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { formatAed } from "@/lib/format/aed";
import { COUNT_PRESETS, SALE_PRICE_PRESETS, presetIdFromRange, rangeFromPreset, type RangePreset } from "@/lib/catalog-filter-presets";
import { pickLocalized, type LocalizedText } from "@/lib/i18n/localized";
import { publicGutter } from "@/lib/public-layout";
import {
  CONSTRUCTION_CATALOG_KEYS,
  OFFPLAN_CONSTRUCTION,
  offplanHasNarrowingFilters,
  offplanSearchHref,
  type OffplanFilters,
} from "@/lib/seo/offplan-catalog";
import type { AppLocale } from "@/i18n/routing";
import { useCatalogChrome } from "@/components/public/catalog-chrome";
import { PlaceSearchField } from "@/components/public/place-search-field";
import { cn } from "@/lib/utils";

const chipTrigger =
  "h-11 min-h-11 min-w-28 touch-manipulation rounded-lg border border-border bg-background px-3 shadow-none data-[size=default]:h-11";

type Draft = {
  query: string;
  priceId: string;
  beds: string;
  construction: string;
  developer: string;
};

export function OffplanFilterBar({
  filters,
  developers,
}: {
  filters: OffplanFilters;
  developers: { slug: string; name: LocalizedText }[];
}) {
  const t = useTranslations("catalog");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const { setFilterReachesNav } = useCatalogChrome();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(filters.q ?? "");
  const [priceId, setPriceId] = useState(presetIdFromRange(SALE_PRICE_PRESETS, filters.minPrice, filters.maxPrice));
  const [beds, setBeds] = useState(filters.beds == null ? "any" : String(Math.min(filters.beds, 4)));
  const [construction, setConstruction] = useState(filters.construction ?? "any");
  const [developer, setDeveloper] = useState(filters.developer ?? "any");

  const clearHref = offplanSearchHref();
  const hasFilters = offplanHasNarrowingFilters(filters);
  const priceCustomLabel = customRangeLabel(filters.minPrice, filters.maxPrice, (n) => formatAed(n, locale), t);
  const developerOptions = [
    { value: "any", label: t("filterAny") },
    ...developers
      .map((row) => ({
        value: row.slug,
        label: pickLocalized(row.name, locale),
      }))
      .toSorted((a, b) => a.label.localeCompare(b.label, locale)),
  ];
  if (filters.developer && !developerOptions.some((row) => row.value === filters.developer)) {
    developerOptions.push({ value: filters.developer, label: filters.developer });
  }

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
    setPriceId(presetIdFromRange(SALE_PRICE_PRESETS, filters.minPrice, filters.maxPrice));
    setBeds(filters.beds == null ? "any" : String(Math.min(filters.beds, 4)));
    setConstruction(filters.construction ?? "any");
    setDeveloper(filters.developer ?? "any");
  }, [filters.q, filters.minPrice, filters.maxPrice, filters.beds, filters.construction, filters.developer]);

  function hrefFromDraft(draft: Draft) {
    const price =
      draft.priceId === "custom"
        ? { min: filters.minPrice, max: filters.maxPrice }
        : rangeFromPreset(SALE_PRICE_PRESETS, draft.priceId);
    return offplanSearchHref({
      q: draft.query,
      minPrice: price.min,
      maxPrice: price.max,
      beds: draft.beds === "any" ? undefined : Number(draft.beds),
      construction: draft.construction === "any" ? undefined : (draft.construction as OffplanFilters["construction"]),
      developer: draft.developer === "any" ? undefined : draft.developer,
    });
  }

  function apply(patch: Partial<Draft>) {
    const draft: Draft = { query, priceId, beds, construction, developer, ...patch };
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
              id="offplan-location"
              kind="offplan"
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
              label={t("filterStartingPrice")}
              value={priceId}
              onValueChange={(next) => {
                setPriceId(next);
                apply({ priceId: next });
              }}
              options={[
                ...SALE_PRICE_PRESETS.map((preset) => ({
                  value: preset.id,
                  label: rangeLabel(preset, (n) => formatAed(n, locale), t("filterAny"), t),
                })),
                ...(priceId === "custom" && priceCustomLabel ? [{ value: "custom", label: priceCustomLabel }] : []),
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
              label={t("filterConstruction")}
              value={construction}
              onValueChange={(next) => {
                setConstruction(next);
                apply({ construction: next });
              }}
              options={[
                { value: "any", label: t("filterAny") },
                ...OFFPLAN_CONSTRUCTION.map((value) => ({
                  value,
                  label: t(CONSTRUCTION_CATALOG_KEYS[value]),
                })),
              ]}
            />
            {developers.length > 0 || filters.developer ? (
              <FilterSelect
                label={t("filterDeveloper")}
                value={developer}
                onValueChange={(next) => {
                  setDeveloper(next);
                  apply({ developer: next });
                }}
                options={developerOptions}
              />
            ) : null}

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
