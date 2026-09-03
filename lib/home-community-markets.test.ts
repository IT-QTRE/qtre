import { describe, expect, it } from "vitest";
import { defaultMarketCode } from "./constants/countries";
import {
  communitiesHref,
  groupFeaturedCommunities,
  marketCodesFromCommunities,
  marketLabelKey,
  resolveMarketCode,
} from "./home-community-markets";

function card(
  overrides: Partial<{
    _id: string;
    slug: string;
    countryCode: string;
    name: string;
    city: string;
    imageUrl: string | null;
  }>,
) {
  const slug = overrides.slug ?? "marina";
  return {
    _id: overrides._id ?? slug,
    slug,
    countryCode: overrides.countryCode ?? "AE",
    name: { en: overrides.name ?? "Marina" },
    city: { en: overrides.city ?? "Dubai" },
    imageUrl: overrides.imageUrl === undefined ? `https://cdn.example/${slug}.jpg` : overrides.imageUrl,
  };
}

describe("groupFeaturedCommunities", () => {
  it("drops areas without a photo and groups the rest by market", () => {
    const markets = groupFeaturedCommunities(
      [
        card({ slug: "sukhumvit", countryCode: "TH", name: "Sukhumvit", city: "Bangkok" }),
        card({ slug: "no-photo", countryCode: "AE", imageUrl: null }),
        card({ slug: "marina", countryCode: "AE", name: "Marina" }),
      ],
      "en",
    );

    expect(markets.map((market) => market.countryCode)).toEqual(["AE", "TH"]);
    expect(markets[0]?.slides.map((slide) => slide.name)).toEqual(["Marina"]);
    expect(markets[1]?.slides[0]?.href).toBe("/communities/sukhumvit");
  });

  it("puts curated markets before an unknown country code", () => {
    const markets = groupFeaturedCommunities(
      [card({ slug: "lisbon", countryCode: "PT" }), card({ slug: "marina", countryCode: "AE" })],
      "en",
    );
    expect(markets.map((market) => market.countryCode)).toEqual(["AE", "PT"]);
  });
});

describe("defaultMarketCode", () => {
  it("prefers UAE when that market is present", () => {
    expect(defaultMarketCode(["TR", "AE", "TH"])).toBe("AE");
    expect(defaultMarketCode(["TH", "TR"])).toBe("TH");
    expect(defaultMarketCode([])).toBeUndefined();
  });
});

describe("marketLabelKey", () => {
  it("maps curated codes and leaves unknown codes to the caller", () => {
    expect(marketLabelKey("AE")).toBe("marketAE");
    expect(marketLabelKey("PT")).toBeNull();
  });
});

describe("communitiesHref", () => {
  it("puts the market on the directory as a query", () => {
    expect(communitiesHref()).toBe("/communities");
    expect(communitiesHref("TH")).toBe("/communities?market=TH");
  });
});

describe("resolveMarketCode", () => {
  it("keeps a valid request, otherwise defaults to UAE then the first curated code", () => {
    expect(resolveMarketCode("TH", ["AE", "TH"])).toBe("TH");
    expect(resolveMarketCode("XX", ["TH", "AE"])).toBe("AE");
    expect(resolveMarketCode(undefined, ["TR", "TH"])).toBe("TH");
    expect(resolveMarketCode("AE", [])).toBeUndefined();
  });
});

describe("marketCodesFromCommunities", () => {
  it("dedupes and follows curated order", () => {
    expect(
      marketCodesFromCommunities([{ countryCode: "TR" }, { countryCode: "AE" }, { countryCode: "TR" }]),
    ).toEqual(["AE", "TR"]);
  });
});
