import { describe, expect, it } from "vitest";
import { compareMarketCodes, defaultMarketCode } from "./countries";

describe("compareMarketCodes", () => {
  it("follows the curated market list, then unknown codes A–Z", () => {
    expect(["TR", "PT", "AE", "ZZ"].sort(compareMarketCodes)).toEqual(["AE", "TR", "PT", "ZZ"]);
  });
});

describe("defaultMarketCode", () => {
  it("returns UAE first, otherwise the first curated code", () => {
    expect(defaultMarketCode(["GB", "AE"])).toBe("AE");
    expect(defaultMarketCode(["GB", "TH"])).toBe("TH");
  });
});
