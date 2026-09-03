# Properties → Projects port checklist

> Status: Implemented 2026-08-21. Projects admin now mirrors Properties (row list, publish pills, AdminSection form, city picker, location map, SEO compact).

Projects admin now uses the same **row list** + **AdminSection** form as Properties. This file is the port record (what copied, what stayed project-specific).

Map spec for Properties: `docs/superpowers/specs/2026-08-20-property-location-google-map.md`.

---

## Already shared (do not rebuild)

- `lib/constants/cities.ts` + `components/forms/city-select.tsx`
- `components/maps/location-picker.tsx` + public `listing-map.tsx`
- `lib/format/slug.ts` (`slugFromTitle` from English only; Turkish folded; Arabic stripped)
- `lib/validation/shared.ts`: blank SEO is valid; `compactSeoFields()` omits empty SEO on save
- `SeoFieldsSection` shows a human canonical error
- Publish confirm copy pattern (AR/TR empty, no photos) — Properties form only so far

Projects form already uses `projectSchema.shape.seo`, so **blank SEO should already validate**. Still call `compactSeoFields` on project submit so empty `{ en: "" }` is not stored.

---

## 1. List (`/admin/projects`)

Properties: `components/admin/properties/property-list.tsx` + `app/(portal)/admin/properties/page.tsx`

Projects: `DataTable` + `project-columns.tsx` — Edit / Delete only.

Copy when we take Projects:

| Behavior | Properties source |
|---|---|
| Row list (thumb, title, meta line, not a spreadsheet table) | `property-list.tsx` |
| Pill **Draft / Published** (`rounded-4xl`, inset focus ring) | `PropertyRowControls` |
| Clicking **Draft** on a live row confirms “Hide this listing?” | same + `AlertDialog` |
| Publishing / listing-type filters in the URL (`?publishing=draft`) | `properties/page.tsx` |
| Search: `name`, `autoComplete="off"`, placeholder ends with `…` | search `Input` |
| Decorative `Plus` / `MoreHorizontal` get `aria-hidden` | page + row menu |
| Pagination 25 + Previous/Next (client-side is fine until volume hurts) | `property-list.tsx` |

Skip unless we ask: search/sort/page in the URL; mobile restack of the status pill.

**Backend:** Properties has `api.properties.setPublishingStatus` (`convex/properties.ts`). Projects needs the same mutation (auth like `update`: `requireRole`, `assertOwnsIfAdmin`). Do not require the full form payload to toggle draft/published.

---

## 2. Form (`/admin/projects/new` and `[id]`)

Properties: `components/admin/properties/property-form.tsx`

Projects: tabbed Details / Relations / SEO; no map; comment in `project-form.tsx` says coordinates are omitted on save.

Copy when we take Projects:

| Behavior | Notes |
|---|---|
| **AdminSection** layout (not tabs), sticky Save / Publish | Match Properties |
| **Market then City** (`CitySelect`, Other…); Market change does not wipe city | Listing row |
| **Location** optional: `LocationPicker` (Place Autocomplete Element, Advanced Marker, drag clears `placeId`) | Needs `address` + `placeId` on `projects` schema (coordinates already exist) |
| Public map + Directions when coordinates exist | `PublicListingMap` on the public project page |
| Slug from **English title** until staff edit the slug field; edit mode does not overwrite a saved slug | `slugFromTitle` |
| Publish confirm: live path, AR/TR empty, photos | Same copy, project URL prefix |
| Relation labels `htmlFor` + trigger `id` | Developer / Community already on projects |
| Slug: `autoComplete="off"`, `spellCheck={false}`, `translate="no"` | |
| Sticky bar: `scroll-mb-32` on inputs so focus is not covered | |
| `compactSeoFields` on submit | Schema already allows blank SEO |
| Invalid SEO (AR without EN, bad canonical): open the SEO block and scroll | Properties uses `#property-seo` on `<details>` |

Do **not** copy property-only facts (bedrooms, listingStatus sale/rent, area sqft). Projects keep developer, payment plan, construction status, starting price.

---

## 3. Schema / Convex (only if Location ships)

Properties already has `address`, `placeId`, `coordinates`.

Projects have `coordinates` only. To match Location:

- Add optional `address`, `placeId` on `projects` (same as properties)
- Persist / clear on `create` / `update` like `convex/properties.ts` (`replace` + delete omitted optionals)
- `setPublishingStatus` for the list pills

Env: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is frontend-only. Do not put it in Convex env.

---

## 4. Known gaps we left on Properties (optional on Projects too)

- Admin list price: AE uses `formatAed`; other markets show `150,000 TH` (country code, not `THB`)
- Public catalog still formats as AED everywhere
- Admin list is a row inventory, not a column table — that was a choice, not a missing screen

---

## Suggested order when we start Projects

1. List: row layout + `setPublishingStatus` pills + hide confirm + URL publishing filter.
2. Form shell: AdminSection + sticky save + slug from EN title + `compactSeoFields`.
3. City picker (Market then City).
4. Location map (schema `address` / `placeId` first).
5. Hygiene: labels, slug attrs, search `aria-hidden` / autocomplete.

Do not one-shot the whole list. Properties was approved in pieces (pills, then rounded, then URL filters, then form SEO).
