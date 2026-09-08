# QuickTalk Real Estate — Technology Stack

## Project Overview

QuickTalk Real Estate is a rebuild and rebrand of the previous QuickTalk Business website.

The new platform will support:

- A public-facing real estate website
- Property and project listings
- Lead and inquiry collection — split by source: Contact form + public chat stay in GoHighLevel; listing/project inquiries go to `leads`; visa/license inquiries from Services go to `serviceLeads` (admin tab, assignable to an Admin user).
- Agent and developer profiles
- Blog and SEO content
- A secure internal admin dashboard
- Media and document management
- Role-based access and audit logging

---

## Core Development Stack

### Cursor IDE

Cursor is the primary code editor used for development.

### Next.js

The application will use:

- Next.js App Router
- React
- TypeScript
- Server Components where appropriate
- Client Components only when interactivity is required
- Route Handlers for HTTP endpoints and integrations
- Next.js Metadata API for SEO

### Vercel Pro

Vercel will be used for:

- Production hosting
- Preview deployments
- GitHub-based deployments
- Environment variable management
- Image optimization
- Analytics
- Speed Insights
- Vercel Blob integration

---

## Frontend

### Tailwind CSS

Tailwind CSS will be used as the main styling system.

### shadcn/ui

shadcn/ui will provide accessible and customizable UI components, including:

- Buttons
- Forms
- Dialogs
- Dropdown menus
- Tabs
- Sheets
- Tables
- Alerts
- Toast notifications
- Dashboard components

### Motion

The `motion` package will be used selectively for:

- Hero animations
- Section entrances
- Navigation transitions
- Property-card interactions
- Dialog and menu animations
- Image-gallery transitions

Animations should remain subtle, fast, and appropriate for a premium real estate brand.

---

## Forms and Validation

### React Hook Form

React Hook Form will manage complex forms such as:

- Property creation and editing
- Project creation and editing
- Agent profiles
- Property/project inquiry ("Contact this agent about this listing") forms — a Convex mutation writes into the `leads` table
- Visa/license inquiry wizard on Services pages — a Convex mutation writes into the `serviceLeads` table
- Website settings

The public Contact page's general form is the one exception — it's an embedded GoHighLevel form (see "GoHighLevel" below), not a React Hook Form + Convex form.

### Zod

Zod will be used for:

- Form validation
- Shared data schemas
- Input validation
- Type-safe parsing
- Validation before Convex mutations

---

## Backend and Database

### Convex

Convex will provide:

- Database storage
- Queries
- Mutations
- Actions
- Reactive data updates
- Scheduled functions
- Backend business logic
- Audit logging
- File and media metadata
- Integration endpoints

Possible Convex data areas include:

- Properties
- Projects
- Developers
- Agents
- Communities (country-aware — see `docs/superpowers/specs/2026-08-08-communities-and-media-model.md`)
- Leads (property/project inquiries only — not the general Contact page, which uses GoHighLevel; see "GoHighLevel" below)
- Service leads (visa/license wizard on Services — not listing inquiries, not GHL)
- Property submissions
- Blog posts
- Website settings
- Media items (unified table, foreign-keyed to any entity — same spec above)
- Users and roles
- Audit logs

---

## GoHighLevel (Contact form + public chat)

GoHighLevel (GHL) is used for the general public Contact **form** and, when
published in Website Settings, the public **chat widget** — nowhere else. The
Contact page embeds an allowlisted form iframe; the catalog layout loads GHL’s
official chat loader with a stored widget ID. Submissions and chat stay in
GoHighLevel. There is no Convex mutation, no `leads` table row, and no
server-side spam handling on our end for these — GHL handles that.

Every other lead-capture point — property inquiries, project inquiries, any
"Contact this agent about this listing" CTA — is **not** GHL. Those go
through our own `leads` table (see "Convex data areas" above) via a Convex
mutation, because they need real `propertyId`/`projectId`/`agentId` foreign
keys to power the admin Leads screen and the Agent Portal's assigned-leads
view — data a generic external form has no way to carry natively.

Visa and license inquiries from the Services wizard are also **not** GHL.
They write to `serviceLeads` and appear under Admin → Service leads. Agents
do not see that inbox.

GHL workflows/automations do support an outbound webhook action that could
also forward Contact-page submissions into Convex later, if we ever want a
single unified inbox across both sources. This is **explicitly deferred**
— see the Backlog in `PLAN.md` — until a concrete need arises.

---

## Authentication and Authorization

### Clerk

Clerk will manage:

- Authentication
- Admin, Agent, and Client sign-in
- User sessions
- User identity
- Account security
- Role and permission metadata

Authorization must also be enforced inside Convex functions. Hiding admin controls in the interface alone is not sufficient.

Roles:

- Super Admin
- Admin
- Agent (has portal access)
- Client (has portal access)

Clerk is not admin-only. Agent and Client accounts authenticate through the
same Clerk instance, scoped by role — see "Roles, Portals, and Property
Submissions" below. (This replaces an earlier 6-role list that included
Property Manager, Content Editor, and Viewer as separate roles; see
`docs/superpowers/specs/2026-08-07-roles-and-portals-design.md`.)

---

## Roles, Portals, and Property Submissions

Full design detail: `docs/superpowers/specs/2026-08-07-roles-and-portals-design.md`

### Role Scope

| Role | Scope |
|---|---|
| Super Admin | Full access to everything. Only role that can create/manage other Admin accounts. |
| Admin | Full access to Properties, Projects, Developers, Agents, Blog, Leads, Media, Settings, Audit Logs. Creates Agent accounts. Assigns property submissions to Agents (or reviews them personally). |
| Agent | Scoped to their own assigned Properties/Projects (edit rights) and leads/submissions assigned to them for review. No access to Users, Settings, Audit Logs, or other agents' records. |
| Client | Scoped to only their own submitted properties. Can create new submissions, upload documents, and view status. No buyer-side browsing/favorites. |

### Agent Portal

An Agent-facing view that reuses the admin dashboard's visual style and
components (`DataTable`, shell layout) rather than a separate design system.
Shows the Agent's own assigned Properties/Projects, property/project
inquiry leads assigned to them, and property submissions assigned to them
for review (with approve/reject actions). Contact-page inquiries are not
shown here — those live in GoHighLevel, not Convex (see "GoHighLevel"
above).

### Client Portal — "List Your Property"

A public-facing "List Your Property" call-to-action leads property owners
into Clerk sign-up/sign-in, then a submission form (property details +
supporting documents such as title deed, floor plan, photos). Submissions
are reviewed by an Admin or assigned Agent before becoming a live
`properties` record. Clients can log back in anytime to check submission
status and submit additional properties later.

Property submissions are modeled as their own `propertySubmissions` table
(see Convex data areas above) — distinct from `leads`, which are
buyer-inquiry-only (property/project inquiries; the general Contact page is
handled separately via GoHighLevel, not Convex — see "GoHighLevel" above).

Both portals live outside `[locale]` (English-only), matching the admin
dashboard's pattern rather than the translated public site.

---

## Data Tables

### TanStack Table

TanStack Table will be used in the admin dashboard for:

- Property tables
- Project tables
- Lead management
- Agent management
- Blog management
- User management
- Audit logs
- Sorting
- Filtering
- Pagination
- Column visibility
- Row selection
- Bulk actions

TanStack Table is headless and will be styled using shadcn/ui and Tailwind CSS.

### TanStack Query

TanStack Query will not be included initially.

Convex already provides:

- Reactive queries
- Client subscriptions
- Query caching
- Mutations
- Live updates
- Loading-state support

TanStack Query may be added later only when there is a clear requirement for managing external REST or third-party API data outside Convex.

### Other TanStack Products

The following are not required:

- TanStack Router
- TanStack Start

Next.js already provides routing, layouts, rendering, navigation, loading boundaries, and error handling.

---

## Media Storage and Image Optimization

*(Implemented in Phase 3 — see `docs/superpowers/plans/2026-08-08-phase-3-media-pipeline.md` for the full design record, including the security review that hardened this pipeline post-implementation.)*

### Two Vercel Blob stores — public and private

Access mode (public/private) is a property of the *store*, not a per-file flag. This app uses **two** stores, chosen per `mediaItems.entityType` via `convex/lib/mediaAccessConfig.ts`'s `MEDIA_ACCESS_CONFIG` (the single source of truth for access mode, allowed content types, and max size per entity type):

- **Public store** (`BLOB_READ_WRITE_TOKEN`) — marketing content served directly via CDN URL, no auth needed to view: `property`, `project`, `developer`, `agent`, `community`, `blogPost`. Images only (jpeg/png/webp/avif).
- **Private store** (`PRIVATE_BLOB_READ_WRITE_TOKEN`) — real client-submitted documents (title deeds, floor plans) on `propertySubmission`: every read goes through an authenticated Route Handler (`app/api/blob/private/route.ts`), so a leaked direct Blob URL alone is useless. Images + PDF.

Every blob's pathname is namespaced `{entityType}/{entityId}/{filename}` (`requiredPathnamePrefix` in `mediaAccessConfig.ts`) and that prefix is independently enforced in three places — the client's `upload()` call, the upload Route Handler's `onBeforeGenerateToken`, and `mediaItems.create` itself — so a caller authorized for their own entity can never smuggle in a pathname belonging to someone else's entity.

Client-direct upload uses `upload()` from `@vercel/blob/client` against `app/api/blob/upload/route.ts` (a Route Handler using `handleUpload()`, not a Server Action — Server Actions are capped at 4.5MB). `onUploadCompleted` is intentionally a no-op (unreliable in local dev without a tunnel); the `mediaItems` row is instead created by the client calling `convex/mediaItems.ts`'s `create` mutation directly right after `upload()` resolves.

`convex/schema.ts`'s actual `mediaItems` table:

```ts
mediaItems: defineTable({
  entityType: mediaEntityTypeValidator, // "property" | "project" | ... | "propertySubmission"
  entityId: v.string(),                 // polymorphic — no single foreign table
  url: v.string(),
  pathname: v.string(),
  alt: v.optional(localizedTextValidator),
  order: v.number(),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
  mimeType: v.string(),
}).index("by_entity", ["entityType", "entityId", "order"]),
```

### Client-side WebP compression before upload

Real-estate photos from phones/DSLRs are often 5–15MB. `lib/media/compressImage.ts` resizes (longest edge capped, see `lib/media/imageDimensions.ts`) and re-encodes to WebP client-side using the native Canvas API (`createImageBitmap` + `canvas.toBlob('image/webp', quality)`) — no new dependency. This cuts upload time and Blob storage cost before the bytes ever leave the browser; falls back to the original file untouched if the browser can't encode WebP or the input isn't an image (PDFs pass through as-is).

### `MediaUploader` — the reusable upload component

`components/media/media-uploader.tsx` is the one component every future admin/portal form mounts for image/document fields (`<MediaUploader entityType entityId />`): drag-and-drop or click-to-upload, drag-to-reorder (`@dnd-kit/core` + `@dnd-kit/sortable`, ~15KB gzip — the standard accessible mouse/touch/keyboard DnD library), and delete. `@dnd-kit`'s `PointerSensor` is configured with an 8px `activationConstraint` distance so ordinary clicks on interactive children (the Remove button, the private-document "View document" link) aren't misread as drag gestures.

`components/media/media-image.tsx` renders public entities via `next/image` against the direct Blob CDN URL (gets Vercel's image optimization) and private entities via a plain `<img>` (or, for non-image mime types like PDF, a document link) against `/api/blob/private?mediaItemId=...` — `next/image`'s own fetcher can't carry the auth needed for the private route.

### Deletion

`lib/actions/media.ts`'s `deleteMediaItem` Server Action: authorization check (`getForDelete`) → delete the Convex row (`deleteRecord`) → delete the Blob object (`del()`). The Convex row is deleted *before* the Blob object (not after) — if the row becomes ineligible for deletion between the two checks, `deleteRecord` throws and the Blob object is never touched; the reverse order risks destroying the Blob object out from under a live, still-referencing Convex row.

### Next.js Image

The Next.js `<Image>` component provides responsive sizes, lazy loading, modern formats, and layout-shift prevention for every public entity's media. `next.config.ts`'s `images.remotePatterns` allows `*.public.blob.vercel-storage.com`.

Cloudinary is not required. It may be considered later if advanced transformations, automated watermarks, smart cropping, or digital asset management become necessary.

---

## Admin Dashboard Shell and CRUD Patterns

*(Implemented in Phase 4a — see `docs/superpowers/plans/2026-08-10-phase-4a-admin-shell-and-first-crud.md` for the full design record. This sub-phase built the shell plus the first three CRUD entities — Developers, Agents, Communities — and every pattern below is reused unchanged by later Phase 4 sub-phases.)*

### Admin shell

`app/(portal)/admin/layout.tsx` renders a fixed desktop sidebar (`components/admin/admin-sidebar.tsx`, `hidden md:flex`) and a mobile header with a `Sheet` drawer (`components/admin/admin-mobile-header.tsx`), both driven by one shared nav list (`components/admin/admin-nav-items.ts`) so the two surfaces can never drift out of sync. Nav only lists screens that actually exist — each later sub-phase appends its own items when it lands, rather than pre-listing "coming soon" dead links. The dashboard overview (`app/(portal)/admin/page.tsx`) shows a welcome header, role badge, and one live count card per top-level entity (`fetchQuery`'d server-side, in parallel via `Promise.all`), each linking to its list screen.

### Reusable `DataTable`

`components/admin/data-table.tsx` wraps TanStack Table for every admin list screen: client-side sorting, a single global-text filter (`filterColumnId` picks which flattened column the filter matches against), pagination, row selection, and an optional `bulkActions` slot rendered only when rows are selected. Client-side only (`.collect()`s the full table) — correct for low-cardinality tables (tens of rows); revisit for Properties if it grows past that. `components/admin/data-table-column-header.tsx` provides the shared sortable-column-header button.

The project is on `@tanstack/react-table` v9 but consumes it through its `/legacy` compatibility import (`useLegacyTable`, `getCoreRowModel`, etc.) to keep the familiar v8-shaped API; `ColumnDef` still requires v9's `TFeatures` generic (satisfied with `StockFeatures`) and the table's `TData` is constrained to `Record<string, unknown>` per `@tanstack/table-core`'s `RowData` requirement.

### Reusable `LocalizedTextField`

`components/forms/localized-text-field.tsx` renders one `Tabs`-based en/ar/tr input (or `Textarea` when `multiline`) per `LocalizedText` field, RTL-aware (`dir="rtl"` on the Arabic tab), wired to React Hook Form via `Controller` and a `name` prefix (`${name}.en` etc.). Every entity form's translated fields (`name`, `description`, `bio`, `city`, `seo.seoTitle`, `seo.seoDescription`, ...) use this one component.

### One full-page form for both Create and Edit

Each entity has a single form component (`developer-form.tsx`, `agent-form.tsx`, `community-form.tsx`, `project-form.tsx`, `property-form.tsx`) that renders every field — including relations and SEO overrides — and takes a `{ mode: "create" } | { mode: "edit"; <entity>: Doc<"...">  }` prop to pick the mutation (`create` vs `update`), the RHF init strategy (`defaultValues` vs the reactive `values`), and the button/toast copy. `create`/`update` mutations always accept the identical argument shape (`update` is just `create`'s args plus `id`; see `convex/*.ts`), so there's no separate "create schema" to keep in sync — the form's Zod schema and default values are shared as-is.

Create was originally a shadcn `Dialog` (fields-only, deferring relations/SEO to Edit) to keep it short, but a modal's fixed max-height doesn't scale: the 2-column "landscape" layout used to shorten it only applies at `md:` and up, so phones saw the tall single-column form anyway, scrolling inside a small nested box — a worse mobile experience than a normal page scroll, and one accidental backdrop tap away from losing typed input. Create is now a full page at `/admin/<entity>/new` (`app/(portal)/admin/<entity>/new/page.tsx`), which removes the height constraint entirely, gets its own URL (so the browser back button and the shared `BackLink` component both just work), and has room to show the same fields Edit does.

`MediaUploader` still only appears in `mode === "edit"` — it needs a real `entityId` that doesn't exist until the record is first saved. `mode === "create"` renders `MediaPicker` instead (`components/media/media-picker.tsx`): files are staged locally as object URLs (no upload yet, no `entityId` needed), and once the `create` mutation returns the new record's real id, the page uploads every staged file in parallel (`Promise.allSettled`) via the shared `uploadMediaFile` helper before redirecting into `/admin/<entity>/[id]`, the same component now rendering in edit mode with the (now-populated) media section visible.

### Server-side publishing timestamps

`create`/`update` mutations (`convex/developers.ts`, `agents.ts`, `communities.ts`) accept only `slug`/`status` for the `publishing` sub-object — never a client-supplied `updatedAt`/`publishedAt`. The handler sets `updatedAt: Date.now()` itself on every write, and sets `publishedAt` exactly once, the first time `status` transitions to `"published"`, preserving the original value on every subsequent update.

### Slug uniqueness, enforced per-mutation

Convex has no unique-index constraint, so `create`/`update` check for a same-slug collision themselves before writing:

- **Developers, Agents** — globally unique, via each table's own `by_publishing_slug` index (excluding `args.id` on update).
- **Communities** — unique **per country**, via the `by_country_and_slug` compound index (`countryCode` + `publishing.slug`), since two communities in different countries may legitimately share a slug.

Each entity file writes its own ~3-line `assertSlugAvailable` helper rather than a shared cross-table utility — Convex's typed index builders don't generalize cleanly across tables with different index shapes.

### Phase 4b additions (Projects, Properties)

*(See `docs/superpowers/plans/2026-08-10-phase-4b-projects-properties-crud.md` for the full design record.)*

**FK pickers use plain shadcn `Select`s.** Developer/Community/Project/Agent relations are populated straight from each entity's own `list` query (e.g. `useQuery(api.developers.list)`) into a `Select` — the same widget already used for `status`. No combobox/search component; revisit only if a list grows long enough to need one. Optional relations render an empty-string `value` when unset and translate `""` back to `undefined` at the submit boundary (see `OptionalRelationSelect` in `property-form.tsx`).

**Referential-integrity delete guards.** `remove` mutations that could orphan a foreign key now check for referencing rows first and throw if any exist, surfaced to the admin via `toast.error`:

- `developers.remove` / `communities.remove` — block if any `projects`/`properties` row references them (`by_developer`/`by_community` indexes).
- `projects.remove` — blocks if any `properties` row references it (`by_project` index).
- `properties.remove` — no guard; nothing in the schema references a `properties` row by id.

**Agent row-level ownership scoping on `properties.update`.** The permission matrix (`convex/lib/roles.ts`) grants the `agent` role `update` on `properties`, but scoping to *their own* assigned property is enforced in the mutation, not the matrix (per that file's own comment). Since `properties.agentId` points at an `agents` row (not a `users` row), the check resolves the caller's own `agents` row via the `by_user` index before comparing:

```ts
if (actor.role === "agent") {
  const agentProfile = await ctx.db
    .query("agents")
    .withIndex("by_user", (q) => q.eq("userId", actor._id))
    .unique();
  if (!agentProfile || existing.agentId !== agentProfile._id) {
    throw new ForbiddenError("Agents can only update their own assigned properties");
  }
}
```

`projects.update` has no equivalent check — `projects` has no `agentId` field to scope by — so it stays role-gated only; a deliberate asymmetry, not an oversight.

**Numeric and nested-optional form fields stay as plain strings.** `z.preprocess()`/`.transform()` on a field inside a `zodResolver`-validated schema broke React Hook Form's `Resolver` generic (`TS2719: Two different types with this name exist, but they are unrelated` — hit while building `project-edit-form.tsx`). The fix used everywhere numeric or nested-object values need a text input (price, bedrooms, coordinates lat/lng, starting price) is to type the field as a plain `z.string().optional()`, bind it with a normal `<Input type="number">` + `form.register(...)` (no `valueAsNumber`), and convert to the real `number`/`{ lat, lng }` shape by hand in `onSubmit` before calling the mutation. Comma-separated lists (`amenities`) follow the same pattern: a `z.string().optional()` "amenitiesText" field, split into `string[]` on submit and `.join(", ")`'d back in `toFormValues`.

**`FieldHint` for form UX.** `components/forms/field-hint.tsx` is a one-line styled `<p>` dropped in under any `Input`/`Select`/`Controller`, in the same slot the destructive-red error message uses (hint renders above the error when both are present, so an error is never visually buried under static help text). `LocalizedTextField` takes an optional `hint` prop for the same purpose on translated fields, rendered once under the tab group (not per-locale). Applied to every field across Developers/Agents/Communities/Projects/Properties whose format, constraints, or blank-value behavior isn't self-evident (slug, country code, coordinates, amenities, SEO fallback behavior, optional contact fields, publishing status).

**Properties' and Projects' forms are tabbed** (`components/ui/tabs.tsx`: Details / Relations / SEO) — both have meaningfully more fields than Developers/Agents/Communities, in both Create and Edit now that each shares one component. Developers/Agents/Communities stay untabbed (few enough fields that tabs would just add clicks). `MediaUploader` stays outside/below the tabs, matching every other entity's "media always visible below the form" convention (and only rendered in edit mode, per above).

**Amenities are clickable pills, not free text.** `components/forms/amenity-picker.tsx` renders a curated list (`lib/constants/amenities.ts`) as toggleable pills bound to a plain `string[]` form field (`z.array(z.string()).optional()`), used by both Projects and Properties. Any value already on the field that isn't in the curated list (typed before this picker existed) still renders as a selected pill via an "Other amenity…" input, so nothing already stored is silently dropped. This replaced an earlier free-text `"Pool, Gym, Parking"` comma-list field — inconsistent capitalization/wording in free text would have made a future public-site amenity filter unreliable.

**Bedrooms/Bathrooms (Properties) are `Select`s over a small fixed range** (Studio–6+ / 1–5+), not free numeric entry — the real-world range is small enough that a dropdown beats typos, unlike Price/Area which stay numeric since they're genuinely continuous.

**No Latitude/Longitude fields on Projects or Properties.** Both `coordinates` fields were removed from the form (though the field remains in the schema) — there's no map picker yet and a bare lat/lng text-pair wasn't pulling its weight. Saving a record without them leaves any existing `coordinates` value untouched (the field is omitted from the mutation payload entirely, never sent as an explicit `undefined`, which Convex's `patch()` would otherwise treat as clearing it).

### Phase 4c additions (Leads, Blog, Media Library, Users & Roles, Website Settings, Audit Logs)

*(See `docs/superpowers/plans/2026-08-11-phase-4c-leads-blog-media-users-settings-audit.md` for the full design record.)*

**Shared `SeoFieldsSection`.** The identical SEO-tab markup (`seo.seoTitle`/`seo.seoDescription`/`seo.canonicalPath`, three `LocalizedTextField`/`Input` fields) duplicated across all five Phase 4a/4b forms is now `components/forms/seo-fields-section.tsx`, a single reusable component. Blog and Website Settings are its 6th/7th consumers; the five existing forms were refactored to use it too, so there is exactly one place this markup lives.

**`LocalizedTextField` gets a `richText` variant.** Rather than a parallel component, `components/forms/localized-text-field.tsx` grew a `richText?: boolean` prop that swaps the per-locale `Textarea` for `components/forms/rich-text-editor.tsx` (Tiptap `useEditor`/`EditorContent`, a small fixed toolbar — bold/italic/heading 2/heading 3/bullet list/ordered list/link) — still one `Tabs`-based en/ar/tr shell, still wired through the same `Controller` + `name` prefix convention every other translated field uses. Body content is stored as an HTML string per locale (`editor.getHTML()`), fitting the existing `localizedTextValidator`/`LocalizedText` shape unchanged — no schema migration. Sanitizing that HTML for public rendering is a Phase 5 concern; the write side is trusted-user-only (only `admin`/`super_admin` can author Blog posts).

**Leads** (`convex/leads.ts`, `/admin/leads`): `list`/`get`/`update`/`remove`, no `create` (leads only ever originate from a future Phase 5 public inquiry mutation). `update` is the only mutable surface (`status`, `assignedAgentId`); an Agent may only update a lead currently assigned to them (`existing.assignedAgentId === agentProfile._id`, resolved via the `by_user` index, same pattern as `properties.update`'s Agent scoping from 4b). Deleting a referenced Property/Agent does not block — the Leads list/edit UI resolves `propertyId`/`projectId`/`assignedAgentId` into an id→name map client-side and falls back to `"Deleted property"`/`"Deleted agent"` instead of blocking, unlike the Developer/Community/Project referential-integrity guards from 4a/4b.

**Blog** (`convex/blogPosts.ts`, `/admin/blog`): `authorUserId` is auto-assigned server-side from the authenticated actor at `create` time — never a client-supplied field, and `update` never touches it, so the original author is permanent. Body uses the `richText` `LocalizedTextField` variant above. Cover image reuses the existing generic media pipeline as-is (`blogPost` was already a registered public `MediaEntityType` from Phase 3) — no dedicated `coverImageUrl` field; the lowest-`order` media item is the thumbnail everywhere, same as Properties/Projects.

**Website Settings** (`convex/websiteSettings.ts`, `/admin/settings`): a true singleton — `get` returns the one row or `null`, `upsert` inserts on first save and patches on every save after, setting `updatedAt` itself. No list, no `[id]` route, no delete — the only admin screen with a fixed URL and no id anywhere in it.

**Audit Logs** (`convex/auditLogs.ts`, `/admin/audit-logs`): the first genuinely unbounded table in this project (every sensitive mutation across every resource writes a row here, forever), so it's the first list screen to use real server-side pagination (`paginationOptsValidator` + `.paginate()` + `usePaginatedQuery`) instead of the shared `DataTable`. A new `by_resource` index (`["resource", "createdAt"]`) sits alongside the existing `by_actor`/`by_created_at` so a resource-filtered page is still an index scan. `listPaginated`'s index selection is strict: an explicit `resource` filter wins over `actorUserId` if both are somehow passed — v1 only supports filtering by one dimension at a time, and the admin UI mirrors that by clearing whichever filter isn't active whenever the other one is set.

**Users & Roles** (`convex/users.ts`, `/admin/users`): role change is an inline per-row `Select` bound to `updateRole`, not an edit page. `updateRole` blocks changing your own role unconditionally (any role, including Super Admin), and additionally blocks an `admin` actor from touching any row whose current OR requested role is `admin`/`super_admin` (the existing "Admin cannot manage other Admin accounts" rule from `convex/lib/roles.ts`, now enforced in code). The UI mirrors this rule client-side (disabling the `Select` entirely on unreachable rows, narrowing an Admin's own selectable options to just Agent/Client) purely for UX — `updateRole` itself is the real enforcement point regardless of what the client renders. "Invite Agent" is the one remaining shadcn `Dialog` in the whole admin dashboard — a single email input triggering the already-built `agentInvitations.inviteAgent` action; every other 4a/4b/4c screen uses a full page instead.

**Media Library** (`convex/mediaItems.ts`'s `listAllPaginated`, `/admin/media`): a filterable grid/gallery, not a `DataTable` row list — browse + delete only, no create/edit form. Also server-side paginated (same unbounded-growth reasoning as Audit Logs — every entity's every photo lives in one table). Cards show an entity-type badge and a "View entity" link straight to that record's own admin edit page rather than pre-resolving `entityId` to a human name inline (would need 6 simultaneous per-entity-type queries for every card). Security note: `mediaItems: read` is granted to every role (Agent, Client too — they need it for their own per-entity upload/delete flows), so `listAllPaginated` independently guarantees `propertySubmission` (the one private-access `MediaEntityType`) rows are never returned under any argument — not just when explicitly requested (throws), but also filtered out of the unscoped "browse everything" case — since this bulk endpoint has no per-row ownership check the way `listByEntity`/`getForDelete` do.

---

## Email and Notifications (NOT TO BE IMPLEMENTED FOR NOW)

### Resend (NOT TO BE IMPLEMENTED FOR NOW)

Resend may be used for:

- Contact-form submissions
- Lead notifications
- Inquiry confirmations
- Admin alerts
- Agent notifications
- Transactional emails

Email sending should normally be performed through secure backend functions rather than directly from the browser.

---

## Analytics, SEO, and Monitoring (NOT TO BE IMPLEMENTED FOR NOW)

### Vercel Analytics (NOT TO BE IMPLEMENTED FOR NOW)

Used for privacy-focused traffic and page-view analytics.

### Vercel Speed Insights (NOT TO BE IMPLEMENTED FOR NOW)

Used to monitor real-world website performance and Core Web Vitals.

### Google Analytics 4 (NOT TO BE IMPLEMENTED FOR NOW)

Used for:

- Marketing analytics
- Conversion tracking
- Campaign measurement
- Lead-form events
- Property interaction events

### Google Search Console (NOT TO BE IMPLEMENTED FOR NOW)

Used for:

- Search performance
- Page indexing
- Sitemap submission
- Search queries
- Crawl issues
- Core Web Vitals reports

---

## Recommended Architecture

```text
Next.js Application
├── Public Website
│   ├── Home
│   ├── Properties
│   ├── Property Details
│   ├── Projects
│   ├── Project Details
│   ├── Developers
│   ├── Agents
│   ├── About
│   ├── Blog
│   ├── Contact
│   └── List Your Property (Client Portal entry point)
│
├── Admin Dashboard
│   ├── Dashboard Overview
│   ├── Properties
│   ├── Projects
│   ├── Developers
│   ├── Agents
│   ├── Leads (property/project inquiries)
│   ├── Blog
│   ├── Media
│   ├── Users and Roles
│   ├── Website Settings
│   └── Audit Logs
│
├── Agent Portal
│   ├── Assigned Properties/Projects
│   ├── Assigned Leads
│   └── Assigned Submissions (review)
│
├── Client Portal
│   ├── Submit Property
│   └── Submission Status
│
├── Clerk
│   ├── Authentication
│   ├── Sessions
│   └── User Identity
│
├── Convex
│   ├── Database
│   ├── Queries
│   ├── Mutations
│   ├── Actions
│   ├── Scheduled Functions
│   └── Authorization
│
├── GoHighLevel (form iframe + optional chat widget, external — not Convex leads)
│   └── Lead capture + CRM (Contact page general inquiries)
│
└── Vercel
    ├── Hosting
    ├── Deployments
    ├── Blob Storage
    ├── Image Optimization
    ├── Analytics
    └── Speed Insights
```

---

## SEO and Metadata Architecture

SEO is a core application feature and should be implemented from the beginning of the rebuild.

### Next.js Metadata API

The project will use the built-in Next.js Metadata API for:

- Default site metadata
- Page-specific titles and descriptions
- Canonical URLs
- Open Graph metadata
- Twitter/X card metadata
- Robots directives
- Dynamic metadata for properties, projects, communities, developers, and blog posts

Shared metadata should be defined in the root layout, while dynamic pages should use `generateMetadata`.

Recommended environment variable:

```env
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

Example root metadata:

```tsx
import type { Metadata } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://your-production-domain.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "QuickTalk Real Estate | Dubai Properties",
    template: "%s | QuickTalk Real Estate",
  },

  description:
    "Explore properties for sale and rent, off-plan developments, and real estate investment opportunities in Dubai.",

  applicationName: "QuickTalk Real Estate",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "en_AE",
    url: siteUrl,
    siteName: "QuickTalk Real Estate",
    title: "QuickTalk Real Estate | Dubai Properties",
    description:
      "Explore properties for sale and rent, off-plan developments, and real estate investment opportunities in Dubai.",
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt: "QuickTalk Real Estate",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "QuickTalk Real Estate | Dubai Properties",
    description:
      "Explore properties for sale and rent, off-plan developments, and real estate investment opportunities in Dubai.",
    images: ["/opengraph-image.jpg"],
  },

  robots: {
    index: true,
    follow: true,
  },
};
```

### Dynamic Metadata

Dynamic pages should generate unique metadata from published Convex records.

Applicable page types include:

- Properties
- Projects
- Communities
- Developers
- Agents
- Blog posts

Suggested SEO fields in Convex:

```ts
type SeoFields = {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  ogImageUrl?: string;
};
```

Suggested publishing fields:

```ts
type PublishingFields = {
  slug: string;
  title: string;
  summary: string;
  status: "draft" | "published" | "archived";
  publishedAt?: number;
  updatedAt?: number;
};
```

The admin dashboard should allow manual SEO overrides while automatically generating sensible defaults.

### Sitemap

The project will use the standard Next.js App Router sitemap convention:

```text
app/sitemap.ts
```

This is a built-in Next.js file convention. Next.js converts the returned data into XML and serves it automatically at:

```text
/sitemap.xml
```

Standard Next.js structure:

```tsx
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://example.com",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
```

The following functions are project-specific placeholders and must later be connected to actual Convex queries:

```ts
getPublishedProperties();
getPublishedProjects();
getPublishedBlogPosts();
```

Only published, canonical, indexable URLs should be included in the sitemap.

Example project implementation:

```tsx
import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://your-production-domain.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await getPublishedProperties();
  const projects = await getPublishedProjects();
  const posts = await getPublishedBlogPosts();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/properties`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const propertyPages: MetadataRoute.Sitemap = properties.map((property) => ({
    url: `${siteUrl}/properties/${property.slug}`,
    lastModified: new Date(property.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const projectPages: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${siteUrl}/projects/${project.slug}`,
    lastModified: new Date(project.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...propertyPages,
    ...projectPages,
    ...blogPages,
  ];
}
```

For a small or medium website, a single `app/sitemap.ts` file is sufficient. If the platform later contains a very large number of URLs, use Next.js `generateSitemaps()` to divide them into multiple sitemap files.

### Robots File

The project will use the standard Next.js robots convention:

```text
app/robots.ts
```

Next.js will automatically serve it as:

```text
/robots.txt
```

Example:

```tsx
import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://your-production-domain.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/sign-in/",
        "/sign-up/",
        "/api/",
        "/preview/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
```

Private pages must still require authentication. `robots.txt` is not a security mechanism.

### Structured Data

The project should add JSON-LD where accurate and relevant.

Recommended schema types include:

- `WebSite`
- `Organization`
- `RealEstateAgent`
- `BreadcrumbList`
- `Article`
- `VideoObject`

Structured data must describe content that is visibly present on the page.

### Canonical URLs and Filters

Filtered property URLs can create duplicate or thin pages, such as:

```text
/properties?bedrooms=2
/properties?location=dubai-marina
/properties?sort=price-low
```

Not every filter combination should be indexable.

The project should:

- Use canonical URLs
- Index only valuable landing pages
- Avoid creating thousands of thin filter pages
- Create dedicated SEO landing pages for important searches

Examples:

```text
/properties-for-sale-in-dubai
/properties-for-rent-in-dubai
/off-plan-properties-in-dubai
/communities/dubai-marina
/communities/downtown-dubai
/developers/emaar
/property-type/villas
/property-type/apartments
```

These pages should contain useful original content in addition to listing grids.

### Sold, Rented, and Unavailable Listings

Unavailable property pages should not always be deleted immediately.

Preferred approach:

- Keep useful pages accessible
- Clearly mark the listing as sold, rented, or unavailable
- Recommend similar active properties
- Remove invalid inquiry actions
- Redirect only to a genuinely equivalent replacement
- Use `410 Gone` only when a page is permanently removed with no suitable replacement

### Metadata File Structure

Recommended Next.js structure:

```text
app/
├── layout.tsx
├── robots.ts
├── sitemap.ts
├── manifest.ts
├── icon.png
├── apple-icon.png
├── opengraph-image.jpg
├── properties/
│   ├── page.tsx
│   └── [slug]/
│       ├── page.tsx
│       └── opengraph-image.tsx
├── projects/
│   └── [slug]/
│       └── page.tsx
├── communities/
│   └── [slug]/
│       └── page.tsx
└── blog/
    └── [slug]/
        └── page.tsx
```

### SEO Tooling

The SEO stack includes:

- Next.js Metadata API
- `generateMetadata`
- `app/sitemap.ts`
- `app/robots.ts`
- Canonical URLs
- Open Graph metadata
- Twitter/X card metadata
- JSON-LD structured data
- Google Search Console
- Next.js Metadata API
- Dynamic `generateMetadata`
- Structured Data / JSON-LD
- Dynamic Sitemap
- Robots configuration
- Canonical URL management
- Multi-locale routing
- Locale-aware metadata and hreflang
- Arabic RTL support
- Locale-aware formatting
- Google Analytics 4
- Vercel Analytics
- Vercel Speed Insights

A separate SEO package is not required initially.


---

## Internationalization and Multi-Locale Architecture

The website will support multiple locales, beginning with:

- English (`en`)
- Arabic (`ar`)
- Turkish (`tr`)

Additional locales may be added later.

### Recommended Route Structure

```text
app/
├── favicon.ico
├── icon.png
├── apple-icon.png
├── globals.css
├── layout.tsx
├── robots.ts
├── sitemap.ts
└── [locale]/
    ├── layout.tsx
    ├── page.tsx
    ├── properties/
    ├── projects/
    ├── communities/
    ├── developers/
    ├── blog/
    └── contact/
```

Global files such as the favicon, robots file, sitemap, and application icons must remain outside the `[locale]` folder.

### Locale Configuration

```ts
export const locales = ["en", "ar", "tr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
```

Reuse this configuration for routing, metadata, sitemap generation, language switching, translation loading, and validation.

### Translation System

Use one translation system consistently. A suitable option is `next-intl`.

```text
messages/
├── en.json
├── ar.json
└── tr.json
```

Translations should cover navigation, forms, validation messages, listing labels, filters, admin text, metadata, and relevant email templates.

### Locale Middleware or Proxy

Locale routing must exclude static and metadata files.

```ts
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|robots.txt|sitemap.xml|manifest.webmanifest|.*\\..*).*)",
  ],
};
```

The favicon must remain available at:

```text
/favicon.ico
```

It must not redirect to `/en/favicon.ico` or another locale-specific path.

### Locale Layout

The locale layout should set language and direction:

```tsx
<html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
```

Arabic support requires full RTL testing, not only translated text.

### Localized Metadata

Each locale should have localized titles, descriptions, Open Graph content, canonicals, and alternate-language URLs.

```tsx
alternates: {
  canonical: `/${locale}`,
  languages: {
    en: "/en",
    ar: "/ar",
    tr: "/tr",
    "x-default": "/en",
  },
}
```

Each locale page should normally use a self-referencing canonical and reference all available translations.

### Multi-Locale Sitemap

The sitemap should include every published canonical locale URL.

Only include translations that actually exist and are published. Do not create sitemap entries for incomplete translations.

### Convex Content Model

Keep shared property facts separate from translated marketing content.

Shared facts:

- Price
- Bedrooms
- Bathrooms
- Area
- Coordinates
- Status
- Amenities
- Country code (ISO 3166-1 alpha-2 — e.g. `AE`, `TH`)

Translated content:

- Title
- Description
- SEO title
- SEO description
- Image alternative text
- City / community display name (e.g. "Dubai" / "دبي")

Example:

```ts
type LocalizedText = {
  en: string;
  ar?: string;
  tr?: string;
};
```

Images are not embedded on the entity itself — each image is a row in the
unified `mediaItems` table, foreign-keyed to its entity (`entityType` +
`entityId`) and ordered via an index, per
`docs/superpowers/specs/2026-08-08-communities-and-media-model.md`. This
avoids the unbounded-array-on-a-document problem (1MB document limit,
full-document rewrite on every reorder) that embedding a `MediaItem[]` field
directly would cause.

### Language Switcher

The language switcher should preserve the current page when a translation exists and fall back to the locale homepage when it does not.

### RTL Requirements

Use logical CSS properties where possible:

```css
margin-inline-start
margin-inline-end
padding-inline-start
padding-inline-end
inset-inline-start
inset-inline-end
```

Review directional icons, breadcrumbs, sliders, forms, tables, pagination, cards, and animation direction.

### Locale-Aware Formatting

Use the JavaScript `Intl` API for currency, numbers, dates, time, area measurements, and pluralization.

```ts
new Intl.NumberFormat(locale, {
  style: "currency",
  currency: "AED",
  maximumFractionDigits: 0,
}).format(price);
```

### Internationalization Checklist

- Keep `app/favicon.ico` outside `[locale]`
- Exclude static and metadata files from locale middleware
- Define locales centrally
- Add localized metadata
- Add canonical and alternate-language URLs
- Include locale URLs in the sitemap
- Support RTL for Arabic
- Use locale-aware formatting
- Translate validation and interface messages
- Prevent indexing of incomplete translations
- Test all major pages in every locale


---

## Final Technology List

- Cursor IDE
- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Motion
- React Hook Form
- Zod
- TanStack Table
- Convex
- Clerk
- Vercel Pro
- Vercel Blob
- Next.js Image
- Resend (NOT TO BE IMPLEMENTED FOR NOW)
- Vercel Analytics (NOT TO BE IMPLEMENTED FOR NOW)
- Vercel Speed Insights (NOT TO BE IMPLEMENTED FOR NOW)
- Google Analytics 4 (NOT TO BE IMPLEMENTED FOR NOW)
- Google Search Console (NOT TO BE IMPLEMENTED FOR NOW)
- Next.js Metadata API 
- Dynamic `generateMetadata`
- Structured Data / JSON-LD
- Dynamic Sitemap
- Robots configuration
- Canonical URL management
- Multi-locale routing
- Locale-aware metadata and hreflang
- Arabic RTL support
- Locale-aware formatting

---

## Initial Package Guidance

Packages should be installed only when they are needed.

Suggested packages include:

```bash
npm install convex @clerk/nextjs
npm install react-hook-form zod @hookform/resolvers
npm install @tanstack/react-table
npm install motion (DONE)
npm install @vercel/blob
```

shadcn/ui components should be added individually rather than installing unnecessary components in advance.

---

## Development Principles

- Use TypeScript strict mode.
- Keep public and admin layouts separated.
- Enforce permissions in Convex backend functions.
- Validate all important inputs.
- Store secrets only in environment variables.
- Do not store uploaded media directly in GitHub.
- Use Server Components by default.
- Keep Client Components small and purposeful.
- Optimize images and provide meaningful alternative text.
- Use reusable schemas and shared types.
- Record sensitive admin actions in audit logs.
- Avoid unnecessary dependencies.
- Prioritize accessibility, SEO, security, and performance.
