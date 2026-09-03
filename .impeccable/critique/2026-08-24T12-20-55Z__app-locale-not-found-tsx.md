---
target: public 404 page
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-24T12-20-55Z
slug: app-locale-not-found-tsx
---
# Public 404 critique

**Target:** `app/[locale]/not-found.tsx` → `components/public/not-found-page.tsx`
**Mode:** Operate — recover a lost visitor to home or Buy / Rent / Off-plan

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Page is the status; requested URL/slug is never shown |
| 2 | Match System / Real World | 3 | Plain title + listing diagnosis; oversized “404” is HTTP jargon |
| 3 | User Control and Freedom | 3 | Four exits; no Back, no locale; chrome was removed by brief |
| 4 | Consistency and Standards | 3 | Labels match PRIMARY_NAV and tokens; visual world is a different room |
| 5 | Error Prevention | 2 | Destinations are real; overflow:hidden on html/body/main can clip them |
| 6 | Recognition Rather Than Recall | 3 | Actions labeled; dead path not echoed |
| 7 | Flexibility and Efficiency | 2 | Alternate doors exist; no search or expert path |
| 8 | Aesthetic and Minimalist Design | 2 | Numeral + grain + mudded video do not earn the Operate job |
| 9 | Error Recovery | 3 | Names the class of problem and offers next steps; not the specific page |
| 10 | Help and Documentation | 2 | Recovery links are the only help; “Pages” is a weak label; contact died with footer |
| **Total** | | **26/40** | **Acceptable** |

## Design Specificity Verdict

**LLM assessment:** Locked QTRE palette and recovery IA on a category-interchangeable luxury-404 composition. Maroon field, gold hairline, Poppins heading, and gold pill are the brief. Giant mono `404`, film grain, radial vignette, nested island-button, and a hero video driven down under ~72% maroon are the 2024–26 boutique-agency 404 template wearing QTRE colors. Not purple-AI, not Inter-only, not three equal cards. Still reads as a branded error poster more than a Dubai catalog recovery.

**Deterministic scan:** Detector returned `[]` (exit 0) on `components/public/not-found-page.tsx` and `app/[locale]/not-found.tsx`, including `--no-config`. Zero anti-pattern hits. This was a regex TSX pass; computed-style / contrast / layout rules that need a rendered page were not run.

**Visual overlays:** No reliable user-visible overlay. Mutation unavailable: no browser MCP and Playwright/Puppeteer not installed. Live-server was not started.

## Overall Impression

Structurally right, visually overdressed. The job (say the page is gone, then get out) is solved in the IA. The largest object on the page is a number the visitor cannot use. Combined with a locked non-scrolling viewport and Latin-only fonts, this is not yet a professional ship for a three-locale Dubai brokerage.

## What's Working

1. One primary (“Back to home”) and three real catalog intents. Catch-all `[...rest]` → `notFound()`. No invented listings.
2. Voice is not slop: no “Oops,” no hype. Copy names a withdrawn listing. Tokens and reduced-motion / RTL arrow mechanics are production-grade.
3. Desktop split (copy in 7 cols, links on the trailing edge) is the one non-generic layout move.

## Priority Issues

**[P1] Operate hierarchy inverted by a generic luxury 404 stack**
- **What:** Decorative `404` up to 16rem, film grain, radial vignette, hero video under ~72% maroon.
- **Why it matters:** The visitor’s job is to leave. The first thing they get is a status-code poster.
- **Fix:** Kill or radically shrink the numeral. Let the h1 and gold Home lead. If the plate stays, it has to be seen or it should not load.
- **Suggested command:** `/impeccable distill` then `/impeccable quieter`

**[P1] Viewport cannot scroll**
- **What:** `html`/`body` `:has([data-not-found-page]) { overflow: hidden }` plus `main.overflow-hidden.fixed.inset-0`.
- **Why it matters:** Long AR/TR titles, 390px, 200% zoom, or a taller system font will clip the CTA or the three links.
- **Fix:** Allow `overflow-y: auto` on the field. Keep the maroon; lose the trap.
- **Suggested command:** `/impeccable adapt` then `/impeccable harden`

**[P1] Locked heading face does not serve `/ar` or `/tr`**
- **What:** Poppins and Inter are `subsets: ["latin"]` only.
- **Why it matters:** Arabic and Turkish copy cannot wear the locked heading. `/ar` looks like a cheaper product.
- **Fix:** Load Arabic and latin-ext for the public heading/body stack.
- **Suggested command:** `/impeccable harden`

**[P2] Identity is too thin for a chrome-less room**
- **What:** No reversed logo. Gold `text-sm` name only. Header/locale/contact gone.
- **Why it matters:** A first-timer from WhatsApp/Google does not get proof they are still inside QTRE.
- **Fix:** Reversed lockup, or keep one familiar chrome cue.
- **Suggested command:** `/impeccable polish`

**[P2] Recovery is categorical, not specific**
- **What:** No slug, no search, no advisor. Same “listing withdrawn” line for a dead blog path.
- **Why it matters:** A buyer who lost a unit gets three mall doors after the shop closed.
- **Fix:** Echo the path in plain language; keep the three intents.
- **Suggested command:** `/impeccable clarify`

## Persona Red Flags

**Jordan (first-timer):** Header-less maroon void, small gold name, giant “404.” Will read it as a server failure, hit browser Back, and not explore.

**Casey (mobile):** Home is in the upper stack, not the thumb zone. Video still schedules unless reduced motion. Overflow-hidden + large type is the clip scenario.

**Sam (a11y):** Reading order is decent; decorative 404 is hidden; skip link survives. Then: chrome display:none, thin gold focus on text links, 200% zoom vs locked overflow, Latin-only fonts on Arabic.

**Dubai buyer / investor:** Copy is written for them. Then the product fails: no building, no slug, no advisor. Maroon-as-velvet-rope contradicts “catalog is the product.”

## Cognitive load

2 of 8 checklist failures (single focus, visual hierarchy) = moderate. Decision points: Home + Buy + Rent + Off-plan = 4, at the ceiling. Do not add Contact or Search without grouping.

## Minor Observations

- `linksLabel` “Pages” is IA leftover, not voice.
- Three dialects of gold hairline (viewport, title rule, per-link).
- Header/footer hidden with CSS `:has()`, not unmounted; layout still pays for chrome on a dead URL.
- Home pill `whitespace-nowrap` will overflow in AR on a narrow frame.
- `max-w-[14ch]` is an EN tool; Arabic `ch` does not measure Arabic.

## Questions to Consider

- If the job is Operate, why is the largest object on the page a number the visitor cannot use?
- Would a chrome-on 404 with the real logo recover faster than a maroon takeover that has to re-explain who you are?
- Is “listing withdrawn” a lie for every unmatched URL?
