---
target: homepage hero caption plates
total_score: 16
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 2
timestamp: 2026-08-18T07-46-15Z
slug: app-locale-page-tsx
---
Method: dual-agent (A: 7c5ea450-ee58-4221-9473-55d6507eaea1 · B: f12ce545-0e31-4938-8a94-5cebdd144645)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Search pending is labeled; video has no poster and loads after idle, so the field is a maroon void then cinema. |
| 2 | Match System / Real World | 2 | Buy/Rent/community is catalog language. Boxed slogans over a tourist monument are not how a serious desk presents. |
| 3 | User Control and Freedom | 3 | Intent and query can be changed; pending navigation has no cancel. |
| 4 | Consistency and Standards | 2 | Header gold underline vs search maroon underline; approved type-led mock vs live boxed captions. |
| 5 | Error Prevention | 2 | No typeahead; empty submit silently browses all. |
| 6 | Recognition Rather Than Recall | 3 | Intents and Search are labeled. Off-plan still assumes market literacy. |
| 7 | Flexibility and Efficiency | n/a | Persuade first viewport; expert accelerators are not the job. |
| 8 | Aesthetic and Minimalist Design | 1 | Opaque caption plates on a film still. Gold square and divider compete with the image. |
| 9 | Error Recovery | 2 | Hero has no recovery copy. Video fail is silent. |
| 10 | Help and Documentation | n/a | Persuade + Operate search; no help system required in the first viewport. |
| **Total** | | **16/32** | **Acceptable** |

#### Design Specificity Verdict

**LLM assessment:** Authored scene, interchangeable overlay. The Museum of the Future dusk footage and the Buy/Rent/Off-plan bar are specific to this brokerage. The two opaque caption plates are not. They are a Canva/PowerPoint highlight-box that could sit on a school poster.

**Deterministic scan:** `detect.mjs --json` on `app/[locale]/page.tsx`, `hero-media.tsx`, and `home-search.tsx` returned `[]` (exit 0). Zero primary, zero advisory. Regex TSX mode cannot catch computed-style issues (contrast, tracking, clipping).

**Visual overlays:** No reliable user-visible overlay. Browser injection unavailable (no MCP browser tools). Fallback: CLI-only. Dev server is serving `/en` 200.

#### Overall Impression

The film is expensive. The boxes are a high-school caption trick we used after white type failed on bright sky. Search is the real product. Hierarchy is inverted.

#### What's Working

1. Owned Dubai film, not a stock villa.
2. Compound search is the right first action.
3. Real tagline, locked brand, no invented stats.

#### Priority Issues

**[P1] Caption plates are PowerPoint on a cinema still**
- **Why it matters:** Amateur craft on the first viewport. A Dubai investor judges the desk by this.
- **Fix:** Kill the plates. Type in a quiet zone, or drop the tagline from the photo — the header already names the firm.
- **Suggested command:** `/impeccable typeset` then `/impeccable distill`

**[P1] Hierarchy inversion: slogan louder than search**
- **Why it matters:** Catalog-is-the-product loses to brand-board copy.
- **Fix:** One primary: the bar. Tagline, if it stays, is supporting — small, unboxed.
- **Suggested command:** `/impeccable layout`

**[P2] Duplicate Buy/Rent/Off-plan in header and hero**
- **Why it matters:** Same catalog question twice in one viewport.
- **Fix:** Header wayfinding; hero owns intent.
- **Suggested command:** `/impeccable distill`

**[P2] Video has no poster; delayed load; reduced-motion is a maroon hole**
- **Why it matters:** First impression is a void, then cinema pops in — or never.
- **Fix:** Still from the same plate as poster and reduced-motion fallback.
- **Suggested command:** `/impeccable optimize`

**[P2] Landmark-as-atmosphere still reads tourist Dubai**
- **Why it matters:** Locals do not shop the Museum of the Future. Covering it with slogan boxes makes it a postcard.
- **Fix:** If the plate stays, stop covering it.
- **Suggested command:** `/impeccable quieter`

#### Persona Red Flags

**Jordan:** Slogan does not say what to do. Off-plan unexplained. Header Buy vs bar Buy.

**Casey:** Search sits mid-viewport on a full-svh hero; no poster on 4G; stacked intents easy to mis-tap.

**Dubai home-seeker / investor:** Tourist monument, no AED/community in first viewport, caption boxes signal intern not desk.

#### Minor Observations

- Uppercase SEARCH with wide tracking is template-luxury.
- Gold square as sentence terminator reads as clip-art.
- Story section later says “A catalog, not a pitch” while the hero is the pitch.

#### Questions to Consider

- If the film is already the persuasion, what are the boxes for except fear that type on a photo is unreadable?
- Delete the tagline from the hero. Does anyone fail to know this is QTRE?
- Are we high school? The plates are. The video is not.
