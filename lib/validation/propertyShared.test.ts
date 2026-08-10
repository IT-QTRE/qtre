import { describe, expect, it } from "vitest";
import { propertySharedFactsSchema } from "./propertyShared";

describe("propertySharedFactsSchema", () => {
  it("rejects negative price/bedrooms/bathrooms/areaSqft", () => {
    const base = { price: 100, bedrooms: 1, bathrooms: 1, areaSqft: 100, countryCode: "AE" };
    expect(propertySharedFactsSchema.safeParse(base).success).toBe(true);
    expect(propertySharedFactsSchema.safeParse({ ...base, price: -1 }).success).toBe(false);
  });

  it("requires a 2-letter uppercase countryCode", () => {
    const base = { price: 100, bedrooms: 1, bathrooms: 1, areaSqft: 100 };
    expect(propertySharedFactsSchema.safeParse({ ...base, countryCode: "AE" }).success).toBe(true);
    expect(propertySharedFactsSchema.safeParse({ ...base, countryCode: "ae" }).success).toBe(false);
    expect(propertySharedFactsSchema.safeParse({ ...base, countryCode: "UAE" }).success).toBe(false);
  });
});
