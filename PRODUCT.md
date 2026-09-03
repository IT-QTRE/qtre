# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary visitors of the public site are people looking for Dubai real estate **and** people allocating capital: home seekers (including renters) and investors. They arrive to browse a catalog — ready properties, off-plan projects, sale and rent — not to operate an admin tool.

Secondary audiences exist but are out of scope for this public-site pass: Agents and listing Clients have portal routes that remain placeholders. The public site does not need to recruit sellers until Client Portal ships.

Staff (Super Admin, Admin) author listings in `/admin`; they are not the public-site user.

## Product Purpose

QuickTalk Real Estate (QTRE) is a Dubai brokerage website whose public job is to let a visitor find and understand real inventory: properties (sale and rent) and projects (buildings / off-plan), plus the developers, agents, and communities behind them. Success is a visitor locating a relevant listing and contacting an advisor about it (listing-level inquiry), or continuing into the catalog with trust that what they see is accurate.

## Positioning

QTRE stands for a **serious, accurate catalog** — sale, rent, off-plan projects, ready properties — not a scarce “by invitation” boutique and not an advisory brand that hides inventory. Trust comes from range and correct listing data. Brand voice may still sound like Confident Investment Authority; the product claim is the catalog, not a unique access mechanism.

Commercial-as-a-category is a **desired catalog facet** stated by the product owner. It is not yet a first-class field in Convex (`properties` have `listingStatus` of sale/rent/sold/rented/off_market; `projects` have construction status). Do not present commercial as a live filter until the data model supports it.

## Operating Context

Visitors use a locale-prefixed public site (`/en`, `/ar`, `/tr`). Inventory is entered in the Admin dashboard (Convex). Public pages consume published records. Listing inquiries go to Convex `leads`; the general Contact page is a GoHighLevel embed (Phase 5, not built). “List Your Property” is specified to enter Client Portal sign-up; that portal is skipped for now, so that CTA must not be treated as a working funnel.

## Capabilities and Constraints

- **In scope now:** Phase 5 public pages (home, properties, projects, developers, agents, communities, about, blog, contact, listing inquiry), designed inside the locked brand.
- **Deferred:** Agent Portal, Client Portal, submission review queue (remaining Phase 4).
- **Locales:** English, Arabic (RTL), Turkish.
- **Auth:** Clerk for portals; public catalog is unauthenticated.
- **Blog bodies:** Tiptap HTML; sanitize with `sanitize-html` (not DOMPurify/jsdom) on public render to avoid serverless 5xx.
- **No buyer accounts** (no favorites/saved search).
- **Map provider** for listing detail is still an open product decision.

## Brand Commitments

- Name: QuickTalk Real Estate (QTRE).
- Tagline: “Bridging Opportunities. Building Futures.”
- Voice: Confident Investment Authority — authoritative, discerning, assured, precise. Not hype, not “deal of the century.”
- Locked identity in `BRAND.md` and `app/globals.css`: primary `#6A1017`, secondary `#C8A15B`, text `#1F1F1F`, background `#FFFFFF`; headings Poppins, body Inter; logo `public/brand/qtre-no-bg.png` (burgundy lockup for light grounds). White/reversed logo is still missing.

## Evidence on Hand

- Admin can already create properties, projects, developers, agents, communities, blog posts, and media.
- Public homepage is a QTRE catalog surface (`/en`): hero search, published inventory, communities, developers, blog, and contact from Website Settings.
- Public Buy catalog (`/en/properties?status=sale`) lists published sale inventory with a sticky filter bar (community, price, beds, size, baths), count, and crawlable listing links.
- No approved testimonials, press, awards, or occupancy/ROI figures. Do not invent them.
- Property photography depends on what admins upload; volume and quality are unknown. Do not substitute stock skylines as if they were this listing.

## Product Principles

1. **Catalog is the product.** Homepage and nav exist to get someone into sale, rent, or a project — not to perform brand theatre without inventory.
2. **Serve both jobs on one site.** Investment language is allowed; search, price, beds, and rent/sale status must stay first-class so a home-seeker is not locked out.
3. **Accuracy over claims.** Show real published fields. Do not fabricate social proof, prices, or “distinguished” status a listing does not have.
4. **Brand is already decided.** Public work extends `BRAND.md`; it does not reopen palette, type, or voice.
5. **Unbuilt funnels stay honest.** Do not ship a List Your Property or portal CTA that pretends those flows exist.
