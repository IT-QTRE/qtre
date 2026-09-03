---
target: Properties admin list + form
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-20T07-52-06Z
slug: components-admin-properties-property-list-tsx
---
Method: dual-agent (A: 897b5894-ec40-46ee-8be1-2d711435290b · B: f3c821b2-c266-40c1-9e34-dbccbe119ff1)

Target: Properties admin list + form (`components/admin/properties/property-list.tsx` and the create/edit pages that use it). Operate surface for QTRE staff catalog authors.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Toasts and Saving… exist; no dirty flag, no result count, most field errors only appear on submit, edit loading is a blank box |
| 2 | Match System / Real World | 2 | Brokers scan beds, community, AED, Arabic title — the row is `title.en · Sale · city.en · 1200000`. “Country Code” and “Slug” are CMS language |
| 3 | User Control and Freedom | 2 | Back link and delete Cancel exist; no form Cancel, no unsaved guard, optional relations cannot be cleared to None |
| 4 | Consistency and Standards | 2 | Properties is an island vs Projects/Leads/Notes tables; Create photos ≠ Edit photos; Status vs Publishing status vs Listing Status |
| 5 | Error Prevention | 2 | Delete is guarded; Publish is Status + Save with no confirm. Price has no currency. Slug is typed from memory |
| 6 | Recognition Rather Than Recall | 2 | Chips are visible; search and list are English-only; currency is implied by Country Code in another section |
| 7 | Flexibility and Efficiency | 2 | Search, sort chips, pagination; no bulk, no shortcuts, no missing-Arabic filter |
| 8 | Aesthetic and Minimalist Design | 3 | Restrained Operate chrome. Noise is always-on SEO and 20 amenity pills, not decoration |
| 9 | Error Recovery | 2 | Photo-fail warning is actionable; price/beds/area can fail without a nearby message; submit does not scroll to first error |
| 10 | Help and Documentation | 2 | Field hints exist; nothing on when to Publish or what the public page will show. Sticky publish hint hidden below `lg` |
| **Total** | | **21/40** | **Acceptable** |

## Design Specificity Verdict

**Start here.** Category-interchangeable CMS chrome, with QTRE fields bolted on.

**LLM assessment**: `AdminSection` borders, segmented chips, sticky save, TanStack-backed rows, and EN/AR/TR tabs per field could ship on any multi-locale catalog without renaming more than labels. QTRE-specific content is the data (Sale/Rent, sq ft, Marina Heights placeholders, AE markets), not the composition. A Dubai listing desk would scan photo · beds · community · AED · sale/rent · AR+EN title. This list scans EN title · Sale · city.en · raw number · Draft/Published · date. Familiarity was the brief; the surface still does not encode how QTRE staff identify inventory.

**Deterministic scan**: `detect.mjs` exited 0 with **zero findings** across nine files (`property-list`, `property-form`, `property-delete-action`, list/new/edit pages, `admin-page-header`, `admin-filter-group`, `admin-section`). The detector is built for marketing-page slop (gradients, interchangeable cards, decorative motion). It cannot see EN-only search, missing AED, or Publish-without-confirm. Agreement: none of the P1s are detector-visible. Detector did not contradict the review; it also did not add locations.

**Visual overlays**: No reliable user-visible overlay. This session has no browser MCP tools. `/admin/properties` is Clerk-gated. An earlier Next compile error for deleted `property-columns` is stale; current source does not import it, and later requests to `/admin/properties/new` compiled 200.

## Overall Impression

The template is a competent Linear-like Operate tool. Header, row list, bordered sections, and sticky save are the right vocabulary. The gap is product: it authors a CMS document, not a Dubai listing. Biggest opportunity: make the row and the publish action match how staff actually work (AED, beds, Arabic completeness, live URL) before copying this pattern to Projects.

## What's Working

1. **Operate chrome is right.** Header + bordered sections + sticky Status/Save + maroon selected chips reads as a tool, not a marketing page.
2. **Empty states are honest.** Catalog-empty (“Add a property”) vs filtered-empty (“No properties match these filters”) vs skeleton are distinguished. Whole-row click to edit is the correct primary path.
3. **Delete treats irreversibility as irreversible.** Kebab → confirm dialog names the listing, says it cannot be undone, stays open on failure. Arabic `dir="rtl"` on locale inputs is correct.

## Cognitive load

**7 of 8 checklist items fail (high).** Only grouping passes (`AdminSection` boxes, chip groups, sticky bar).

Visible-at-once overload on the list: Publishing 3 + Listing 3 + Sort 4 = **10 chips plus search**. Form: six equal sections; amenities 20 pills; per-field EN/AR/TR tabs.

## Emotional journey

Arrival is calm. The form is a valley (nine tab clicks for bilingual Title/Description/City, then SEO again). Delete is the only high-stakes moment that behaves like one. Publish is as casual as fixing a typo. Exit is the Back link, which discards silently.

## Priority Issues

**[P1] The row is not a Dubai listing**
- **What**: Thumb, `title.en`, `Sale · {city.en} · {unformatted number}`, publishing label, date. No beds, area, community, AED, Arabic title, or Sold/Rented treatment.
- **Why it matters**: Staff cannot scan or QA the catalog they run. Opening every row is the workaround.
- **Fix**: Row = thumb + EN title + AR completeness + `{beds}BR · {area} sq ft · {community or city}` + `AED {price}` + sale/rent/sold. Date secondary.
- **Suggested command**: `/impeccable layout`

**[P1] Locale authoring is English-first theater**
- **What**: Every localized field has its own English/Arabic/Turkish tabs (`defaultValue="en"`). Search matches only `title.en`. Edit header is `title.en`.
- **Why it matters**: Public site is `/en` `/ar` `/tr`. Publishing EN-only is a silent quality failure. Finding an Arabic-titled unit requires remembering the English string.
- **Fix**: One locale switcher for the form (or EN+AR side-by-side for Title/Description). Completeness chips. Search across `title.en|ar|tr`. Filter “Missing Arabic”.
- **Suggested command**: `/impeccable distill` (then `/impeccable harden` for completeness)

**[P1] Publish is Status + Save, with less ceremony than Delete**
- **What**: Sticky Draft/Published/Archived select beside Save. Hint hidden below `lg`. No public URL preview. No confirm when going live.
- **Why it matters**: This is the action that puts inventory on the public catalog. Accidental publish of incomplete/EN-only/no-photo listings is the actual staff failure mode.
- **Fix**: Split Save draft vs Publish. Confirm: live at `/en/properties/{slug}`. Show slug as a URL preview.
- **Suggested command**: `/impeccable harden`

**[P2] The form is a six-section wall with no disclosure and no escape**
- **What**: Listing, Specs, Relations, Photos, Publishing (slug), SEO always open. No Cancel. No dirty guard. Relations cannot return to None.
- **Why it matters**: Create/edit is a slog; back-link data loss; optional work competes with required listing fields.
- **Fix**: Collapse SEO/Relations by default. Dirty confirm on Back. Empty “None” relation item. Auto-slug from EN title.
- **Suggested command**: `/impeccable distill`

**[P2] Filter and power-user gaps**
- **What**: Listing chips All/Sale/Rent hide Sold/Rented/Off market. No result count. Pagination is Previous/Next only. Other admin tabs still use the old table.
- **Why it matters**: A desk with dozens of listings cannot triage. Inconsistent chrome trains errors when staff bounce to Projects.
- **Fix**: Result count; Sold/Rented as badges or scopes; copy this template to other tabs only after P1s.
- **Suggested command**: `/impeccable adapt`

## Persona Red Flags

**Alex (Power User)**: No bulk select, no shortcuts, no filter by community/beds/missing AR. 25-row pages with no jump. Relations once set cannot be cleared. Will keep a spreadsheet.

**Casey (Mobile)**: Chip toolbar wraps into a tall stack (`py-1.5` chips, well under 44px). Kebab `icon-sm` next to the row link is an easy mis-tap. Photo remove is hover-only. Sticky publish hint gone below `lg`.

**Sam (Accessibility)**: Search is placeholder-only (no accessible name). Media dropzone is a clickable `div`. Thumbnail `alt=""`. Form can fail submit with errors only on slug/locale fields — no error summary, no scroll-to-first-error.

**QTRE listing admin (EN+AR Dubai inventory)**: Job is a Marina 2BR for sale with EN+AR copy, AED, community, photos, then publish. This UI: EN title, tab to Arabic, tab Description, City including unused Turkish, Country “United Arab Emirates (AE)”, price `1200000` with no AED, 20 English amenity pills, kebab-case slug, SEO in three locales, Status→Published→Save. Then the list pretends the Arabic work never happened. Community is a buried optional select, not a scan key.

## Minor Observations

- Filter chips `py-1.5` / `text-xs` fail 44px touch targets (Casey/Sam).
- Three groups all labeled with an option named “All”.
- Sort direction is a unicode arrow on the active chip; no `aria-sort`.
- Status and date hide at `sm` / `md`.
- Skeleton omits the search field (layout shift).
- Gold `#C8A15B` unused on this surface (intentional Operate restraint).
- Create `MediaPicker` vs edit `MediaUploader` is two photo UIs for one job.
- Pagination has no “Showing 1–25 of N”.

## Questions to Consider

1. If the list row cannot answer “which 2BR in Marina is live in Arabic at AED 1.2M?”, why is it a property list and not a CMS title list?
2. Why is Delete a two-step irreversible ritual and Publish a sibling of Save in a 160px select?
3. If the public product is EN+AR (TR tertiary), why does every field — including City — pay a three-tab tax before the listing is allowed to exist?
