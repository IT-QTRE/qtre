import { describe, expect, it } from "vitest";
import { propertySchema } from "./properties";

describe("propertySchema", () => {
  it("accepts a full valid property and rejects one missing translated title", () => {
    const valid = {
      price: 2_500_000,
      bedrooms: 3,
      bathrooms: 2,
      areaSqft: 1800,
      countryCode: "AE",
      title: { en: "Marina View Apartment" },
      description: { en: "A stunning apartment with marina views." },
      city: { en: "Dubai" },
      listingStatus: "for_sale",
      publishing: { slug: "marina-view-apartment", status: "published", updatedAt: Date.now() },
    };
    expect(propertySchema.safeParse(valid).success).toBe(true);
    const { title: _title, ...missingTitle } = valid;
    expect(propertySchema.safeParse(missingTitle).success).toBe(false);
  });

  it("restricts listingStatus to the five known values", () => {
    const base = {
      price: 1,
      bedrooms: 1,
      bathrooms: 1,
      areaSqft: 1,
      countryCode: "AE",
      title: { en: "x" },
      description: { en: "x" },
      city: { en: "x" },
      publishing: { slug: "x", status: "published", updatedAt: Date.now() },
    };
    expect(propertySchema.safeParse({ ...base, listingStatus: "for_sale" }).success).toBe(true);
    expect(propertySchema.safeParse({ ...base, listingStatus: "leased" }).success).toBe(false);
  });
});
