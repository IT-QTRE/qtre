import { describe, expect, it } from "vitest";
import {
  emptyPropertyFormValues,
  isSameLocationValue,
  toPropertyFormValues,
} from "./property-form-values";

const compactSaved = {
  title: { en: "Marina loft" },
  description: { en: "Bright 2BR" },
  price: 1_200_000,
  bedrooms: 2,
  bathrooms: 2,
  areaSqft: 1450,
  city: { en: "Dubai" },
  countryCode: "AE",
  listingStatus: "for_sale" as const,
  publishing: { slug: "marina-loft", status: "published" as const },
};

describe("toPropertyFormValues", () => {
  it("fills locale and SEO blanks so a just-published listing matches the mounted form", () => {
    expect(toPropertyFormValues(compactSaved)).toEqual({
      title: { en: "Marina loft", ar: "", tr: "" },
      description: { en: "Bright 2BR", ar: "", tr: "" },
      price: "1200000",
      bedrooms: "2",
      bathrooms: "2",
      areaSqft: "1450",
      city: { en: "Dubai", ar: "", tr: "" },
      countryCode: "AE",
      address: "",
      placeId: undefined,
      coordinates: undefined,
      listingStatus: "for_sale",
      propertyType: undefined,
      furnishing: undefined,
      rentalPeriod: undefined,
      amenities: [],
      communityId: undefined,
      developerId: undefined,
      projectId: undefined,
      agentId: undefined,
      seo: {
        seoTitle: { en: "", ar: "", tr: "" },
        seoDescription: { en: "", ar: "", tr: "" },
        canonicalPath: "",
      },
      slug: "marina-loft",
      status: "published",
    });
  });

  it("keeps filled SEO, extra locales, and a saved pin", () => {
    expect(
      toPropertyFormValues({
        ...compactSaved,
        title: { en: "Marina loft", ar: "لوفت" },
        address: "Marina Heights",
        placeId: "ChIJ123",
        coordinates: { lat: 25.07, lng: 55.14 },
        amenities: ["pool"],
        seo: {
          seoTitle: { en: "Loft | QTRE" },
          canonicalPath: "/properties/marina-loft",
        },
      }),
    ).toMatchObject({
      title: { en: "Marina loft", ar: "لوفت", tr: "" },
      address: "Marina Heights",
      placeId: "ChIJ123",
      amenities: ["pool"],
      seo: {
        seoTitle: { en: "Loft | QTRE", ar: "", tr: "" },
        seoDescription: { en: "", ar: "", tr: "" },
        canonicalPath: "/properties/marina-loft",
      },
    });
  });

  it("keeps saved type, furnishing, and rental period", () => {
    expect(
      toPropertyFormValues({
        ...compactSaved,
        listingStatus: "for_rent",
        propertyType: "apartment",
        furnishing: "unfurnished",
        rentalPeriod: "yearly",
      }),
    ).toMatchObject({
      listingStatus: "for_rent",
      propertyType: "apartment",
      furnishing: "unfurnished",
      rentalPeriod: "yearly",
    });
  });
});

describe("emptyPropertyFormValues", () => {
  it("uses the same empty locale and SEO shape as a mounted create form", () => {
    expect(emptyPropertyFormValues.seo).toEqual({
      seoTitle: { en: "", ar: "", tr: "" },
      seoDescription: { en: "", ar: "", tr: "" },
      canonicalPath: "",
    });
    expect(emptyPropertyFormValues.title).toEqual({ en: "", ar: "", tr: "" });
  });
});

describe("isSameLocationValue", () => {
  it("treats an unchanged pin as the same location", () => {
    expect(
      isSameLocationValue(
        { address: "Marina Heights", placeId: "ChIJ", coordinates: { lat: 1, lng: 2 } },
        { address: "Marina Heights", placeId: "ChIJ", coordinates: { lat: 1, lng: 2 } },
      ),
    ).toBe(true);
  });

  it("does not treat a cleared placeId as the same pin", () => {
    expect(
      isSameLocationValue(
        { address: "Marina Heights", placeId: "ChIJ", coordinates: { lat: 1, lng: 2 } },
        { address: "Marina Heights", coordinates: { lat: 1, lng: 2 } },
      ),
    ).toBe(false);
  });
});
