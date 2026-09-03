import { describe, expect, it } from "vitest";
import { bedroomTypeOf, formatBedroomTypes, groupByBedroomType, normalizeBedroomTypes } from "./bedroom-types";

describe("normalizeBedroomTypes", () => {
  it("uniques, sorts, and caps 4+", () => {
    expect(normalizeBedroomTypes([3, 1, 1, 5, 0])).toEqual([0, 1, 3, 4]);
  });

  it("drops non-integers", () => {
    expect(normalizeBedroomTypes([1.5, -1, 2])).toEqual([2]);
  });
});

describe("bedroomTypeOf", () => {
  it("buckets 4 and above as 4+", () => {
    expect(bedroomTypeOf(0)).toBe(0);
    expect(bedroomTypeOf(2)).toBe(2);
    expect(bedroomTypeOf(5)).toBe(4);
    expect(bedroomTypeOf(-1)).toBeNull();
  });
});

describe("groupByBedroomType", () => {
  it("keeps project types with empty lists when no units are linked", () => {
    expect(groupByBedroomType([0, 2], [])).toEqual([
      { type: 0, items: [] },
      { type: 2, items: [] },
    ]);
  });

  it("keeps selected types even when some have no linked units", () => {
    const grouped = groupByBedroomType(
      [0, 1, 2],
      [
        { id: "a", bedrooms: 1 },
        { id: "b", bedrooms: 5 },
      ],
    );
    expect(grouped).toEqual([
      { type: 0, items: [] },
      { type: 1, items: [{ id: "a", bedrooms: 1 }] },
      { type: 2, items: [] },
      { type: 4, items: [{ id: "b", bedrooms: 5 }] },
    ]);
  });
});

describe("formatBedroomTypes", () => {
  it("renders studio and 4+ with the numbers in between", () => {
    expect(formatBedroomTypes([0, 1, 2, 4], "Studio", "4+")).toBe("Studio, 1, 2, 4+");
  });
});
