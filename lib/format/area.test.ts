import { describe, expect, it } from "vitest";
import { formatSqftRange, formatSqmRange, formatSqftRangeFromSqm, formatSqmRangeFromSqm, mergeRanges, numericRange, sqftToSqm, sqmToSqft } from "./area";

describe("numericRange", () => {
  it("returns null when nothing usable is present", () => {
    expect(numericRange([])).toBeNull();
    expect(numericRange([0, -12])).toBeNull();
  });

  it("returns min and max in one pass", () => {
    expect(numericRange([950, 750, 800])).toEqual({ min: 750, max: 950 });
    expect(numericRange([1200])).toEqual({ min: 1200, max: 1200 });
  });
});

describe("mergeRanges", () => {
  it("spans an announced min with a higher linked price", () => {
    expect(mergeRanges({ min: 100_000, max: 100_000 }, { min: 120_000, max: 120_000 })).toEqual({
      min: 100_000,
      max: 120_000,
    });
  });
});

describe("area conversion and ranges", () => {
  it("rounds square metres from square feet", () => {
    expect(sqftToSqm(1200)).toBe(111);
    expect(sqftToSqm(750)).toBe(70);
    expect(sqmToSqft(70)).toBe(753);
  });

  it("formats a single size and a span", () => {
    expect(formatSqftRange(1200, 1200, "en", "sq ft")).toBe("1,200 sq ft");
    expect(formatSqftRange(750, 950, "en", "sq ft")).toBe("750–950 sq ft");
    expect(formatSqmRange(750, 950, "en", "sq m")).toBe("70–88 sq m");
    expect(formatSqmRangeFromSqm(70, 88, "en", "sq m")).toBe("70–88 sq m");
    expect(formatSqftRangeFromSqm(70, 88, "en", "sq ft")).toBe("753–947 sq ft");
  });
});
