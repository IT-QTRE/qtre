import { compareMarketCodes, defaultMarketCode } from "@/lib/constants/countries";
import { pickLocalized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/i18n/routing";
import type { CommunitySlide } from "@/components/public/community-showcase";

export const MARKET_LABEL_KEYS = {
  AE: "marketAE",
  TH: "marketTH",
  TR: "marketTR",
  PH: "marketPH",
  LV: "marketLV",
  GB: "marketGB",
} as const;

export type FeaturedCommunityCard = {
  _id: string;
  slug: string;
  countryCode: string;
  name: { en: string; ar?: string; tr?: string };
  city: { en: string; ar?: string; tr?: string };
  imageUrl: string | null;
};

export type HomeCommunityMarket = {
  countryCode: string;
  slides: CommunitySlide[];
};

export function marketLabelKey(code: string): (typeof MARKET_LABEL_KEYS)[keyof typeof MARKET_LABEL_KEYS] | null {
  if (code in MARKET_LABEL_KEYS) return MARKET_LABEL_KEYS[code as keyof typeof MARKET_LABEL_KEYS];
  return null;
}

export function groupFeaturedCommunities(
  communities: FeaturedCommunityCard[],
  locale: AppLocale,
): HomeCommunityMarket[] {
  const byCountry = new Map<string, CommunitySlide[]>();
  for (const community of communities) {
    if (!community.imageUrl) continue;
    const slides = byCountry.get(community.countryCode) ?? [];
    slides.push({
      id: community._id,
      name: pickLocalized(community.name, locale),
      city: pickLocalized(community.city, locale),
      href: `/communities/${community.slug}`,
      imageUrl: community.imageUrl,
    });
    byCountry.set(community.countryCode, slides);
  }

  return [...byCountry.entries()]
    .sort(([a], [b]) => compareMarketCodes(a, b))
    .map(([countryCode, slides]) => ({ countryCode, slides }));
}

export function communitiesHref(market?: string | null) {
  if (!market) return "/communities";
  return `/communities?market=${encodeURIComponent(market)}`;
}

export function marketCodesFromCommunities(communities: { countryCode: string }[]): string[] {
  const codes = [...new Set(communities.map((community) => community.countryCode))];
  return codes.sort(compareMarketCodes);
}

export function resolveMarketCode(
  requested: string | undefined,
  codes: readonly string[],
): string | undefined {
  if (codes.length === 0) return undefined;
  if (requested && codes.includes(requested)) return requested;
  return defaultMarketCode(codes) ?? codes[0];
}

export function marketChipClassName(selected: boolean, tone: "onPrimary" | "onPaper") {
  const base =
    "inline-flex min-h-12 cursor-pointer items-center rounded-md border px-4 font-heading text-base font-medium tracking-tight touch-manipulation focus-visible:outline-none focus-visible:ring-2";
  if (selected) {
    return `${base} border-secondary bg-secondary text-primary focus-visible:ring-secondary`;
  }
  if (tone === "onPrimary") {
    return `${base} border-primary-foreground/55 bg-transparent text-primary-foreground hover:border-secondary hover:text-secondary focus-visible:ring-secondary`;
  }
  return `${base} border-border bg-background text-foreground hover:border-secondary hover:text-primary focus-visible:ring-ring`;
}

export { defaultMarketCode };
