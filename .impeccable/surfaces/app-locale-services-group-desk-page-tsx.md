---
version: 1
slug: "app-locale-services-group-desk-page-tsx"
primary_target: "app/[locale]/services/[group]/[desk]/page.tsx"
related_targets: ["components/public/service-desk-folio.tsx","components/public/site-header.tsx"]
---

# Surface: Public service desk

- **Mode:** Read, close on Contact.
- **Audience:** Someone who opened a visa or license desk from Services nav, not the old QTB tab strip.
- **Job:** Dedicated URL per desk. Residence is the first full dossier (types, documents, process, 15–20 working days). Other desks hold hub summaries until pasted.
- **Action:** Contact / Apply for a residence visa.
- **Proof:** User paste for Residence; `SERVICES.md`. Dropped QTB gateway line, hassle-free, and four generic feature tiles.
- **Direction:** No tabs. `/services/visa/{desk}` and `/services/license/{action}`. DirectoryHero, lists, numbered process where sequence matters.
- **Scope:** `app/[locale]/services/[group]/[desk]/page.tsx`, `components/public/service-desk-folio.tsx`, nav dropdown, hub links.
- **Untouched:** Homepage VisaBand, About, admin, company-formation pages.
- **Open:** Remaining eight pastes; whether QTRE performs vs refers.
