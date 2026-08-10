# QuickTalk Real Estate — Brand Identity

> Status: Draft — palette, typography, primary logo, and voice & tone locked in. Additional logo variants and imagery guidance still to come.

## Core Palette

| Role | Hex | Usage |
|------|-----|-------|
| Primary | `#6A1017` | Burgundy — CTAs, links, active/selected states, brand accents |
| Secondary | `#C8A15B` | Gold — secondary actions, highlights, premium accents |
| Text | `#1F1F1F` | Near-black — body copy, headings |
| Background | `#FFFFFF` | Page background |

## Supporting Surfaces (optional, not core brand colors)

| Hex | Official Name | Role | Usage |
|-----|----------------|------|-------|
| `#F8F4EC` | Warm Ivory | Warm section background | Alternating full-width section backgrounds on the public site |
| `#F5EFE6` | Light Beige | Card / alternate surface | Card backgrounds, elevated surfaces distinct from the white page |
| `#EEE6D8` | Warm Sand | Subtle highlight | Hover/active highlight state on light surfaces |
| `#E7E3DD` | Soft Gray | Border / divider | Borders, dividers, input outlines |

Official names for the core colors (per brand board): `#6A1017` = **Deep Maroon**, `#C8A15B` = **Luxury Gold**.

Rationale: keeping these as *supporting* neutrals rather than "core brand colors" means burgundy/gold stay the dominant visual signal instead of competing with a busy palette — this is what keeps the site reading as premium rather than templated.

## Token Mapping (`app/globals.css`)

The palette above maps directly onto the shadcn/ui semantic tokens already consumed by components (confirmed against `components/ui/button.tsx`, which uses `bg-primary`, `bg-secondary`, `bg-muted`, `border-border`, etc.):

| Token | Light | Dark | Notes |
|-------|-------|------|-------|
| `--background` | `#FFFFFF` | `#17110F` | |
| `--foreground` | `#1F1F1F` | `#F5EFE6` | |
| `--card` / `--popover` | `#F5EFE6` | `#221715` | "card/alternate section" from the brand board |
| `--primary` | `#6A1017` | `#9B3A42` | Dark-mode primary is a lightened burgundy — keeps the brand hue recognizable while meeting contrast against a dark background (see Accessibility below) |
| `--primary-foreground` | `#FFFFFF` | `#FFFFFF` | |
| `--secondary` | `#C8A15B` | `#C8A15B` | Gold stays constant across modes — already light enough to read on dark |
| `--secondary-foreground` | `#1F1F1F` | `#1F1F1F` | Dark text on gold (see contrast note) |
| `--muted` | `#F8F4EC` | `#241C18` | "warm section background" |
| `--muted-foreground` | `#6B6459` | `#B8AC9C` | Derived warm gray — de-emphasized text, not specified on the brand board |
| `--accent` | `#EEE6D8` | `#2E2420` | "subtle highlight" |
| `--border` / `--input` | `#E7E3DD` | `rgba(245,239,230,.12)` | "border/divider" |
| `--ring` | `#6A1017` | `#C8A15B` | Focus ring tied to brand instead of generic gray |
| `--destructive` | `#B3261E` | `#E5534B` | Kept semantically distinct from primary burgundy so errors are unambiguous |
| `--chart-1..5` | burgundy, gold, bronze, sage, warm gray | (dark-adjusted) | For future admin dashboard analytics — not specified on the brand board, derived to harmonize |
| `--sidebar-*` | mirrors card/accent/border | mirrors dark card/accent/border | Placeholder for the admin dashboard shell (Phase 3 in `PLAN.md`) — revisit once the admin UI is actually designed |

Everything not explicitly given (dark mode, focus ring, destructive red, chart colors, sidebar) was derived to stay harmonious with the four core colors — treat these as a reasonable starting default, not a locked decision.

## Accessibility Notes

Contrast checked against WCAG 2.1 AA (4.5:1 for text):

- White text on `#6A1017` (primary): **~12.4:1** — passes AAA.
- `#1F1F1F` text on `#C8A15B` (secondary): **~6.8:1** — passes AA. *(White text on secondary only reaches ~2.4:1 — do not use white text on gold.)*
- `#1F1F1F` text on `#F8F4EC` / `#F5EFE6` / `#EEE6D8`: all pass AA comfortably (very light backgrounds).

**Rule of thumb:** primary (burgundy) always pairs with white text; secondary (gold) always pairs with dark (`#1F1F1F`) text.

## Typography

| Role | Font | Weights | CSS variable | Tailwind utility |
|------|------|---------|--------------|-------------------|
| Headings (`h1`–`h6`) | Poppins | 400, 500, 600, 700 | `--font-heading` | `font-heading` (applied by default to all heading tags via `@layer base`) |
| Body / UI text | Inter | Variable | `--font-sans` | `font-sans` (applied to `html` by default) |
| Monospace (data/codes) | Geist Mono | Variable | `--font-mono` | `font-mono` |

Loaded via `next/font/google` in `app/layout.tsx` — self-hosted, no external font requests, no layout shift.

Rationale: Poppins is a geometric sans with confident, rounded letterforms — reads as premium/editorial for hero headlines and section titles without tipping into "startup SaaS" territory. Inter is optimized for small-size legibility (property specs, table data, form labels) where Poppins would feel heavy or less readable.

**Note:** the original brand board specifies **Cormorant Garamond** (heading) + **Montserrat** (body) instead. Decision (2026-08-07): keep Poppins + Inter — the board's serif/Montserrat pairing is treated as superseded by this choice. Revisit if the board is the canonical reference going forward.

## Logo

| Variant | File | Dimensions | Notes |
|---------|------|------------|-------|
| Full horizontal lockup | `public/brand/qtre-no-bg.png` | 820×304px, transparent background | "Q" mark + "Quick Talk / Real Estate" wordmark in `--primary` burgundy. Primary logo for header/footer on light backgrounds. |

| Icon/mark only | `app/icon0.svg`, `app/icon1.png`, `app/apple-icon.png` | — | The "Q" symbol cropped from the full lockup, used as the favicon/PWA icon set. Already regenerated via realfavicongenerator to match the brand (confirmed 2026-08-07). |

Not yet produced (add here once available):

- [ ] Monochrome/white variant — **confirmed needed** by the brand board, which shows the logo in white over the burgundy panel and over a photo background (Burj Khalifa). Used whenever the logo sits on `--primary` or a photographic hero image.
- [ ] Vector (SVG) source of the full horizontal lockup — current asset is a raster PNG; request/export an SVG if scaling to large hero sizes or print

## Voice & Tone

**Archetype: Confident Investment Authority** — authoritative, data-informed, speaks directly to sophisticated investors rather than generic homebuyers. Chosen as the closest match to the brand board's own sample copy.

**Tagline:** "Bridging Opportunities. Building Futures."

**Sample copy (from brand board hero example):**
> Luxury Dubai Living
> PROPERTY INVESTMENT
> Quick Talk Real Estate connects discerning investors with Dubai's most distinguished addresses — bridging opportunity with lasting value.

### Brand Personality

| Trait | Description |
|-------|-------------|
| **Authoritative** | Deep market knowledge, speaks with expertise about Dubai real estate |
| **Discerning** | Addresses sophisticated investors, not mass-market buyers |
| **Assured** | Confident claims, no hedging, no overselling |
| **Precise** | Value/opportunity-oriented language over emotional filler |

### Voice Chart

| Trait | We Are | We Are Not |
|-------|--------|------------|
| Authoritative | Expert, well-informed | Arrogant, dismissive |
| Discerning | Selective, sophisticated | Elitist, exclusionary |
| Assured | Confident, direct | Pushy, salesy |
| Precise | Value-focused, clear | Cold, purely transactional |

### Tone by Context

| Context | Tone | Example |
|---------|------|---------|
| Property/project listings | Descriptive, factual, aspirational | "A rare address in Downtown Dubai, positioned for long-term capital growth." |
| Marketing / hero copy | Confident, editorial | See tagline + sample copy above |
| Lead / contact forms | Direct, reassuring | "Speak with an advisor about this opportunity." |
| Error messages | Calm, solution-focused | "That listing is no longer available — here are similar opportunities." |
| Admin / internal UI | Plain, efficient | "Save changes", "3 leads awaiting response" |

### Vocabulary

**Lean into:** discerning, distinguished, opportunity, lasting value, portfolio, positioned, bridging, curated, exclusive access

**Avoid:** "cheap," "deal of the century," "act now!!," generic hype language, exclamation-heavy CTAs, overly casual slang

This is a reasonable extrapolation from one confirmed example + the tagline — revisit and refine once more real copy (property descriptions, email templates, etc.) exists to validate against.

## Open for Next Round

- [ ] Monochrome/white logo variant
- [ ] Vector (SVG) logo source

**Deferred (not blocking):** Imagery style guidance for property/project photography — skipped for now since it doesn't block any code. Revisit once real property/project photos start getting uploaded (`PLAN.md` Phase 4/5).

## Changelog

| Date | Change |
|------|--------|
| 2026-08-07 | Core palette locked in and wired into `app/globals.css` |
| 2026-08-07 | Typography set: Poppins (headings) + Inter (body), wired into `app/layout.tsx` |
| 2026-08-07 | Primary logo lockup added at `public/brand/qtre-no-bg.png` |
| 2026-08-07 | Full brand board reviewed: official color names added, tagline confirmed, white/reversed logo variant confirmed needed, Poppins+Inter confirmed over board's Cormorant Garamond+Montserrat |
| 2026-08-07 | Voice & tone framework set: Confident Investment Authority archetype |
