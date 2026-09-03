// Curated list of the markets QuickTalk Real Estate actually operates in —
// edit freely as the business expands. `countryCode` isn't a closed enum in
// the schema (`v.string()` matching an ISO 3166-1 alpha-2 regex), so a code
// entered before this list existed, or any market not listed here, still
// round-trips fine — `CountryCodeSelect` falls back to a free-text entry
// for anything outside this curated set, same idea as `AmenityPicker`'s
// "Other" input. The UK's ISO 3166-1 alpha-2 code is "GB", not "UK".
export const CURATED_COUNTRIES = [
  { code: "AE", label: "United Arab Emirates", currency: "AED" },
  { code: "TH", label: "Thailand", currency: "THB" },
  { code: "TR", label: "Turkey", currency: "TRY" },
  { code: "PH", label: "Philippines", currency: "PHP" },
  { code: "LV", label: "Latvia", currency: "EUR" },
  { code: "GB", label: "United Kingdom", currency: "GBP" },
] as const;

export function currencyForCountry(code: string): string | undefined {
  return CURATED_COUNTRIES.find((country) => country.code === code)?.currency;
}

export function compareMarketCodes(a: string, b: string): number {
  const ia = CURATED_COUNTRIES.findIndex((country) => country.code === a);
  const ib = CURATED_COUNTRIES.findIndex((country) => country.code === b);
  if (ia === -1 && ib === -1) return a.localeCompare(b);
  if (ia === -1) return 1;
  if (ib === -1) return -1;
  return ia - ib;
}

export function defaultMarketCode(codes: readonly string[]): string | undefined {
  if (codes.includes("AE")) return "AE";
  return [...codes].sort(compareMarketCodes)[0];
}
