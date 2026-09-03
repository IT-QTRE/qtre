---
target: homepage search bar
total_score: 17
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 3
timestamp: 2026-08-18T08-07-00Z
slug: components-public-home-search-tsx
---
Method: dual-agent (A: 128e1eaf-852f-49d5-82b5-d3e2f090e8c9 · B: e4c1eeee-4b81-439e-8b9a-ba4e1de0d75c)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Focus exists but boxes the typed letters only; icon sits outside. |
| 2 | Match System / Real World | 3 | Buy/Rent/community is desk language. Caps SEARCH is hotel-widget language. |
| 3 | User Control and Freedom | 2 | Intent and query editable. No clear on typed query. Pending has no cancel. |
| 4 | Consistency and Standards | 1 | Header gold underline + instant route vs bar maroon underline + wait for Search. Nested focus ring. |
| 5 | Error Prevention | 2 | Free text, no typeahead. |
| 6 | Recognition Rather Than Recall | 3 | Labels visible. Communities are not. |
| 7 | Flexibility and Efficiency | n/a | Persuade first viewport. |
| 8 | Aesthetic and Minimalist Design | 2 | One white chip is right. Caps SEARCH, orphaned icon, duplicate Buy row are noise. |
| 9 | Error Recovery | 2 | No inline miss. Recovery is later empty catalog. |
| 10 | Help and Documentation | n/a | No help system belongs in the first viewport. |
| **Total** | | **17/32** | **Acceptable** |

#### Design Specificity Verdict

**LLM:** Authored job, interchangeable instrument. Three catalog intents are QTRE. The white booking chip, Lucide magnifier, input-only ring, and tracked SEARCH are a hotel widget on the Dubai plate.

**Deterministic scan:** `detect.mjs --json` on `home-search.tsx` returned `[]` (exit 0).

**Visual overlays:** No overlay. Fallback: CLI-only.

#### Overall Impression

Right instrument, unfinished envelope. The screenshot’s maroon box around “as” with the icon in the gutter is the tell.

#### What's Working

1. One compound bar: intent + location + go.
2. Active intent is text + underline, fill reserved for submit.
3. Real field: text-base, min-h-12, routes to catalog.

#### Priority Issues

**[P1] Fragmented focus** — ring on input, icon outside. Fix: focus the field cluster.
**[P1] SEARCH caps + 0.14em tracking** — second shout on an already maroon fill. Fix: sentence case.
**[P1] Duplicate Buy/Rent/Off-plan with header** — two verbs, two underline colors. Out of this detail pass.
**[P2] Alignment** — floating inner underline, inset button, three paddings.
**[P2] Hierarchy** — SEARCH brick louder than the field.

#### Persona Red Flags

Jordan: two Buys; inner box looks broken. Casey: stacked mobile is cleaner than desktop. Dubai visitor: typing “as” expects communities, gets a hotel widget.

#### Minor Observations

Placeholder almost as dark as typed text. Magnifier looks clickable. Turkish intent labels will blow width.

#### Questions to Consider

Would a confident desk draw a focus ring around part of its own instrument?
