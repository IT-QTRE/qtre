import { v, type Infer } from "convex/values";

// Fields shared verbatim between `properties` (admin-curated, published) and
// `propertySubmissions` (client-submitted, pending review) — the exact
// subset of a property's facts that a property owner can supply themselves.
// Defined once so the two tables' `defineTable()` calls can both spread
// `.fields` from this constant instead of duplicating field definitions.
// Translated fields (title/description/city) are NOT here even though both
// tables have them — a client submission's are plain strings (single
// language, as typed by the owner), while a published property's are
// LocalizedText (translated by staff on approval), so those two shapes
// genuinely differ and can't be shared.
export const propertySharedFactsValidator = v.object({
  price: v.number(),
  bedrooms: v.number(),
  bathrooms: v.number(),
  areaSqft: v.number(),
  countryCode: v.string(),
});

export type PropertySharedFacts = Infer<typeof propertySharedFactsValidator>;
