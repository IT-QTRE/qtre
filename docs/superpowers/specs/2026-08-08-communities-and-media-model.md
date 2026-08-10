# Communities & Media Model — Design Spec

> Status: Approved. Resolves the "Communities entity" and clarifies the media
> storage approach in `PLAN.md`'s Open Decisions / Phase 1 checklist.

## Context

Two Phase 1 schema questions came up during a pre-implementation review:

1. `TECH_STACK.md` referenced a "Communities" page type (e.g.
   `/communities/dubai-marina`) in routing/sitemap examples but never modeled
   it as data — it was left as an unresolved Open Decision.
2. The original Phase 1 checklist planned to embed a `MediaItem[]` array
   directly on entities (properties, projects, `propertySubmissions`
   documents) alongside a separately-planned `mediaRecords` table. Convex's
   own current guidelines (`convex/_generated/ai/guidelines.md`, targeting
   `^1.41.0`; this project is on `1.43.0`) explicitly warn against embedding
   unbounded lists as array fields: they hit the 1MB document limit and
   rewrite the whole parent document on every reorder/add/delete.

This spec resolves both, and — since the project is currently Dubai/UAE-only
but expansion to other countries (e.g. Thailand) is a real possibility —
makes sure the Communities design doesn't bake in a single-country
assumption that would require a breaking migration later.

## Media: unified `mediaItems` table

Replace both the embedded `MediaItem[]` array idea and the standalone
`mediaRecords` table with **one** table:

```ts
mediaItems: defineTable({
  entityType: v.union(
    v.literal("property"),
    v.literal("project"),
    v.literal("developer"),
    v.literal("agent"),
    v.literal("community"),
    v.literal("blogPost"),
    v.literal("propertySubmission"),
  ),
  entityId: v.string(), // the referenced entity's Id, stored generically
  url: v.string(),
  pathname: v.string(), // Vercel Blob pathname, for delete/replace
  alt: LocalizedTextValidator,
  order: v.number(),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
  mimeType: v.string(),
}).index("by_entity", ["entityType", "entityId", "order"]),
```

- One table serves both jobs: "all media attached to property X" (query the
  index) and "media library" (Phase 4's library screen just queries/filters
  this same table without an entity filter).
- This is both the Convex-recommended pattern (separate table + foreign key,
  not an embedded array) and the standard industry approach for polymorphic
  media attachments.
- `propertySubmissions`' documents (title deed, floor plans, etc.) use the
  same table with `entityType: "propertySubmission"` — no separate document
  system, consistent with the roles/portals spec's intent.

## Communities: modeled entity, country-aware from day one

Model `communities` as a real Convex table (Admin-editable, like
Developers/Agents get their own profile pages) rather than a schema-less
filtered landing page — this project wants curated per-neighborhood content
(description, hero image), not just a filtered listing grid.

```ts
communities: defineTable({
  name: LocalizedTextValidator,
  slug: v.string(),
  countryCode: v.string(), // ISO 3166-1 alpha-2, e.g. "AE", "TH"
  city: LocalizedTextValidator, // translated display name, e.g. "Dubai" / "دبي"
  description: LocalizedTextValidator,
  ...SeoFields,
  ...PublishingFields,
}).index("by_country_and_slug", ["countryCode", "slug"]),
```

`properties` and `projects` gain:

- `countryCode: v.string()` — shared fact, not translated (mirrors how
  `status`/`coordinates` are already shared facts in the i18n content model).
- `city: LocalizedText` — translated display name. Set directly on every
  listing, independent of whether a curated `communities` page exists yet for
  that city. This is the piece that makes a new country work on day one: a
  brand-new Thailand listing has a real, correct city name immediately, with
  or without a curated community page.
- `communityId: v.optional(v.id("communities"))` — set only when a curated
  community page exists for that listing's area (e.g. Dubai Marina today).
  Absent for listings in cities/areas that don't have a curated page yet.

### Why this survives adding a new country (e.g. Thailand)

- No schema change is needed to launch a second country. You add new
  `communities` rows with `countryCode: "TH"`, and new Thailand listings set
  `countryCode`/`city` like any other listing.
- Listings never *require* a `communityId`, so a new country's listings work
  correctly from day one even before anyone has written curated community
  content for its neighborhoods.
- No premature `countries`/`cities` parent tables were added — `countryCode`
  and `city` are simple denormalized fields, consistent with this project's
  "avoid unnecessary dependencies" / avoid over-modeling principle
  (`TECH_STACK.md` → Development Principles). If a real need for city-level
  curated content (not just community-level) emerges later, a `cities` table
  can be added then without touching this design.

## Phase 1 impact

- New tables: `mediaItems`, `communities`.
- Removed from scope: standalone `mediaRecords` table, embedded `MediaItem[]`
  array fields.
- `properties`/`projects` gain `countryCode`, `city` (`LocalizedText`),
  `communityId?`.
- `propertySubmissions.documents` (from the roles/portals spec) uses
  `mediaItems` with `entityType: "propertySubmission"` instead of an embedded
  array.
