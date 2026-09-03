export type MapCoordinates = { lat: number; lng: number };

/** Google's public demo map ID — required for Advanced Markers without Cloud-based map styling. */
export const GOOGLE_MAP_ID = "DEMO_MAP_ID";

/** Well-known city centers for a preview-only map when no pin is saved yet. */
export const MARKET_CENTERS: Record<string, MapCoordinates> = {
  AE: { lat: 25.2048, lng: 55.2708 },
  TH: { lat: 13.7563, lng: 100.5018 },
  TR: { lat: 41.0082, lng: 28.9784 },
  PH: { lat: 14.5995, lng: 120.9842 },
  LV: { lat: 56.9496, lng: 24.1052 },
  GB: { lat: 51.5074, lng: -0.1278 },
};

export function previewCenter(countryCode: string | undefined): MapCoordinates {
  if (countryCode && MARKET_CENTERS[countryCode]) return MARKET_CENTERS[countryCode];
  return MARKET_CENTERS.AE;
}

/** Compose a geocode query. Empty address must not be sent — city-only pins are too coarse. */
export function geocodeQuery(address: string, cityEn: string, countryCode: string): string | null {
  const trimmed = address.trim();
  if (!trimmed) return null;
  return [trimmed, cityEn.trim(), countryCode.trim()].filter(Boolean).join(", ");
}

export function googleMapsDirectionsUrl(coordinates: MapCoordinates, placeId?: string | null): string {
  const params = new URLSearchParams({
    api: "1",
    destination: `${coordinates.lat},${coordinates.lng}`,
  });
  if (placeId) params.set("destination_place_id", placeId);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
