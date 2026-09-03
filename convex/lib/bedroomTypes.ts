import { v } from "convex/values";

export const bedroomTypeValidator = v.union(
  v.literal(0),
  v.literal(1),
  v.literal(2),
  v.literal(3),
  v.literal(4),
);

export const bedroomTypesValidator = v.array(bedroomTypeValidator);

export const unitTypeSpecValidator = v.object({
  bedrooms: bedroomTypeValidator,
  minAreaSqm: v.optional(v.number()),
  maxAreaSqm: v.optional(v.number()),
  minAreaSqft: v.optional(v.number()),
  maxAreaSqft: v.optional(v.number()),
  minPrice: v.optional(v.number()),
  maxPrice: v.optional(v.number()),
});

export const unitTypesValidator = v.array(unitTypeSpecValidator);

type BedroomType = 0 | 1 | 2 | 3 | 4;

export function normalizeBedroomTypes(values: number[] | undefined) {
  const unique = new Set<BedroomType>();
  for (const value of values ?? []) {
    if (!Number.isInteger(value) || value < 0) continue;
    unique.add(Math.min(4, value) as BedroomType);
  }
  return [...unique].sort((a, b) => a - b);
}

function optionalPositive(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value) || value <= 0) return undefined;
  return value;
}

const SQ_FT_TO_SQ_M = 0.09290304;

function sqftToSqm(sqft: number) {
  return Math.round(sqft * SQ_FT_TO_SQ_M);
}

function orderedPair(min: number | undefined, max: number | undefined): { min?: number; max?: number } {
  const low = optionalPositive(min);
  const high = optionalPositive(max);
  if (low == null && high == null) return {};
  if (low == null || high == null) {
    const value = (low ?? high)!;
    return { min: value };
  }
  if (low === high) return { min: low };
  return low < high ? { min: low, max: high } : { min: high, max: low };
}

function areaSqmPair(spec: {
  minAreaSqm?: number;
  maxAreaSqm?: number;
  minAreaSqft?: number;
  maxAreaSqft?: number;
}) {
  const fromSqm = orderedPair(spec.minAreaSqm, spec.maxAreaSqm);
  if (fromSqm.min != null) return fromSqm;
  const fromSqft = orderedPair(spec.minAreaSqft, spec.maxAreaSqft);
  if (fromSqft.min == null) return {};
  return {
    min: sqftToSqm(fromSqft.min),
    ...(fromSqft.max != null ? { max: sqftToSqm(fromSqft.max) } : {}),
  };
}

export function normalizeUnitTypes(
  specs:
    | {
        bedrooms: number;
        minAreaSqm?: number;
        maxAreaSqm?: number;
        minAreaSqft?: number;
        maxAreaSqft?: number;
        minPrice?: number;
        maxPrice?: number;
      }[]
    | undefined,
) {
  const byType = new Map<
    BedroomType,
    {
      bedrooms: BedroomType;
      minAreaSqm?: number;
      maxAreaSqm?: number;
      minPrice?: number;
      maxPrice?: number;
    }
  >();
  for (const spec of specs ?? []) {
    if (!Number.isInteger(spec.bedrooms) || spec.bedrooms < 0) continue;
    const bedrooms = Math.min(4, spec.bedrooms) as BedroomType;
    const area = areaSqmPair(spec);
    const price = orderedPair(spec.minPrice, spec.maxPrice);
    byType.set(bedrooms, {
      bedrooms,
      ...(area.min != null ? { minAreaSqm: area.min } : {}),
      ...(area.max != null ? { maxAreaSqm: area.max } : {}),
      ...(price.min != null ? { minPrice: price.min } : {}),
      ...(price.max != null ? { maxPrice: price.max } : {}),
    });
  }
  return [...byType.values()].sort((a, b) => a.bedrooms - b.bedrooms);
}

export function resolvedAreaSqm(spec: {
  minAreaSqm?: number;
  maxAreaSqm?: number;
  minAreaSqft?: number;
  maxAreaSqft?: number;
}) {
  const area = areaSqmPair(spec);
  return {
    minAreaSqm: area.min ?? null,
    maxAreaSqm: area.max ?? null,
  };
}
