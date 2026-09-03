import type { ReactNode } from "react";
import Image from "next/image";
import { ChevronDown, ImageIcon, Maximize2 } from "lucide-react";
import type { AppLocale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { formatAed, formatAedRange } from "@/lib/format/aed";
import {
  formatMeasureRange,
  mergeRanges,
  numericRange,
  rangeFromEnds,
  sqftToSqm,
  sqmToSqft,
} from "@/lib/format/area";
import { bedroomTypeLabel, groupByBedroomType } from "@/lib/format/bedroom-types";
import { ListingSection } from "@/components/public/listing-section";

export type ProjectUnitRow = {
  href: string;
  title: string;
  baths: string | null;
  price: string | null;
  priceAmount: number;
  areaSqft: number;
  bedrooms: number;
  imageUrl: string | null;
};

export type ProjectUnitTypeSpec = {
  bedrooms: number;
  minAreaSqm: number | null;
  maxAreaSqm: number | null;
  minPrice: number | null;
  maxPrice: number | null;
};

function sizeLine(
  specSqm: { min: number; max: number } | null,
  unitSqft: { min: number; max: number } | null,
  locale: AppLocale,
  sqftUnit: string,
  sqmUnit: string,
) {
  const parts: string[] = [];
  if (specSqm) {
    parts.push(formatMeasureRange(sqmToSqft(specSqm.min), sqmToSqft(specSqm.max), locale, sqftUnit));
    parts.push(formatMeasureRange(specSqm.min, specSqm.max, locale, sqmUnit));
  } else if (unitSqft) {
    parts.push(formatMeasureRange(unitSqft.min, unitSqft.max, locale, sqftUnit));
    parts.push(formatMeasureRange(sqftToSqm(unitSqft.min), sqftToSqm(unitSqft.max), locale, sqmUnit));
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

const TYPE_GRID =
  "grid grid-cols-[minmax(5.5rem,7rem)_minmax(7.5rem,0.85fr)_minmax(0,1.35fr)_1.25rem] items-center gap-x-4 py-4 sm:grid-cols-[9rem_minmax(10rem,0.9fr)_minmax(0,1.4fr)_1.25rem] sm:gap-x-8";

function TypeRow({
  label,
  price,
  size,
  chevron,
}: {
  label: string;
  price: string | null;
  size: string | null;
  chevron?: ReactNode;
}) {
  return (
    <div className={TYPE_GRID}>
      <p className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">{label}</p>
      <p className="text-sm text-pretty tabular-nums text-foreground/80">{price}</p>
      {size ? (
        <p className="flex min-w-0 items-center gap-1.5 text-sm tabular-nums text-muted-foreground">
          <Maximize2 className="size-3.5 shrink-0 text-secondary" aria-hidden />
          <span className="min-w-0 text-pretty">{size}</span>
        </p>
      ) : (
        <span />
      )}
      <span className="flex size-5 items-center justify-center justify-self-end">{chevron}</span>
    </div>
  );
}

export function ProjectUnitTypes({
  heading,
  types,
  specs = [],
  studio,
  fourPlus,
  bedLabel,
  fromPrice,
  locale,
  sqftUnit,
  sqmUnit,
  units,
  listed,
}: {
  heading: string;
  types: number[];
  specs: ProjectUnitTypeSpec[];
  studio: string;
  fourPlus: string;
  bedLabel: (count: number) => string;
  fromPrice: (price: string) => string;
  locale: AppLocale;
  sqftUnit: string;
  sqmUnit: string;
  units: ProjectUnitRow[];
  listed?: string;
}) {
  const groups = groupByBedroomType(types, units);
  const specByType = new Map(specs.map((spec) => [spec.bedrooms, spec]));
  if (groups.length === 0) return null;

  return (
    <ListingSection title={heading} aside={listed}>
      <ul>
        {groups.map(({ type, items }) => {
          const label = type >= 1 && type <= 3 ? bedLabel(type) : bedroomTypeLabel(type, studio, fourPlus);
          const spec = specByType.get(type);
          const size = sizeLine(
            rangeFromEnds(spec?.minAreaSqm, spec?.maxAreaSqm),
            numericRange(items.map((item) => item.areaSqft)),
            locale,
            sqftUnit,
            sqmUnit,
          );
          const priceRange = mergeRanges(
            rangeFromEnds(spec?.minPrice, spec?.maxPrice),
            numericRange(items.map((item) => item.priceAmount)),
          );
          const price = !priceRange
            ? null
            : priceRange.min === priceRange.max
              ? fromPrice(formatAed(priceRange.min, locale))
              : formatAedRange(priceRange.min, priceRange.max, locale);
          const facts = [price, size].filter(Boolean).join(", ");

          if (items.length === 0) {
            return (
              <li key={type} className="border-t-2 border-secondary">
                <TypeRow label={label} price={price} size={size} />
              </li>
            );
          }

          return (
            <li key={type} className="border-t-2 border-secondary">
              <details className="group">
                <summary
                  aria-label={[label, facts].filter(Boolean).join(", ")}
                  className="min-h-11 cursor-pointer list-none touch-manipulation marker:hidden [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <TypeRow
                    label={label}
                    price={price}
                    size={size}
                    chevron={
                      <ChevronDown
                        className="size-5 text-primary transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                        aria-hidden
                      />
                    }
                  />
                </summary>
                <ul className="pb-4">
                  {items.map((item) => {
                    const unitSize = sizeLine(null, numericRange([item.areaSqft]), locale, sqftUnit, sqmUnit);
                    return (
                      <li key={item.href} className="border-t border-border">
                        <Link
                          href={item.href}
                          className="flex min-h-11 items-center gap-4 py-3 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-8"
                        >
                          <span className="relative aspect-4/3 w-27 shrink-0 overflow-hidden bg-accent sm:w-36">
                            {item.imageUrl ? (
                              <Image
                                src={item.imageUrl}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="(min-width: 640px) 9rem, 6.75rem"
                              />
                            ) : (
                              <span className="absolute inset-0 flex items-center justify-center text-foreground/50">
                                <ImageIcon className="size-5" aria-hidden />
                              </span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-heading text-base font-medium tracking-tight text-pretty">
                              {item.title}
                            </span>
                            {item.baths || unitSize ? (
                              <span className="mt-1 block text-sm text-pretty text-muted-foreground">
                                {[item.baths, unitSize].filter(Boolean).join(" · ")}
                              </span>
                            ) : null}
                          </span>
                          {item.price ? (
                            <span className="shrink-0 font-heading text-sm font-semibold tabular-nums text-primary sm:text-base">
                              {item.price}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </details>
            </li>
          );
        })}
      </ul>
    </ListingSection>
  );
}
