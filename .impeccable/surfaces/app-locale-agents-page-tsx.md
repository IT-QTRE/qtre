---
version: 1
slug: "app-locale-agents-page-tsx"
primary_target: "app/[locale]/agents/page.tsx"
related_targets: ["components/public/agent-directory.tsx","components/public/agent-profile-card.tsx"]
---

# Surface: Public agents index

- **Mode:** Experience (advisor desk) with Read wayfinding into `/agents/{slug}`.
- **Audience:** Dubai buyers choosing who to speak with, and advisors judging how QTRE presents them.
- **Job:** Scan published advisors as calling cards, then open a profile or mail/call when published. No invented titles, bios, metrics, or follow actions.
- **Action:** Open a published advisor profile, or use a real email/phone on the card.
- **Proof:** Convex published agents only. Photo only with `imageUrl`. Firm line is the brand name. Contact only when email/phone exist. Count is the published length.
- **Direction:** Ivory calling cards with a gold frame, full-height portrait panel, QTRE mark, name, published position, firm, then labeled email/phone. Landscape stamp at every width — do not stack a full-bleed 3:4 plate on the phone. Not a social profile card. Not listing-card chrome.
- **Memorable moment:** Maroon intro, then a desk of QTRE business cards.
- **Scope:** `app/[locale]/agents/page.tsx` plus agent-directory / agent-profile-card. `listPublishedAgents` now returns email and phone.
- **Untouched:** Agent slug layout, developer pages, catalog listings.
