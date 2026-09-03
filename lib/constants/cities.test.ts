import { describe, expect, it } from "vitest";
import { citiesForCountry, cityLabel, matchCuratedCity } from "./cities";

describe("citiesForCountry", () => {
  it("returns the UAE set and nothing for an unknown market", () => {
    expect(citiesForCountry("AE").some((city) => city.en === "Dubai")).toBe(true);
    expect(citiesForCountry("XX")).toEqual([]);
  });
});

describe("matchCuratedCity", () => {
  it("matches English names case-insensitively and ignores communities", () => {
    expect(matchCuratedCity("AE", "dubai")?.en).toBe("Dubai");
    expect(matchCuratedCity("AE", "Dubai Marina")).toBeUndefined();
  });
});

describe("cityLabel", () => {
  it("falls back to English when a locale has no translation", () => {
    expect(cityLabel({ en: "Dubai", ar: "دبي" }, "ar")).toBe("دبي");
    expect(cityLabel({ en: "Dubai", ar: "دبي" }, "tr")).toBe("Dubai");
  });
});
