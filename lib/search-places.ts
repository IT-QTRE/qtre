import { pickLocalized, type LocalizedText } from "./i18n/localized";
import type { AppLocale } from "../i18n/routing";

export type SearchPlaceKind = "for_sale" | "for_rent" | "offplan";

export type SearchPlace = {
  _id: string;
  name: LocalizedText;
  city: LocalizedText;
};

export const SEARCH_PLACE_LIMIT = 8;

export function searchPlaceKind(intent: "buy" | "rent" | "offplan" | "sale"): SearchPlaceKind {
  if (intent === "rent") return "for_rent";
  if (intent === "offplan") return "offplan";
  return "for_sale";
}

export function filterSearchPlaces(
  places: SearchPlace[],
  query: string,
  locale: AppLocale,
  limit = SEARCH_PLACE_LIMIT,
) {
  const needle = query.trim().toLowerCase();
  const rows = places.map((place) => ({
    ...place,
    label: pickLocalized(place.name, locale),
    cityLabel: pickLocalized(place.city, locale),
  }));
  const matched = needle
    ? rows.filter(
        (place) =>
          place.label.toLowerCase().includes(needle) || place.cityLabel.toLowerCase().includes(needle),
      )
    : rows;
  return matched.slice(0, limit);
}
