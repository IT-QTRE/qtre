---
version: 1
slug: "app-locale-page-tsx"
primary_target: "app/[locale]/page.tsx"
related_targets: []
---

# Surface: Public homepage

- **Mode:** Persuade (public home) with an Operate first action (search).
- **Audience:** Dubai buyers, renters, and investors arriving to find inventory.
- **Job:** First viewport starts a catalog search (sale / rent / project, location when available). Featured listings and brand story sit below, never instead of search.
- **Action:** Submit search → properties or projects listing with those params.
- **Proof:** Real published Convex records; empty states stay honest. No invented testimonials or stock-as-listing.
- **Approved mock:** `.impeccable/mocks/home-comp-b2-type.png` was the type-led start. Live trial: media field + maroon scrim + compound search bar; headline is the real tagline. Video from `public/brand/hero.mp4` when present.
- **Composition:** White header + full-viewport hero + inventory below. No serif slogan, no stock villa, no ticket. `prefers-reduced-motion` pauses video.
- **Scope:** `app/[locale]/page.tsx` plus public nav/footer chrome this page requires.
- **Untouched:** Admin, portals, List Your Property funnel, commercial filter (no field yet).
- **Open:** Map provider (do not make the first viewport depend on a map).
