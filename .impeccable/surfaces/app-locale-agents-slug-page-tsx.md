---
version: 1
slug: "app-locale-agents-slug-page-tsx"
primary_target: "app/[locale]/agents/[slug]/page.tsx"
related_targets: ["components/public/agent-folio.tsx","components/public/agent-identity.tsx"]
---

# Surface: Public agent profile

- **Mode:** Experience (advisor file) with Read into that advisor's published listings.
- **Audience:** Buyers choosing who to speak with, and the advisor seeing how QTRE presents them.
- **Job:** Portrait first at desk scale, name at a human heading, then real bio, contact, and listings. No invented title or socials.
- **Action:** Mail or call when published, or open a listing.
- **Proof:** Convex published agent only. Empty 3:4 plate if no photo. Counts are real list lengths.
- **Direction:** Short maroon breadcrumb bar (same family as `/agents`), then the enlarged desk row — not the house-name monument on `/developers/{slug}`.
- **Memorable moment:** 3:4 portrait beside the name on white, gold hairline, sticky contact rail.
- **Scope:** `app/[locale]/agents/[slug]/page.tsx` plus agent-folio / agent-identity. Reuses the developer contact plate and onPrimary breadcrumb.
- **Untouched:** Agent index, developer pages, listing slugs.
