---
version: 1
slug: "app-locale-developers-page-tsx"
primary_target: "app/[locale]/developers/page.tsx"
related_targets: ["components/public/developer-directory.tsx","components/public/developer-logo-marquee.tsx","components/public/developer-name-link.tsx"]
---

# Surface: Public developers index

- **Mode:** Experience (house showcase) with Read wayfinding into `/developers/{slug}`.
- **Audience:** Dubai buyers scanning who stands behind published stock, and developers judging how QTRE presents their name.
- **Job:** Make the published houses feel ceremonial on arrival, then offer a complete A–Z name list into each profile.
- **Action:** Open a developer profile from a mark or a name.
- **Proof:** Real published Convex developers only. Logos appear only when `imageUrl` exists. Count is the published length. Empty copy stays honest.
- **Direction:** Locked BRAND.md (maroon field, gold rule, Poppins names, Inter body). Magic UI Marquee pattern locally — no Magic UI package, no fake marks.
- **Memorable moment:** Full-bleed maroon intro under the floating header; gold-edged marks travel; names at directory scale with the home gold wipe.
- **Scope:** `app/[locale]/developers/page.tsx` and the directory/marquee/name-link components it needs. Home roster reuses the shared name link.
- **Untouched:** Developer slug profiles, agents index/slug, project/property slugs, Magic UI install.
