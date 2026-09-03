# Property listing detail — Design Spec

> Status: Approved in chat (2026-08-21). Route: `app/[locale]/properties/[slug]/page.tsx` (`/en/properties/{slug}`). Shared by Buy and Rent.

## Goal

A visitor who opened a published unit from Buy or Rent can **decide if it is worth a call**, then **send a listing-level inquiry**. Success is a Convex `leads` row with this `propertyId`. The page is not a brochure, not a compare tool, and not a second catalog.

## What already exists

- Slug page renders title, location, price, beds/baths/area, one cover image, description, optional Google map, compact email/phone closer.
- Back link always goes to `?status=sale` (wrong for rent).
- Catalog cards and filter bar already set the visual language (white cards, maroon price, gold 1px rule, Poppins/Inter).
- `leads` table already has `name`, `email`, `phone?`, `message?`, `propertyId?`, `status`, `assignedAgentId?`, `createdAt`. Admin can list/update/delete. **There is no public create.**
- `getPublishedPropertyBySlug` returns card fields plus address/placeId/coordinates. It does **not** return gallery, amenities, agent, project, or developer.
- Public project detail exists (`/projects/{slug}`). Public agent/developer **lists** exist; **profile slugs and community pages do not.**

## Out of scope

- Similar listings / “you might also like.”
- Favorites, saved search, WhatsApp row, testimonials, occupancy/ROI, stock photography.
- A different layout for sale vs rent.
- Project detail redesign (properties first).
- Captcha / IP rate-limiting infrastructure (validation + published-property check only this pass).
- Linking to agent, developer, or community **profile** routes that do not exist yet.

## Approaches considered

1. **Split folio (chosen).** Gallery + facts on the left; sticky inquire on the right (`lg+`). Phone: price/facts, gallery, the rest, form last.
2. **Gallery banner.** Full-width photos, then copy | form. Rejected: brochure-first; they chose decide-then-inquire.
3. **Compact sheet.** Price and form dominate; photos as a strip. Rejected: too much like admin.

## Visitor mode

**Persuade, with an Operate closer.** The unit has to be understood; the last job is submitting the form. Brand stays locked (`BRAND.md`): maroon `#6A1017`, gold `#C8A15B`, white ground, Poppins headings, Inter body.

## Layout

Desktop (`lg+`): two columns. Left ~minmax(0, 1fr). Right ~20–24rem inquire, `sticky` under the site header. Phone: single column.

**Left, in order**

1. Breadcrumb: Home / Buy or Rent / title. Buy vs Rent from `listingStatus` (`for_sale` → `/properties?status=sale`, `for_rent` → `/properties?status=rent`).
2. Gallery of `mediaItems` for this property (images only, `order` ascending).
   - 0: honest placeholder (existing catalog copy). No stock skyline.
   - 1: one image, ~4/3.
   - Many: large photo with four tiles beside it; the fourth tile shows “+N more” when there are extra images. Click opens the full gallery. First image is LCP (`priority`). Phone: one photo at a time with previous/next arrows.
3. Price (AED, same formatter as cards), H1 title, community or city, beds / baths / sq ft with the same icons/dividers as listing cards. Do not repeat a redundant “For sale” badge on a sale listing; rent listings may show For rent so the shared template is unambiguous.
4. Description (full localized body, `text-pretty`, max prose width).
5. Amenities: only if `amenities.length > 0`. Render the stored strings (curated names are already English labels). No empty “Amenities” heading.
6. Map: only if `coordinates` exist. Reuse `PublicListingMap`. Caption = address or community/city. No map section when there is no pin.
7. Related: a short definition list of **published** links/names that exist:
   - Project → `/projects/{slug}` when the linked project is published.
   - Community → **name only** (no href until a public community page exists).
   - Developer → **name only** (list page is not this developer).
   Omit any row whose entity is missing or unpublished.
8. Agent: only if `agentId` is set **and** that agent is published. Show name and photo if uploaded. No agent email/phone here (PII; inquiry is the form). No link to a missing agent slug page.

**Right: inquire**

- Heading: inquire about **this** listing (title in the copy).
- Fields: name*, email*, phone (optional), message (optional). Hidden `propertyId`.
- Submit creates the lead. Pending state on the button. Field errors stay on the fields.
- Success: replace the form with a short confirmation (no invented SLA). Do not navigate away.
- Fallback: website settings email/phone as text links under the form, not a second maroon closer. Remove the page-level compact `ContactCloser` from this route so contact is not duplicated.
- Phone: the form sits **at the end**, after description / amenities / map / related / agent. Desktop keeps sticky inquire on the right.

Sticky header behavior from the catalog (hide when filters stick) does **not** apply here; this is not the catalog index. Default public header (fixed on inner pages) stays.

## Data

Expand `getPublishedPropertyBySlug` (keep unpublished → `null` / 404):

- `images: { url, alt }[]` — all image `mediaItems` for the property, in `order`. Cover for LCP is `images[0]`. Keep existing `imageUrl` / `imageAlt` as that same first image so catalog cards do not change.
- `amenities: string[]` (empty array if none).
- `agent: { name, imageUrl, imageAlt } | null` — published agent only; no email/phone.
- `project: { title, slug } | null` — published project only.
- `developerName: localized | null` — published developer only.
- `communityName` already exists.

Do not return unpublished relations. Do not return agent contact fields.

## Public lead create

New unauthenticated mutation (e.g. `publicCatalog.createListingInquiry` or `publicLeads.create`):

- Args: `propertyId`, `name`, `email`, `phone?`, `message?`.
- Load the property. If missing or not `published`, throw a generic failure (do not leak drafts).
- Insert lead: `status: "new"`, `createdAt: now`, `propertyId`. If the listing has `agentId`, set `assignedAgentId` to that agent so admin/agent desks see it. Ignore any client-supplied status or assignee.
- Validate with the existing lead field rules (name required, email format). Trim empties to omitted optionals.
- Do not require Clerk. Catalog visitors are anonymous.

## Copy (EN / AR / TR)

Add catalog (or a `listing` namespace) strings for: breadcrumb, gallery (previous/next, photo n of m), inquire heading/body, field labels, submit, pending, success, error, amenities heading, related heading, agent heading. Sale vs rent only changes breadcrumb + optional rent badge. Voice: Confident Investment Authority — precise, no hype.

## States

| State | Behavior |
|---|---|
| Unpublished / unknown slug | `notFound()` |
| 0 photos | Placeholder, rest of page intact |
| No amenities / pin / relations / agent | Omit that block |
| Form invalid | Inline errors, stay on page |
| Form submit fail | Toast or form-level error; keep values |
| Form success | Confirmation in the inquire column |
| RTL (`ar`) | Same split; inquire column is inline-end; sticky still works |

## Anti-goals

- Do not ship a fake inquiry form that does not write `leads`.
- Do not keep both the new form and the compact maroon closer.
- Do not invent amenities, views, or agent bios.
- Do not add Commercial, List Your Property, or portal CTAs.

## Open decisions closed in this spec

- Map: keep the existing Google embed; not a new provider.
- Agent contact: form only, not agent tel/mailto on this page.
- Related profiles: names (and project slug) only until those public pages exist.
