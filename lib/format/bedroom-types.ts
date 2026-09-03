export const BEDROOM_TYPE_VALUES = [0, 1, 2, 3, 4] as const;
export type BedroomType = (typeof BEDROOM_TYPE_VALUES)[number];

export const BEDROOM_TYPE_LABELS: Record<BedroomType, string> = {
  0: "Studio",
  1: "1 bed",
  2: "2 bed",
  3: "3 bed",
  4: "4+ bed",
};

export function normalizeBedroomTypes(values: number[] | undefined): BedroomType[] {
  const unique = new Set<BedroomType>();
  for (const value of values ?? []) {
    if (!Number.isInteger(value) || value < 0) continue;
    unique.add(Math.min(4, value) as BedroomType);
  }
  return [...unique].sort((a, b) => a - b);
}

export function bedroomTypeLabel(type: number, studio: string, fourPlus: string) {
  if (type <= 0) return studio;
  if (type >= 4) return fourPlus;
  return String(type);
}

export function bedroomTypeOf(bedrooms: number): BedroomType | null {
  if (!Number.isInteger(bedrooms) || bedrooms < 0) return null;
  return Math.min(4, bedrooms) as BedroomType;
}

export function groupByBedroomType<T extends { bedrooms: number }>(types: number[], items: T[]) {
  const buckets = new Map<BedroomType, T[]>();
  for (const type of normalizeBedroomTypes(types)) {
    buckets.set(type, []);
  }
  for (const item of items) {
    const type = bedroomTypeOf(item.bedrooms);
    if (type == null) continue;
    const bucket = buckets.get(type);
    if (bucket) bucket.push(item);
    else buckets.set(type, [item]);
  }
  const grouped = [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([type, groupedItems]) => ({ type, items: groupedItems }));
  return grouped;
}

export function formatBedroomTypes(types: number[], studio: string, fourPlus: string) {
  return normalizeBedroomTypes(types)
    .map((type) => bedroomTypeLabel(type, studio, fourPlus))
    .join(", ");
}
