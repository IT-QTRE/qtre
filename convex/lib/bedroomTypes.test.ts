import { describe, expect, it } from "vitest";
import { normalizeBedroomTypes, normalizeUnitTypes } from "./bedroomTypes";

describe("normalizeUnitTypes", () => {
  it("sorts, uniques, and keeps optional ranges", () => {
    expect(
      normalizeUnitTypes([
        { bedrooms: 2, minAreaSqm: 88, maxAreaSqm: 70, minPrice: 1_800_000 },
        { bedrooms: 2, minPrice: 1_500_000, maxPrice: 1_900_000 },
        { bedrooms: 0, minAreaSqft: 450 },
        { bedrooms: 5 },
      ]),
    ).toEqual([
      { bedrooms: 0, minAreaSqm: 42 },
      { bedrooms: 2, minPrice: 1_500_000, maxPrice: 1_900_000 },
      { bedrooms: 4 },
    ]);
  });

  it("drops empty specs after bedroom normalization", () => {
    expect(normalizeBedroomTypes([0, 2])).toEqual([0, 2]);
    expect(normalizeUnitTypes([])).toEqual([]);
    expect(normalizeUnitTypes(undefined)).toEqual([]);
  });
});
