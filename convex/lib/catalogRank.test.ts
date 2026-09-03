import { describe, expect, test } from "vitest";
import { compareCatalogRank, sortPublishedCatalog } from "./catalogRank";

const marina = { rank: 1, _creationTime: 2, name: { en: "Marina" } };
const palm = { rank: 0, _creationTime: 3, name: { en: "Palm" } };
const downtown = { _creationTime: 9, name: { en: "Downtown" } };
const unrankedMarina = { _creationTime: 2, name: { en: "Marina" } };
const unrankedPalm = { _creationTime: 3, name: { en: "Palm" } };

describe("sortPublishedCatalog", () => {
  test("keeps A–Z when nobody has a rank", () => {
    expect(sortPublishedCatalog([unrankedMarina, unrankedPalm, downtown], "name").map((row) => row.name.en)).toEqual([
      "Downtown",
      "Marina",
      "Palm",
    ]);
  });

  test("keeps newest first when nobody has a rank and the rail asks for newest", () => {
    expect(sortPublishedCatalog([unrankedMarina, downtown], "newest").map((row) => row.name.en)).toEqual([
      "Downtown",
      "Marina",
    ]);
  });

  test("puts ranked rows first in rank order, then unranked", () => {
    expect(sortPublishedCatalog([marina, downtown, palm], "name").map((row) => row.name.en)).toEqual([
      "Palm",
      "Marina",
      "Downtown",
    ]);
  });
});

describe("compareCatalogRank", () => {
  test("orders by rank then English name", () => {
    expect([marina, palm].toSorted(compareCatalogRank).map((row) => row.name.en)).toEqual(["Palm", "Marina"]);
  });
});
