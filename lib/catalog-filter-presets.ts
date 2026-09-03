import type { CatalogIntent } from "@/lib/seo/catalog";

export type RangePreset = {
  id: string;
  min?: number;
  max?: number;
};

export const SALE_PRICE_PRESETS: RangePreset[] = [
  { id: "any" },
  { id: "u1", max: 1_000_000 },
  { id: "1-2", min: 1_000_000, max: 2_000_000 },
  { id: "2-5", min: 2_000_000, max: 5_000_000 },
  { id: "5-10", min: 5_000_000, max: 10_000_000 },
  { id: "10p", min: 10_000_000 },
];

export const RENT_PRICE_PRESETS: RangePreset[] = [
  { id: "any" },
  { id: "u80", max: 80_000 },
  { id: "80-150", min: 80_000, max: 150_000 },
  { id: "150-250", min: 150_000, max: 250_000 },
  { id: "250p", min: 250_000 },
];

export const SIZE_PRESETS: RangePreset[] = [
  { id: "any" },
  { id: "u800", max: 800 },
  { id: "800-1500", min: 800, max: 1500 },
  { id: "1500-2500", min: 1500, max: 2500 },
  { id: "2500p", min: 2500 },
];

export const COUNT_PRESETS = ["any", "0", "1", "2", "3", "4"] as const;

export function pricePresetsFor(intent: CatalogIntent) {
  return intent === "rent" ? RENT_PRICE_PRESETS : SALE_PRICE_PRESETS;
}

export function presetIdFromRange(presets: RangePreset[], min?: number, max?: number) {
  const match = presets.find((preset) => preset.min === min && preset.max === max);
  if (match) return match.id;
  if (min != null || max != null) return "custom";
  return "any";
}

export function rangeFromPreset(presets: RangePreset[], id: string) {
  const preset = presets.find((item) => item.id === id) ?? presets[0];
  return { min: preset.min, max: preset.max };
}
