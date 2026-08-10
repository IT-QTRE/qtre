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

- [ ] **Blog content editor** — Markdown/MDX field vs. WYSIWYG rich text (e.g. Tiptap)? *(needed by Phase 4)*
- [ ] **Map provider** for property/project location — Google Maps vs Mapbox vs none for v1? *(needed by Phase 5)*
- [x] ~~**Lead-form spam protection**~~ — resolved for the general Contact page: it embeds GoHighLevel's own hosted form (script/iframe), so that spam protection is GHL's responsibility, not ours. Still needed for the property/project inquiry form (which *is* a Convex mutation, unlike Contact) — honeypot and/or rate limiting is the minimum bar; decide at Phase 5.
- [x] ~~**Public visitor accounts**~~ — resolved via `docs/superpowers/specs/2026-08-07-roles-and-portals-design.md`: Clerk extends beyond admin-only to Agent and Client portal accounts. No generic buyer favorites/saved-search accounts.
- [ ] **Convex environments** — separate dev/preview/prod Convex deployments mirroring Vercel environments? Confirmed still deferred at the Phase 2 review — single dev deployment/instance is fine until closer to launch (Phase 8).
- [x] ~~**Permission matrix**~~ — resolved: `convex/lib/roles.ts` defines `RESOURCES`/`PERMISSION_MATRIX`/`can()`, encoding the exact per-role capability grid (Super Admin, Admin, Agent, Client) per resource (Properties, Projects, Developers, Agents, Communities, Leads, Property Submissions, Blog, Media Items, Users, Website Settings, Audit Logs). Row-level scoping (e.g. an Agent's own assigned properties) is enforced separately, not by this matrix alone — see `convex/lib/permissions.ts`.
- [x] ~~**Lead storage**~~ — resolved: split by source. The general Contact page uses an embedded GoHighLevel form — no Convex involvement, no internal admin/agent visibility (GHL's own CRM, not ours). Property/project-specific inquiries ("Contact this agent about this listing") go into our own `leads` table via a Convex mutation, since they need real `propertyId`/`projectId`/`agentId` foreign keys to power the admin Leads screen and the Agent Portal's assigned-leads view. See "GoHighLevel" and "Convex data areas" in `TECH_STACK.md`.
- [x] ~~**Communities entity**~~ — resolved via `docs/superpowers/specs/2026-08-08-communities-and-media-model.md`: modeled as a real `communities` table (Admin-editable, country-aware via `countryCode`), with `properties`/`projects` carrying their own `countryCode`/`city` fields so a listing works correctly even before a curated community page exists for its area — this also makes the schema hold up if a second country (e.g. Thailand) is added later, without a breaking migration.

---

## Phase 0 — Foundation & Environment

Implemented per `docs/superpowers/plans/2026-08-07-phase-0-foundation.md` (Tasks 1–10).

- [x] Write `.env.example` covering `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOYMENT`, Clerk keys, `BLOB_READ_WRITE_TOKEN`
- [x] Install: `convex @clerk/nextjs react-hook-form zod @hookform/resolvers @tanstack/react-table @vercel/blob next-intl`
- [x] Initialize Convex project (`npx convex dev`) — dev deployment created and connected
- [ ] Confirm dev/prod Convex deployment split — still open, see "Convex environments" in Open Decisions
- [x] Initialize Clerk project, add keys to `.env.local`
- [ ] Connect Clerk to Next.js middleware (`clerkMiddleware()` in `proxy.ts`, route protection) — deferred to Phase 2 by design; `proxy.ts` stays locale-detection-only until then
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
before those forms are built, not retrofitted in afterward.

- [ ] Vercel Blob upload flow (client upload via signed token from an authenticated server action — no public upload endpoint)
- [ ] Store metadata as rows in the `mediaItems` table (Phase 1); file lives in Blob
- [ ] Upload UI: drag-drop, reordering (writes `order` on `mediaItems`), alt-text entry, delete
- [ ] `PropertyImage`-style reusable `next/image` wrapper components for admin previews and public pages
- [ ] Basic upload validation (file type, size limits)
- [ ] Confirm Client Portal submission documents (title deed, floor plans, etc.) reuse this same upload pipeline via `mediaItems` (`entityType: "propertySubmission"`) — no separate document system

## Phase 4 — Admin Dashboard Core

Build CRUD in dependency order — entities other tables reference should exist first.

- [ ] Admin shell: sidebar nav, dashboard overview page, layout separate from public site
- [ ] Reusable `DataTable` component (TanStack Table + shadcn/ui): sorting, filtering, pagination, column visibility, row selection, bulk actions
- [ ] Developers CRUD (RHF + Zod forms)
- [ ] Agents CRUD
- [ ] Communities CRUD (country-aware: `countryCode`, translated `name`/`city`/`description`)
- [ ] Projects CRUD (references Developers/Communities)
- [ ] Properties CRUD (references Projects/Developers/Agents/Communities)
- [ ] Leads management (list, status, assignment) — property/project inquiries only; the general Contact page's GoHighLevel submissions are not shown here
- [ ] Blog CRUD (resolve editor choice from Open Decisions)
- [ ] Media library screen (query `mediaItems` without an `entityType`/`entityId` filter — the unified table backs this directly, no separate concept needed)
- [ ] Users & Roles management screen
- [ ] Website Settings screen
- [ ] Audit Logs viewer (read-only, filterable)
- [ ] SEO override fields (`SeoFields`) exposed in Property/Project/Blog forms with sensible auto-generated defaults
- [ ] Agent Portal: scoped view of assigned Properties/Projects, Leads, and submissions (reuses admin shell/`DataTable`, permission-scoped by `agentId`/`assignedReviewerId`)
- [ ] Client Portal: submission form (property details + document upload) and status view (pending/under review/approved/rejected)
- [ ] Property submission review queue (Admin/Agent): approve (creates `properties` record with `sourceSubmissionId` back-reference) or reject (records `rejectionReason`)

## Phase 5 — Public Website Core Pages

Now backed by real admin-entered Convex data.

- [ ] Home
- [ ] Properties listing (+ filters) and Property detail
- [ ] Projects listing and Project detail
- [ ] Developers listing/profile
- [ ] Agents listing/profile
- [ ] Communities listing/detail pages (backed by the `communities` table, filtered by `countryCode` once a second country exists)
- [ ] About
- [ ] Blog listing and post detail
- [ ] Contact page's general inquiry form → embedded GoHighLevel form (script/iframe snippet), not a Convex mutation — no `leads` table involved
- [ ] Property/project detail page inquiry form ("Contact this agent about this listing") → RHF + Zod form → Convex mutation → `leads` table (with `propertyId`/`projectId` and, if the listing has one, a default `assignedAgentId` from `properties.agentId`/`projects`' equivalent)
- [ ] "List Your Property" homepage CTA → routes into Client Portal sign-up/submission flow
- [ ] Motion: hero animation, section entrances, nav transitions, property-card interactions, dialog/gallery transitions (subtle, fast, premium feel)
- [ ] Map integration on property/project detail pages (per Open Decisions)
- [ ] Server Components by default; Client Components only where interactivity (filters, galleries, forms) is required

## Phase 6 — SEO & Metadata

- [ ] Root metadata in `[locale]/layout.tsx`; `generateMetadata` for all dynamic pages (properties, projects, developers, agents, blog)
- [ ] Wire `app/sitemap.ts` to real `getPublishedProperties/Projects/BlogPosts` Convex queries; split via `generateSitemaps()` if the URL count grows large
- [ ] `app/robots.ts` disallowing `/admin/`, Agent Portal and Client Portal routes, `/sign-in/`, `/sign-up/`, `/api/`, `/preview/`
- [ ] JSON-LD structured data: `WebSite`, `Organization`, `RealEstateAgent`, `BreadcrumbList`, `Article` (blog), `VideoObject` (if video content exists)
- [ ] Canonical URL strategy for filtered listing pages; dedicated SEO landing pages (e.g. `/properties-for-sale-in-dubai`, `/communities/dubai-marina`) with real content, not just a listing grid
- [ ] Sold/rented/unavailable listing handling: keep page, mark unavailable, suggest similar active properties, redirect only to a genuine replacement, `410 Gone` only when permanently removed

## Phase 7 — Internationalization Content Layer

Structure already exists from Phase 0 — this phase is content and correctness.

- [ ] Populate `messages/en.json`, `ar.json`, `tr.json` (nav, forms, validation, listing labels, filters, admin text as needed)
- [ ] Localized metadata + `alternates.languages` (hreflang) per locale page, self-referencing canonical
- [ ] RTL pass for Arabic: logical CSS properties, directional icons, breadcrumbs, sliders, tables, pagination, animation direction
- [ ] Locale-aware `Intl` formatting for currency, numbers, dates, area
- [ ] Multi-locale sitemap entries — only for published, existing translations
- [ ] Language switcher: preserve current page if a translation exists, else fall back to locale homepage
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
