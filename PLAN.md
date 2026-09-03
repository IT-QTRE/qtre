# QuickTalk Real Estate — Build Plan

Derived from `TECH_STACK.md`. Sequenced as dependency-ordered phases rather than
a 1:1 mapping of doc sections, since SEO and i18n cut across nearly every route.

**Sequencing decisions locked in:**
- `[locale]` route structure is set up structurally in Phase 0 (English content
  first, but the folder shape and middleware exist from day one) to avoid an
  expensive retrofit later.
- Admin dashboard is built before the public website, so real content exists
  before public pages are wired up (public pages can then consume real Convex
  data instead of mocks).

Check off tasks as they're completed. Each phase should be workable as its own
PR/session.

---

## Open Decisions (resolve before/at the noted phase)

These are gaps in `TECH_STACK.md` that weren't specified. Flagging them here so
they get a decision at the right time instead of blocking now.

- [x] ~~**Blog content editor**~~ — resolved at the Phase 4c review: Tiptap WYSIWYG, stored as an HTML string per locale (fits the existing `localizedTextValidator`/`LocalizedText` shape unchanged — no schema migration). See `docs/superpowers/plans/2026-08-11-phase-4c-leads-blog-media-users-settings-audit.md`.
- [x] ~~**Map provider**~~ — resolved 2026-08-20: Google Maps (Places Autocomplete + pin on admin; public embed + Directions on property/project detail when `coordinates` exist). Spec: `docs/superpowers/specs/2026-08-20-property-location-google-map.md`.
- [x] ~~**Lead-form spam protection**~~ — resolved for the general Contact page: it embeds GoHighLevel's own hosted form (script/iframe), so that spam protection is GHL's responsibility, not ours. Property/project inquiry (Convex mutation): **honeypot** is the v1 bar (decided 2026-08-21); shipped with `publicLeads.createListingInquiry` / `createProjectInquiry`. Captcha / IP rate limits stay deferred.
- [x] ~~**Public visitor accounts**~~ — resolved via `docs/superpowers/specs/2026-08-07-roles-and-portals-design.md`: Clerk extends beyond admin-only to Agent and Client portal accounts. No generic buyer favorites/saved-search accounts.
- [ ] **Convex environments** — separate dev/preview/prod Convex deployments mirroring Vercel environments? Confirmed still deferred at the Phase 2 review — single dev deployment/instance is fine until closer to launch (Phase 8).
- [x] ~~**Permission matrix**~~ — resolved: `convex/lib/roles.ts` defines `RESOURCES`/`PERMISSION_MATRIX`/`can()`, encoding the exact per-role capability grid (Super Admin, Admin, Agent, Client) per resource (Properties, Projects, Developers, Agents, Communities, Leads, Property Submissions, Blog, Media Items, Users, Website Settings, Audit Logs). Row-level scoping (e.g. an Agent's own assigned properties) is enforced separately, not by this matrix alone — see `convex/lib/permissions.ts`.
- [x] ~~**Lead storage**~~ — resolved: split by source. The general Contact page uses an embedded GoHighLevel form — no Convex involvement, no internal admin/agent visibility (GHL's own CRM, not ours). Property/project-specific inquiries ("Contact this agent about this listing") go into our own `leads` table via a Convex mutation, since they need real `propertyId`/`projectId`/`agentId` foreign keys to power the admin Leads screen and the Agent Portal's assigned-leads view. See "GoHighLevel" and "Convex data areas" in `TECH_STACK.md`.
- [x] ~~**Communities entity**~~ — resolved via `docs/superpowers/specs/2026-08-08-communities-and-media-model.md`: modeled as a real `communities` table (Admin-editable, country-aware via `countryCode`), with `properties`/`projects` carrying their own `countryCode`/`city` fields so a listing works correctly even before a curated community page exists for its area — this also makes the schema hold up if a second country (e.g. Thailand) is added later, without a breaking migration.
- [x] ~~**Public listing URLs**~~ — resolved 2026-08-17: not a Phase 5 blocker and not a ranking leap for a brokerage catalog. Indexes may be `/properties/for-sale` and `/properties/for-rent` (off-plan stays `/projects`); a listing stays `/properties/{slug}` using the admin `publishing.slug` — stable when status changes to sold/rented (see Phase 6). Do **not** nest details under `for-sale`/`for-rent`, do **not** append a public numeric id, do **not** auto-build keyword-stuffed slugs (H&S/Bayut classifieds pattern). Facets (location, beds, price) stay query params on the index. Dedicated landings like `/properties-for-sale-in-dubai` remain Phase 6, and only with unique copy. Query-param indexes (`?status=sale`) are acceptable until the listing pages are being rebuilt anyway.

---

## Phase 0 — Foundation & Environment

Implemented per `docs/superpowers/plans/2026-08-07-phase-0-foundation.md` (Tasks 1–10).

- [x] Write `.env.example` covering `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOYMENT`, Clerk keys, `BLOB_READ_WRITE_TOKEN`
- [x] Install: `convex @clerk/nextjs react-hook-form zod @hookform/resolvers @tanstack/react-table @vercel/blob next-intl`
- [x] Initialize Convex project (`npx convex dev`) — dev deployment created and connected
- [ ] Confirm dev/prod Convex deployment split — still open, see "Convex environments" in Open Decisions
- [x] Initialize Clerk project, add keys to `.env.local`
- [x] Connect Clerk to Next.js middleware (`clerkMiddleware()` in `proxy.ts`, route protection) — done in Phase 2; `proxy.ts` now composes Clerk + next-intl (portals protected, `[locale]` public, `/api` skipped for locale)
- [x] Create locale config (`i18n/routing.ts`: `routing.locales`, `AppLocale`, `routing.defaultLocale` = `en`, `ar`, `tr`)
- [x] Create `app/[locale]/` route skeleton (layout, page) with `app/robots.ts`, `app/sitemap.ts`, `app/favicon.ico`, `app/icon0.svg`/`icon1.png`/`apple-icon.png`/`manifest.json` kept **outside** `[locale]`
- [x] Add locale middleware/proxy (`proxy.ts`) with the static/metadata-file exclusion matcher (also excludes `admin`, so `/admin` isn't locale-redirected)
- [x] Decide route grouping for `/admin` — confirmed it sits outside `[locale]` as its own route group (`app/admin/...`), with its own `<html>`/`<body>` root layout since it has no other ancestor providing one
- [x] Set up `next-intl` with empty `messages/en.json`, `ar.json`, `tr.json`
- [x] Set `<html lang dir>` logic in the locale layout (`app/[locale]/layout.tsx`)
- [x] Confirm TypeScript strict mode, ESLint config, formatting convention — `tsc --noEmit` and `npm run lint` both pass clean (ESLint config extended to ignore `.cursor/**` and `convex/_generated/**`, which aren't project source); no `.prettierrc` added — not needed yet

## Phase 1 — Data Model (Convex Schema + Shared Validation)

Implemented per `docs/superpowers/plans/2026-08-08-phase-1-data-model.md` (Tasks 1–17). All 13 tables live on the dev deployment; full test suite (`convex/` + `lib/validation/`): 48 tests passing across 21 files; `tsc --noEmit` and `npm run lint` both clean.

- [x] Define Convex tables: `properties`, `projects`, `developers`, `agents`, `leads`, `blogPosts`, `communities`, `mediaItems`, `users`, `auditLogs`, `websiteSettings`, `propertySubmissions` (`leads` is for property/project inquiries only — the general Contact page uses GoHighLevel, not Convex; see `TECH_STACK.md`)
- [x] Model relationships: properties → developer/project/agent/community; projects → developer/community; leads → property/project/assigned agent
- [x] Define `propertySubmissions` table (client-submitted properties pending review) per the roles/portals spec — separate from `leads`
- [x] Model `propertySubmissions` relationships: submission → client (submitter), submission → assigned reviewer (Admin/Agent), submission → converted `properties` record (on approval)
- [x] Update `users`/role enum to `super_admin | admin | agent | client` per the roles/portals spec
- [x] Split shared facts (price, bedrooms, bathrooms, area, `countryCode`) from `LocalizedText` translated fields (title, description, SEO title/description, image alt text, `city`) per the i18n content model — `convex/lib/propertyFacts.ts`'s `propertySharedFactsValidator`
- [x] Embed `SeoFields` and `PublishingFields` (slug, status, publishedAt, updatedAt) on publishable entities (properties, projects, blog posts, communities, developers, agents)
- [x] Define `communities` table (country-aware via `countryCode`, translated `city`/`name`/`description`) and add optional `communityId` back-reference on properties/projects — per `docs/superpowers/specs/2026-08-08-communities-and-media-model.md`
- [x] Define unified `mediaItems` table (`entityType`/`entityId` foreign key + `order`-sorted index) — replaces embedded `MediaItem[]` arrays and the standalone `mediaRecords` idea; backs `propertySubmissions` media the same way (`entityType: "propertySubmission"`, no separate document system) — per the same spec
- [x] Derive `propertySubmissions`' shared fact fields from `propertySharedFactsValidator` via `.fields` spreading rather than duplicating field definitions, so the two schemas can't silently drift apart
- [x] Write the permission matrix (see Open Decisions) and encode it as a Convex helper (`requireRole`/`can()` in `convex/lib/permissions.ts` + `convex/lib/roles.ts`) — derives identity via `ctx.auth.getUserIdentity()` and matches on `identity.tokenIdentifier`; never accepts a `userId`/role as a function argument for authorization
- [x] Write shared Zod schemas mirroring each Convex table for form validation reuse — `lib/validation/*.ts` (one file per table, plus shared `shared.ts`/`propertyShared.ts` building blocks)
- [x] Add an `auditLogs` write helper to be called from sensitive mutations — `convex/lib/auditLog.ts`'s `writeAuditLog`

## Phase 2 — Auth & Authorization

Architecture resolved via `docs/superpowers/specs/2026-08-08-auth-architecture.md`: Clerk's native Convex integration (`convex/auth.config.ts` + `ConvexProviderWithClerk`, no JWT template needed), a shared `app/(portal)/` route group replacing standalone `app/admin/`, `clerkMiddleware()` composed with the existing next-intl middleware for a coarse sign-in gate, and Convex's `users` table as the sole ongoing source of truth for role (no Clerk-metadata mirroring for ongoing checks — metadata is only read once, transiently, at first-login provisioning).

Implemented per `docs/superpowers/plans/2026-08-08-phase-2-auth-authorization.md` (Tasks 1–11), via subagent-driven-development (fresh implementer + independent reviewer per task). Full test suite: 58 tests passing across 25 files; `tsc --noEmit` and `npm run lint` both clean (3 pre-existing benign warnings from Phase 1 test patterns).

- [x] `convex/auth.config.ts` + `CLERK_JWT_ISSUER_DOMAIN` env var; Clerk integration activated in the Clerk Dashboard (manual step — confirmed done by the user, `CLERK_JWT_ISSUER_DOMAIN` present in `.env.local` and no longer erroring in the `npx convex dev` watch output)
- [x] `components/providers/convex-client-provider.tsx`: `ConvexProvider` → `ConvexProviderWithClerk`
- [x] Restructure `app/admin/` into `app/(portal)/admin/`; add `app/(portal)/agent-portal/`, `app/(portal)/client-portal/` (placeholder pages, built out in Phase 4), `app/(portal)/sign-in/`, `app/(portal)/sign-up/` — one shared root layout with `ClerkProvider`
- [x] `proxy.ts`: add `clerkMiddleware()`, protect `/admin`, `/agent-portal`, `/client-portal` (sign-in required); keep next-intl middleware for `[locale]` paths (also excludes `/sign-in`,`/sign-up` from locale-prefixing, found necessary during implementation); `NEXT_PUBLIC_CLERK_SIGN_IN_URL`/`SIGN_UP_URL` set so Clerk's own redirects land on the app's pages, not its hosted Account Portal
- [x] `convex/users.ts`: `current` query, `ensureUserProvisioned` action (reads Clerk `public_metadata.role` via Backend API only on first visit with no existing row — defaults to `client`) + its internal query/mutation
- [x] Each portal's root layout re-derives role from Convex on every request (via `fetchQuery`) and redirects on a role mismatch (cross-role access denied) — this, not middleware, is the real enforcement point
- [x] Client accounts: self-service sign-up via the "List Your Property" flow, auto-provisioned by `ensureUserProvisioned` on first `/client-portal` visit
- [x] Agent accounts: Admin/Super Admin-only Convex action calling Clerk's invitation API (`public_metadata: { role: "agent" }`) — Agent accepts by email invite and sets their own password; the Admin-facing form is Phase 4's "Users & Roles" screen
- [x] Super Admin bootstrap: no self-provisioning path — first Super Admin comes from a normal sign-up (provisions as `client`) manually promoted in the Convex dashboard (mechanism unchanged from Phase 1; nothing further to build)
- [x] Enforce role checks inside Convex queries/mutations (not just hidden UI) using the Phase 1 permission helper (`requireRole`, used by `agentInvitations.ts`; other resources already covered when their mutations are built in later phases)
- [x] Call the audit-log helper from all sensitive admin mutations built so far (`agentInvitations.ts`'s `inviteAgent` — the only sensitive mutation this phase introduces; remaining ones follow the same pattern as they're built in Phase 4)

## Phase 3 — Media & Image Pipeline

Built before the admin CRUD forms that depend on it — Developer/Agent/Project/
Property forms all carry image fields, so the upload widget needs to exist
before those forms are built, not retrofitted in afterward. Full design
record, including a post-implementation security review that hardened this
pipeline, in `docs/superpowers/plans/2026-08-08-phase-3-media-pipeline.md`.

- [x] Vercel Blob upload flow — client-direct upload (`upload()` from `@vercel/blob/client`) via a Route Handler (`app/api/blob/upload/route.ts` using `handleUpload()`), not a Server Action as originally phrased (Server Actions are capped at 4.5MB; a Route Handler is still the required auth-gated exchange point, never a public/unauthenticated endpoint)
- [x] **Two Blob stores, not one** — public (marketing entities) and private (`propertySubmission` documents, served only through an authenticated delivery route, `app/api/blob/private/route.ts`) — a correction to this plan's original single-store phrasing, driven by `propertySubmission` documents being real client-submitted personal documents, not public marketing content
- [x] Store metadata as rows in the `mediaItems` table (Phase 1); file lives in Blob — every pathname namespaced `{entityType}/{entityId}/...` and that binding independently enforced at upload-token time and at `mediaItems.create` (a Critical finding from the post-implementation security review: without this, a caller authorized for their own entity could otherwise substitute another entity's real pathname)
- [x] Upload UI: drag-drop, reordering (writes `order` on `mediaItems`, `@dnd-kit/core`+`@dnd-kit/sortable`), alt-text entry (schema field; not yet exposed as a form input — no admin form exists to host it until Phase 4), delete
- [x] `MediaImage` reusable wrapper (`components/media/media-image.tsx`) — `next/image` for public entities, an authenticated `<img>`/document-link for private entities — for admin previews and public pages
- [x] Basic upload validation (file type, size limits) — per-entity-type via `convex/lib/mediaAccessConfig.ts`'s `MEDIA_ACCESS_CONFIG` (images-only for marketing entities; images+PDF for `propertySubmission`), enforced both client-side (file picker `accept`) and server-side (Route Handler + `create` mutation)
- [x] Confirm Client Portal submission documents (title deed, floor plans, etc.) reuse this same upload pipeline via `mediaItems` (`entityType: "propertySubmission"`) — no separate document system; Client role also granted `mediaItems: delete`, scoped to their own still-`pending` submission (Phase 1's matrix only had `read`+`create`)

## Phase 4 — Admin Dashboard Core

Build CRUD in dependency order — entities other tables reference should exist first.

- [x] Admin shell: sidebar nav, dashboard overview page, layout separate from public site
- [x] Reusable `DataTable` component (TanStack Table + shadcn/ui): sorting, filtering, pagination, column visibility, row selection, bulk actions
- [x] Developers CRUD (RHF + Zod forms)
- [x] Agents CRUD
- [x] Communities CRUD (country-aware: `countryCode`, translated `name`/`city`/`description`)
- [x] Projects CRUD (references Developers/Communities)
- [x] Properties CRUD (references Projects/Developers/Agents/Communities)
- [x] Leads management (list, status, assignment) — property/project inquiries only; the general Contact page's GoHighLevel submissions are not shown here
- [x] Blog CRUD (resolve editor choice from Open Decisions)
- [x] Media library screen (query `mediaItems` without an `entityType`/`entityId` filter — the unified table backs this directly, no separate concept needed)
- [x] Users & Roles management screen
- [x] Website Settings screen
- [x] Audit Logs viewer (read-only, filterable)
- [x] SEO override fields (`SeoFields`) exposed in Property/Project/Blog forms with sensible auto-generated defaults — via the shared `SeoFieldsSection` (`components/forms/seo-fields-section.tsx`), extracted during Phase 4c and used by all publishable-entity forms (Developers/Agents/Communities/Projects/Properties/Blog)
- [ ] Agent Portal: scoped view of assigned Properties/Projects, Leads, and submissions (reuses admin shell/`DataTable`, permission-scoped by `agentId`/`assignedReviewerId`)
- [ ] Client Portal: submission form (property details + document upload) and status view (pending/under review/approved/rejected)
- [ ] Property submission review queue (Admin/Agent): approve (creates `properties` record with `sourceSubmissionId` back-reference) or reject (records `rejectionReason`)

## Phase 5 — Public Website Core Pages

Now backed by real admin-entered Convex data.

Status 2026-08-29: Home, Buy/Rent, property detail, off-plan index + detail, developer/team directories + slugs, blog listing + post detail, contact (GHL embed from settings), About, Services, and Communities are live. Motion pass shipped (gold-line language, not fade-every-section). List Your Property stays open.

- [x] Home — catalog home (`/en`): search, published rails, communities/developers teasers, contact from Website Settings
- [x] Properties listing (+ filters) — `/properties?status=sale` (Buy) and `?status=rent` (Rent); sticky filters, pagination, SEO metadata. Pretty `/properties/for-sale` and `/for-rent` remain optional hygiene (see Open Decisions)
- [x] Property detail — `/properties/{slug}` split folio: gallery, facts, map, related names, published agent; sticky inquire on `lg+`
- [x] Projects listing — `/projects` off-plan catalog: sticky filters (location, starting price, construction status), pagination, SEO metadata. Pretty extra URLs remain optional.
- [x] Project detail — `/projects/{slug}`: mosaic gallery, identity (from-price, construction, location), unit types, payment plan, amenities, map when pinned, developer name link, sticky inquire (`publicLeads.createProjectInquiry`, honeypot)
- [x] Developers listing/profile — `/developers` ceremonial roster (maroon field, logo marquee when marks exist, gold-wipe names); `/developers/{slug}` house plate (name, logo, about, gold-top contact, published projects + properties)
- [x] Agents listing/profile — `/agents` ivory calling-card grid (portrait, published position, firm, email/phone); `/agents/{slug}` desk folio (portrait, about, sticky contact, published assigned listings). Public nav/copy is **Team**; admin stays Agents. URL stays `/agents`. No invented titles/socials.
- [x] Services — `/services` hub leads with QTRE work (sale / rent / off-plan, residence through a purchase, advisory wrap from About). Nine QTB desks live under `/services/visa/{desk}` and `/services/license/{action}`; nav nests Visa / License on hover. Open: whether QTRE files those applications or refers to QuickTalk Business. Source: `SERVICES.md`, `ABOUT.md`.
- [x] Communities listing/detail — `/communities` A–Z directory of published places; `/communities/{slug}` folio (hero, extra photos, about, linked sale/rent/off-plan). Live slug is unique across markets. Home rail still newest published with a photo.
- [x] About — maroon DirectoryHero, founder plate, quote field; from The Group through Commitment: varied beats (stacked group, reversed desk, three-desk columns, pillar list, maroon commitment split). Copy from `ABOUT.md` (QTRE name; no invented address, photo, or unverified scale figures). Public AR/TR voice warmed 2026-08-29.
- [x] Blog listing and post detail — `/blog` chronological index (date, title, cover when published); `/blog/{slug}` sanitized Tiptap body. Public and admin copy is Blog, not Notes.
- [x] Contact page's general inquiry form → embedded GoHighLevel form (script/iframe snippet), not a Convex mutation — no `leads` table involved. Catalog-split page; iframe URL from Website Settings (allowlisted hosts). Email/phone from settings.
- [x] Listing inquiry forms → Convex `publicLeads.createListingInquiry` / `createProjectInquiry` → `leads` (honeypot shipped; listing assigns `properties.agentId`; project inquiry has no agent assignment)
- [ ] "List Your Property" homepage CTA → routes into Client Portal sign-up/submission flow — **blocked**: Client Portal is still a Phase 4 stub; `PRODUCT.md` forbids a fake funnel. Do not ship this CTA until the portal exists
- [x] Motion: gold-line draw on home/directory/services heroes; catalog + search intent mark; listing-rail/grid stagger (readable settle); card hover (image, gold rule, shadow); gallery tile + lightbox; nav gold mark + dropdown timing. Identity-plate word reveal stays the signature. No fade-every-section.
- [x] Map integration on property/project detail pages — Google embed when a pin exists; omitted when it does not
- [x] Server Components by default; Client Components only where interactivity (filters, galleries, forms) is required — standing rule on public pages already built

## Phase 6 — SEO & Metadata

- [ ] Root metadata in `[locale]/layout.tsx`; `generateMetadata` for all dynamic pages (properties, projects, developers, agents, blog)
- [ ] Wire `app/sitemap.ts` to real `getPublishedProperties/Projects/BlogPosts` Convex queries; split via `generateSitemaps()` if the URL count grows large
- [ ] `app/robots.ts` disallowing `/admin/`, Agent Portal and Client Portal routes, `/sign-in/`, `/sign-up/`, `/api/`, `/preview/`
- [ ] JSON-LD structured data: `WebSite`, `Organization`, `RealEstateAgent`, `BreadcrumbList`, `Article` (blog), `VideoObject` (if video content exists)
- [ ] Canonical URL strategy for filtered listing pages; dedicated SEO landing pages (e.g. `/properties-for-sale-in-dubai`, `/communities/dubai-marina`) with real content, not just a listing grid — indexes `/properties/for-sale` and `/for-rent` are the catalog roots, not a substitute for those landings; do not ship thin clones of the grid under extra pretty URLs
- [ ] Sold/rented/unavailable listing handling: keep page, mark unavailable, suggest similar active properties, redirect only to a genuine replacement, `410 Gone` only when permanently removed

## Phase 7 — Internationalization Content Layer

Structure already exists from Phase 0 — this phase is content and correctness.

- [x] Populate `messages/en.json`, `ar.json`, `tr.json` for the public site (nav, catalog, About, Services hub, contact, listing inquire). Admin UI text and a dedicated RTL pass remain.
- [ ] Localized metadata + `alternates.languages` (hreflang) per locale page, self-referencing canonical — canonicals exist on public pages; hreflang does not
- [ ] RTL pass for Arabic: logical CSS properties, directional icons, breadcrumbs, sliders, tables, pagination, animation direction
- [ ] Locale-aware `Intl` formatting for currency, numbers, dates, area
- [ ] Multi-locale sitemap entries — only for published, existing translations. `app/sitemap.ts` is still a stub (home + sale indexes only)
- [x] Language switcher: preserves the current path (and catalog query) across `en` / `ar` / `tr`
- [ ] Prevent indexing of incomplete translations (`noIndex` on missing-locale fallbacks)

## Phase 8 — Polish, QA, and Launch Readiness

- [ ] Accessibility pass (labels, alt text, contrast, keyboard navigation, focus states)
- [ ] Performance pass (image sizes/formats, bundle size, Core Web Vitals dry run)
- [ ] Full RTL + all-locale QA across every major page
- [ ] Security review: confirm every Convex mutation enforces role checks server-side, no secrets outside env vars, no media committed to git
- [ ] Update `README.md` and reconcile `TECH_STACK.md` (dedupe the `Final Technology List` / `SEO Tooling` overlap noted in review)

## Backlog (explicitly deferred per `TECH_STACK.md`)

Implement only when a concrete need arises:

- [ ] Resend (transactional email / lead notifications)
- [ ] Vercel Analytics
- [ ] Vercel Speed Insights
- [ ] Google Analytics 4
- [ ] Google Search Console
- [ ] Cloudinary (only if advanced transformations/DAM become necessary)
- [ ] TanStack Query (only for external/third-party REST data outside Convex)
