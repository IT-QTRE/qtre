// Curated list of the markets QuickTalk Real Estate actually operates in —
// edit freely as the business expands. `countryCode` isn't a closed enum in
// the schema (`v.string()` matching an ISO 3166-1 alpha-2 regex), so a code
// entered before this list existed, or any market not listed here, still
// round-trips fine — `CountryCodeSelect` falls back to a free-text entry
// for anything outside this curated set, same idea as `AmenityPicker`'s
// "Other" input. The UK's ISO 3166-1 alpha-2 code is "GB", not "UK".
export const CURATED_COUNTRIES = [
  { code: "AE", label: "United Arab Emirates" },
  { code: "TH", label: "Thailand" },
  { code: "TR", label: "Turkey" },
  { code: "PH", label: "Philippines" },
  { code: "LV", label: "Latvia" },
  { code: "GB", label: "United Kingdom" },
] as const;
