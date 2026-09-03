import { Children, type CSSProperties, type ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { pickLocalized, type LocalizedText } from "@/lib/i18n/localized";
import { formatAed } from "@/lib/format/aed";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ListingCardView, type ListingCardViewModel } from "@/components/public/listing-card-view";
import { formatBedroomTypes } from "@/lib/format/bedroom-types";
import { formatCompletionDate, type CompletionDate } from "@/lib/format/completion-date";
import { CONSTRUCTION_CATALOG_KEYS } from "@/lib/seo/offplan-catalog";

export type ListingCardModel = {
  href: string;
  title: LocalizedText;
  location: LocalizedText;
  price: number | null;
  pricePrefix?: boolean;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  listingStatus?: "for_sale" | "for_rent" | "sold" | "rented" | "off_market" | "offplan";
  constructionStatus?: "upcoming" | "under_construction" | "completed";
  completionDate?: CompletionDate | null;
  bedroomTypes?: number[];
  developerName?: LocalizedText | null;
  imageUrl: string | null;
  imageAlt: LocalizedText | null;
  description?: LocalizedText;
};

export function ListingRail({
  children,
  label,
  compact = false,
}: {
  children: ReactNode;
  label?: string;
  compact?: boolean;
}) {
  return (
    <div
      role={label ? "region" : undefined}
      aria-label={label}
      className={cn(
        "qtre-stagger mt-10 flex gap-4 overflow-x-auto overscroll-x-contain pb-3 touch-pan-x",
        "snap-x snap-mandatory scrollbar-none",
        "sm:grid sm:grid-cols-2 sm:gap-10 sm:overflow-visible sm:pb-0 sm:touch-auto lg:grid-cols-3",
      )}
    >
      {Children.map(children, (child, index) => (
        <div
          className={cn(
            "shrink-0 snap-start sm:w-auto sm:min-w-0 sm:snap-align-none",
            compact ? "w-[min(72%,17.5rem)]" : "w-[min(85%,20rem)]",
          )}
          style={{ "--i": index } as CSSProperties}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

function statusLabel(
  listingStatus: ListingCardModel["listingStatus"],
  forSale: string,
  forRent: string,
  offplan: string,
) {
  if (listingStatus === "for_rent") return forRent;
  if (listingStatus === "for_sale") return forSale;
  if (listingStatus === "offplan") return offplan;
  return null;
}

function excerptLocalized(text: LocalizedText | undefined, locale: AppLocale) {
  if (!text) return undefined;
  const excerpt = pickLocalized(text, locale).replace(/\s+/g, " ").trim();
  return excerpt || undefined;
}

export function listingCardViewFrom(
  listing: ListingCardModel,
  locale: AppLocale,
  t: (key: string, values?: Record<string, string | number>) => string,
): ListingCardViewModel {
  const title = pickLocalized(listing.title, locale);
  const constructionLabel = listing.constructionStatus
    ? t(CONSTRUCTION_CATALOG_KEYS[listing.constructionStatus])
    : undefined;
  const developerName = listing.developerName ? pickLocalized(listing.developerName, locale).trim() : "";
  const bedroomMix =
    listing.bedroomTypes && listing.bedroomTypes.length > 0
      ? formatBedroomTypes(listing.bedroomTypes, t("studio"), t("bedsPlus"))
      : undefined;
  const completionLabel = listing.completionDate
    ? formatCompletionDate(listing.completionDate, locale)
    : undefined;
  return {
    href: listing.href,
    title,
    location: pickLocalized(listing.location, locale),
    alt: listing.imageAlt ? pickLocalized(listing.imageAlt, locale) : title,
    priceLabel:
      listing.price != null
        ? listing.pricePrefix
          ? t("fromPrice", { price: formatAed(listing.price, locale) })
          : formatAed(listing.price, locale)
        : null,
    developerBy: developerName ? t("byDeveloper", { name: developerName }) : undefined,
    bedsLabel: bedroomMix ? t("unitTypes") : listing.bedrooms != null ? t("beds", { count: listing.bedrooms }) : undefined,
    bathsLabel: listing.bathrooms != null ? t("baths", { count: listing.bathrooms }) : undefined,
    areaLabel: listing.areaSqft != null ? t("area", { area: listing.areaSqft }) : undefined,
    bedsMix: bedroomMix,
    bedsValue: bedroomMix ? undefined : listing.bedrooms,
    bathsValue: listing.bathrooms,
    areaValue: listing.areaSqft != null ? new Intl.NumberFormat(locale).format(listing.areaSqft) : undefined,
    areaUnit: listing.areaSqft != null ? t("areaUnit") : undefined,
    completionLabel,
    completionAria: completionLabel ? t("completion", { date: completionLabel }) : undefined,
    badgeText: constructionLabel ?? statusLabel(listing.listingStatus, t("forSale"), t("forRent"), t("offplan")),
    imageUrl: listing.imageUrl,
    placeholderImage: t("placeholderImage"),
    description: excerptLocalized(listing.description, locale),
  };
}

export async function ListingCard({
  listing,
  headingLevel = "h3",
  layout = "grid",
  priority = false,
}: {
  listing: ListingCardModel;
  headingLevel?: "h2" | "h3";
  layout?: "grid" | "list";
  priority?: boolean;
}) {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("catalog");
  const view = listingCardViewFrom(listing, locale, t);
  return <ListingCardView listing={view} headingLevel={headingLevel} layout={layout} priority={priority} />;
}
