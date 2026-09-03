import { describe, expect, it } from "vitest";
import {
  CONSTRUCTION_CATALOG_KEYS,
  OFFPLAN_CONSTRUCTION,
  offplanFiltersFromSearch,
  offplanHasNarrowingFilters,
  offplanQueryArgs,
  offplanSearchHref,
} from "./offplan-catalog";

describe("offplan catalog urls", () => {
  it("keeps the unfiltered index at /projects without a status param", () => {
    expect(offplanSearchHref()).toBe("/projects");
    expect(offplanSearchHref({}, 1)).toBe("/projects");
    expect(offplanSearchHref({}, 2)).toBe("/projects?page=2");
  });

  it("parses location, starting price, beds, and construction, ignoring unknown construction", () => {
    expect(
      offplanFiltersFromSearch({
        q: " marina ",
        minPrice: "1000000",
        maxPrice: "5000000",
        beds: "1",
        construction: "upcoming",
        developer: " emaar ",
      }),
    ).toEqual({
      q: "marina",
      minPrice: 1_000_000,
      maxPrice: 5_000_000,
      beds: 1,
      construction: "upcoming",
      developer: "emaar",
    });
    expect(offplanFiltersFromSearch({ construction: "sale" }).construction).toBeUndefined();
  });

  it("treats q/price/beds/construction/developer as narrowing filters", () => {
    expect(offplanHasNarrowingFilters({})).toBe(false);
    expect(offplanHasNarrowingFilters({ q: "marina" })).toBe(true);
    expect(offplanHasNarrowingFilters({ beds: 2 })).toBe(true);
    expect(offplanHasNarrowingFilters({ developer: "emaar" })).toBe(true);
    expect(offplanQueryArgs({ construction: "completed", minPrice: 2_000_000, beds: 0, developer: "emaar" })).toEqual({
      construction: "completed",
      minPrice: 2_000_000,
      beds: 0,
      developer: "emaar",
    });
    expect(offplanSearchHref({ q: "marina", beds: 1, construction: "upcoming", developer: "emaar" })).toBe(
      "/projects?q=marina&beds=1&construction=upcoming&developer=emaar",
    );
  });

  it("maps construction status to static catalog message keys", () => {
    expect(OFFPLAN_CONSTRUCTION.map((value) => CONSTRUCTION_CATALOG_KEYS[value])).toEqual([
      "construction.upcoming",
      "construction.under_construction",
      "construction.completed",
    ]);
  });
});
