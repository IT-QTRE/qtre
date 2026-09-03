import { describe, expect, it } from "vitest";
import { slugFromTitle } from "./slug";

describe("slugFromTitle", () => {
  it("lowercases, hyphenates, and strips punctuation", () => {
    expect(slugFromTitle("2BR Apartment in Marina Heights")).toBe("2br-apartment-in-marina-heights");
  });

  it("transliterates Turkish letters so the URL stays reachable", () => {
    expect(slugFromTitle("İnlight Yenişehir")).toBe("inlight-yenisehir");
    expect(slugFromTitle("Şişli Rezidans")).toBe("sisli-rezidans");
    expect(slugFromTitle("Işık")).toBe("isik");
    expect(slugFromTitle("Gölbaşı")).toBe("golbasi");
  });

  it("folds other Latin accents after transliteration", () => {
    expect(slugFromTitle("Résidence Côte")).toBe("residence-cote");
  });
});
