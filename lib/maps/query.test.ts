import { describe, expect, it } from "vitest";
import { geocodeQuery, googleMapsDirectionsUrl, previewCenter } from "./query";

describe("geocodeQuery", () => {
  it("returns null when address is blank so city-only is never geocoded", () => {
    expect(geocodeQuery("", "Dubai", "AE")).toBeNull();
    expect(geocodeQuery("   ", "Dubai", "AE")).toBeNull();
  });

  it("joins address, city, and market", () => {
    expect(geocodeQuery("Marina Heights", "Dubai", "AE")).toBe("Marina Heights, Dubai, AE");
  });
});

describe("googleMapsDirectionsUrl", () => {
  it("builds a destination URL and appends placeId when present", () => {
    expect(googleMapsDirectionsUrl({ lat: 25.1, lng: 55.2 })).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=25.1%2C55.2",
    );
    expect(googleMapsDirectionsUrl({ lat: 25.1, lng: 55.2 }, "ChIJ123")).toContain("destination_place_id=ChIJ123");
  });
});

describe("previewCenter", () => {
  it("falls back to Dubai when the market is unknown", () => {
    expect(previewCenter("AE")).toEqual({ lat: 25.2048, lng: 55.2708 });
    expect(previewCenter("XX")).toEqual({ lat: 25.2048, lng: 55.2708 });
  });
});
