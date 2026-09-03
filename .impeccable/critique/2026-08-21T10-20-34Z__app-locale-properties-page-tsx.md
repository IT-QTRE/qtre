---
target: Buy catalog /en/properties?status=sale
total_score: 20
max_score: 36
na_heuristics: 10
p0_count: 1
p1_count: 3
timestamp: 2026-08-21T10-20-34Z
slug: app-locale-properties-page-tsx
---
Method: dual-agent (A: 21dc9a0f-7f47-4d08-a54e-7f8c95b9486e · B: 8f748775-9df4-4361-a19e-7f59539ebda1)

Target: Buy catalog `app/[locale]/properties/page.tsx` (`/en/properties?status=sale`). Operate surface with a Persuade closer.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Chip changes do nothing until Apply; draft vs applied is unlabeled |
| 2 | Match System / Real World | 3 | AED, studio, sq ft, Marina example. “Filters” ≠ bathrooms |
| 3 | User Control and Freedom | 2 | Clear exists. Sticky header hides Buy/Rent, locale, Contact, skip link |
| 4 | Consistency and Standards | 3 | Cards match the site. Home leads with Buy/Rent; this bar drops intent |
| 5 | Error Prevention | 2 | Presets help. Custom URL ranges display as Any. Beds 4 means 4+ |
| 6 | Recognition Rather Than Recall | 2 | Layout is icon-only (aria-label only). Baths hidden behind “Filters” |
| 7 | Flexibility and Efficiency | 2 | Shareable URLs. Apply tax on every change. No sort |
| 8 | Aesthetic and Minimalist Design | 2 | Gold rule and maroon closer earn pixels. Equal-weight chip row does not |
| 9 | Error Recovery | 1 | Empty path references `CatalogEmpty` with no import — runtime crash |
| 10 | Help and Documentation | n/a | Public browse; help is a human advisor, not docs |
| **Total** | | **20/36** | **Acceptable (56%)** |

H9 scored 1 after code verification (Assessment A had 2). Total kept at 20/36 after rounding the verified crash into Error Recovery while leaving the rest of A's table.

## Design Specificity Verdict

**LLM assessment:** Authored in chrome and copy (maroon/gold, honest intro, sale vs rent price bands). Interchangeable as a listing grid. That interchangeability is partly correct for Operate (familiar portal instrument). The failure is hiding QTRE chrome and Buy/Rent at the moment of use.

**Deterministic scan:** `detect.mjs --json` exit 0, 0 findings across eight files. Detector missed the missing `CatalogEmpty` import (logic, not a visual-rule hit).

**Visual overlays:** No reliable user-visible overlay. Browser visualization skipped: no mutation-capable browser tool.

## Overall Impression

The page tells the truth and then makes the visitor work for it. Honest heading and intro, then a chip strip that stalls until Apply, a header that leaves, and an empty state that will not render.

## What's Working

1. Voice locked to the brief: no testimonials, no Commercial filter, empty copy admits unpublished stock.
2. Market-literate numbers: sale vs rent AED bands, sq ft, community example.
3. Brand materials used as structure: gold 1px crown, Poppins H1, compact maroon closer.

## Priority Issues

**[P0] Empty catalog crashes.** `CatalogEmpty` is used in `app/[locale]/properties/page.tsx` without an import. Projects page imports it. Zero published sale listings (or a filter miss) throws instead of showing the honest empty copy.

**[P1] “Filters” means bathrooms; chips lie until Apply.** Select changes stay in local state. Results stay on the last URL. The control labeled `filterMore` (“Filters”) is baths.

**[P1] Catalog hides Buy vs Rent (and skip-to-content) when filtering.** Flow header becomes `inert` + `-translate-y-full` when the filter sentinel hits it. Locale, Contact, and the skip link leave the page.

**[P1] Success is listing-level inquiry; the closer is site-level Contact.** Compact closer reuses home “Speak with an advisor.” Cards are a single link. No inquire-about-this-unit on the index.

**[P2] Mobile filter is a sideways strip; layout toggle is unlabeled visually.** `overflow-x-auto scrollbar-none`. Apply sits at the end of a horizontal row. Grid/list is 44px with aria-label only.

**[P2] Edge paths don’t match the honest catalog.** `page` past `pageCount` 404s. Custom min/max that are not presets still filter but the Price chip reads as Any. Scan capped at 200.

## Persona Red Flags

**Jordan:** H1 is clear. Then “Filters” is not bathrooms; Apply is easy to miss; every card says For sale on a For-sale page.

**Casey:** Primary actions sit in a top sticky strip that also steals the header. Hidden horizontal overflow. Draft chips die on remount via `key={catalogSearchHref(...)}`.

**Riley:** Empty inventory: `CatalogEmpty is not defined`. `?page=99` → 404. `?minPrice=1500000` → filtered list, Price chip not showing 1.5M.

## Cognitive load

6/8 checklist failures (high). Filter bar itself is the overloaded decision point.

## Minor Observations

- Compact closer drops `contactBody`.
- `emptyBuyQuery` unused; page uses `emptyBuyFiltered`.
- Card + header + stuck-filter shadows stack three elevations.
- `filterApplying` is “Applying” not “Applying…”.
- Mailto/tel in compact closer lack focus-visible rings.

## Questions to Consider

1. If Buy vs Rent is the first move on the homepage, why does the catalog remove that move the instant someone starts filtering?
2. Is Apply a sign of a serious search, or a form leftover in a market where every chip is expected to reshape the list now?
3. If the job is find a published unit and contact an advisor about it, why is the last thing on the page a site-level conversation that does not know which listing they were looking at?
