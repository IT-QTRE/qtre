// A curated starting list for the Amenities pill-picker (Properties, and
// later Projects) — edit freely as the business defines its actual standard
// set. Kept separate from any one entity's form so both can share it.
// Amenities aren't a closed enum in the schema (`v.array(v.string())`), so
// values typed before this list existed, or anything not listed here, still
// round-trip fine — the picker renders those as already-selected custom
// pills alongside the curated ones.
export const CURATED_AMENITIES = [
  "Swimming Pool",
  "Gym",
  "Parking",
  "Covered Parking",
  "Balcony",
  "Sea View",
  "Maid's Room",
  "Study Room",
  "Built-in Wardrobes",
  "Central A/C",
  "Security",
  "Concierge",
  "Kids Play Area",
  "Pets Allowed",
  "Furnished",
  "Smart Home",
  "Business Center",
  "BBQ Area",
  "Landscaped Garden",
  "Walk-in Closet",
] as const;
