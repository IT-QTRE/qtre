import { describe, expect, it } from "vitest";
import { filterSearchPlaces, searchPlaceKind } from "./search-places";

const marina = { _id: "1", name: { en: "Dubai Marina" }, city: { en: "Dubai" } };
const bay = { _id: "2", name: { en: "Business Bay" }, city: { en: "Dubai" } };
const hills = { _id: "3", name: { en: "Dubai Hills" }, city: { en: "Dubai" } };

describe("searchPlaceKind", () => {
  it("maps catalog intents to listing kinds", () => {
    expect(searchPlaceKind("buy")).toBe("for_sale");
    expect(searchPlaceKind("sale")).toBe("for_sale");
    expect(searchPlaceKind("rent")).toBe("for_rent");
    expect(searchPlaceKind("offplan")).toBe("offplan");
  });
});

describe("filterSearchPlaces", () => {
  it("returns the first places when the field is empty", () => {
    const rows = filterSearchPlaces([marina, bay, hills], "", "en", 2);
    expect(rows.map((row) => row.label)).toEqual(["Dubai Marina", "Business Bay"]);
  });

  it("matches community name or city", () => {
    expect(filterSearchPlaces([marina, bay], "marina", "en").map((row) => row.label)).toEqual(["Dubai Marina"]);
    expect(filterSearchPlaces([marina, bay], "dubai", "en").map((row) => row.label)).toEqual([
      "Dubai Marina",
      "Business Bay",
    ]);
  });
});
