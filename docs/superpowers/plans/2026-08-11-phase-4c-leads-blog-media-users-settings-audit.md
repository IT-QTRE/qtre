# Phase 4c — Leads, Blog, Media Library, Users & Roles, Website Settings, Audit Logs

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the remaining `PLAN.md` Phase 4 checklist items — the six admin screens that aren't classic "content entity" CRUD like Developers/Agents/Communities/Projects/Properties (4a/4b). Each one breaks the established full-page-form pattern in a specific way, so this sub-phase documents those deviations explicitly rather than forcing every screen into the same shape. This is sub-phase 4c of Phase 4 (4a: shell + Developers/Agents/Communities; 4b: Projects/Properties; 4c: this doc; remaining Phase 4 items — Agent Portal, Client Portal, submission review queue — are a later sub-phase, informally 4d).

**Architecture decisions (new this sub-phase, resolved via user review before implementation):**

1. **Blog editor: Tiptap WYSIWYG**, not Markdown/MDX. Body is stored as an HTML string per locale (`editor.getHTML()`), which fits the existing `localizedTextValidator`/`localizedTextSchema` shape (`Record<locale, string>`) with zero schema change. Rendering that HTML safely on the public blog page is a Phase 5 concern (sanitize/allow-list at render time) — not touched here since only `admin`/`super_admin` can author posts (matrix), so the write-side XSS surface is already trusted-user-only.
2. **Leads gets a full edit page** (`/admin/leads/[id]`), consistent with every other entity — not an inline/dialog quick-edit — even though only 2 fields (`status`, `assignedAgentId`) are actually mutable. The rest of the inquiry (name/email/phone/message/property/project) renders read-only for context. **No create page** — Leads only ever originate from the public site's inquiry form (a future Phase 5 mutation, unauthenticated, outside the admin permission matrix entirely — not built here).
3. **Leads orphan policy:** deleting a Property/Agent that an existing Lead still references does **not** block the delete (unlike the Developer/Community/Project guards from 4a/4b). The Leads list/edit UI resolves `propertyId`/`projectId`/`assignedAgentId` client-side against each entity's own `list` query into an id→name map, same convention as `developerNameById` etc.; a missing key just renders `"Deleted property"` / `"Deleted agent"` instead of blocking. Blocking here would be overly restrictive for routine listing cleanup.
4. **Audit Logs uses real server-side pagination** (`paginationOptsValidator` + `.paginate()` + `usePaginatedQuery`), not the shared `DataTable`. `DataTable` is explicitly documented (`TECH_STACK.md`) as client-side-`.collect()`, correct only for "tens of rows" — Audit Logs is the first table in this project with genuinely unbounded growth (every sensitive mutation across every resource writes a row here, forever). A new `auditLogs.by_resource` index (`["resource", "createdAt"]`) is added alongside the existing `by_actor`/`by_created_at` so a resource-filtered page is still an index scan, not a full-table filter.
5. **Media Library is a filterable grid/gallery**, not a `DataTable` row list — it has no create/edit form at all (browse + delete only), and a table of bare thumbnails would waste the row-based layout. Also paginated server-side (same unbounded-growth reasoning as Audit Logs — every entity's every photo lives in one table). v1 does **not** resolve `entityId` → a human name inline (would require 6 simultaneous per-entity-type queries); instead each card shows an entity-type badge and links straight to that record's own edit page (`/admin/<entity-type-plural>/<entityId>`) — resolving the specific name is one click away, not pre-fetched for every card.
6. **Blog `authorUserId` is auto-assigned**, never a form field. `create`'s mutation args don't accept `authorUserId` at all — the handler sets it from the authenticated `actor._id` server-side (also safer than trusting a client-supplied id). `update` never touches it, preserving the original author permanently.
7. **Website Settings is a true singleton — no list, no `[id]` route, no delete.** `websiteSettings.get` returns the one row or `null` (nothing has been saved yet); `websiteSettings.upsert` inserts on first save, patches on every save after, setting `updatedAt` itself. The page at `/admin/settings` renders the form directly from `get()`'s result (or empty defaults while `null`) — this is the only admin screen with a fixed URL and no id anywhere in it.
8. **Leads' Agent ownership scoping mirrors Properties' (4b).** The matrix grants `agent` role `["read", "update"]` on `leads`, but (same rationale as `properties.update`'s existing check) an Agent may only update a Lead currently assigned to them: `existing.assignedAgentId === agentProfile._id` (resolved via the same `by_user` index lookup), else `ForbiddenError`. Reassigning a lead *to* themselves when it's currently unassigned/assigned to someone else is out of scope for the agent role (Admin/Super Admin only, matching how only staff triages inbound leads).
9. **Users & Roles: role change is an inline `Select`-per-row, not an edit page.** A user record has exactly one thing an Admin ever changes (`role`) — a full page for a single dropdown would be pure friction. `updateRole` enforces the asymmetric rule already commented in `convex/lib/roles.ts` ("Admin... cannot create/manage other Admin accounts — Super Admin only"): when `actor.role === "admin"`, the mutation throws if the **target's current role** is `admin`/`super_admin` *or* if the **requested new role** is `admin`/`super_admin`. It also blocks changing your own role (avoids an Admin accidentally locking themselves out). The UI disables the `Select` for rows the current actor isn't allowed to touch, but the mutation is the real enforcement point. A role filter (`Select`: All/Super Admin/Admin/Agent/Client) sits above the table so Admin rows aren't buried under Client self-signups.
10. **"Invite Agent" is the one remaining `Dialog`** in this project — a single email input triggering the already-built `agentInvitations.inviteAgent` action, not a data-entity form, so it doesn't need its own route. Every other screen in 4a/4b/4c uses full pages; this is a deliberate, narrow exception for a single-field action trigger.
11. **New shared `SeoFieldsSection` component**, extracted from the SEO-tab block duplicated identically across all five 4a/4b forms (`seo.seoTitle`/`seo.seoDescription`/`seo.canonicalPath`, three `LocalizedTextField`/`Input` fields). Blog and Website Settings become the 6th/7th consumers — past due for extraction. Existing five forms are refactored to use it too, so there's exactly one place this markup lives.
12. **`LocalizedTextField` gets a `richText` variant.** Rather than a parallel component, it grows a `richText?: boolean` prop that swaps the per-locale `Textarea` for a new `components/forms/rich-text-editor.tsx` (Tiptap `useEditor` + `EditorContent`, small fixed toolbar: bold/italic/heading/bullet list/ordered list/link), still one `Tabs`-based en/ar/tr shell, still wired through the same `Controller` + `name` prefix convention every other translated field uses.
13. **Blog cover image reuses the existing generic media pipeline as-is** — `blogPost` is already a registered `MediaEntityType` in `convex/lib/mediaAccessConfig.ts` (public, images-only) from Phase 3, so `MediaPicker`/`MediaUploader entityType="blogPost"` and the `listPrimaryByEntityIds` thumbnail-column query work with zero backend changes. No dedicated `coverImageUrl` field, consistent with how Properties/Projects don't have one either — "first/lowest-`order` media item" is the thumbnail, everywhere.
14. **`leads`/`blogPosts`/`users` list queries stay `.collect()`-based**, matching every existing entity query (`developers.list`, etc.), even though the newer Convex guidelines recommend bounded reads by default. This is a deliberate consistency choice, not an oversight — these three tables grow at admin/staff/content-authoring pace (bounded in practice), unlike Audit Logs and Media Items which grow with every mutation/every photo respectively. Revisit the same way the existing `DataTable` doc already flags for Properties: "correct for low-cardinality tables; revisit if it grows past that."

## Global Constraints

- No agent runs `git add` or `git commit` — ever, for any task. All changes stay uncommitted.
- A `npx convex dev` watch process is already running — check its terminal output for a successful sync after any `convex/` change instead of running `npx convex dev --once`.
- Role is derived server-side via `requireRole`/`getCurrentUser` — never a client-supplied `userId`/role.
- Every sensitive mutation (`create`/`update`/`remove`/`upsert`/`updateRole`) calls `writeAuditLog` after the role/ownership check succeeds.
- Use existing `lib/validation/leads.ts` / `blogPosts.ts` / `websiteSettings.ts` Zod schemas for client-side form validation — do not redefine field shapes. (`users` has no dedicated validation file yet — `updateRole`'s only real input is `role`, validated by the existing `roleValidator`.)
- Icons: `lucide-react` only. Toasts: `sonner`.
- New dependency this sub-phase: `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-link` (Tiptap for the Blog body editor).

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `convex/schema.ts` | Modify | Add `auditLogs.by_resource` index |
| `convex/leads.ts`, `convex/leads.test.ts` | Create | `list`, `get`, `update` (status/assignment only, Agent ownership check), `remove` |
| `convex/blogPosts.ts`, `convex/blogPosts.test.ts` | Create | `list`, `get`, `create` (auto `authorUserId`), `update`, `remove` |
| `convex/websiteSettings.ts`, `convex/websiteSettings.test.ts` | Create | `get`, `upsert` |
| `convex/auditLogs.ts`, `convex/auditLogs.test.ts` | Create | `listPaginated` (optional `resource`/`actorUserId` filter) |
| `convex/users.ts`, `convex/users.test.ts` | Modify | Add `list`, `updateRole` (asymmetric admin-can't-touch-admin guard, no self-change) |
| `convex/mediaItems.ts`, `convex/mediaItems.test.ts` | Modify | Add `listAllPaginated` (optional `entityType` filter, public types only) |
| `components/forms/rich-text-editor.tsx` | Create | Tiptap-backed controlled rich text input |
| `components/forms/localized-text-field.tsx` | Modify | Add `richText` prop |
| `components/forms/seo-fields-section.tsx` | Create | Shared SEO tab block, extracted from the 5 existing forms |
| `components/admin/developers/developer-form.tsx`, `agents/agent-form.tsx`, `communities/community-form.tsx`, `projects/project-form.tsx`, `properties/property-form.tsx` | Modify | Use `SeoFieldsSection` instead of inline SEO markup |
| `components/admin/leads/*` | Create | Columns (with id→name maps + "Deleted X" fallback), edit form (read-only context + Status/Agent Selects), delete action |
| `app/(portal)/admin/leads/page.tsx`, `[id]/page.tsx` | Create | List + Edit pages (no `new/`) |
| `components/admin/blog-posts/*` | Create | Columns (thumbnail + createdAt), unified create/edit form (tabbed Details/SEO, `richText` body, `MediaPicker`/`MediaUploader entityType="blogPost"`) |
| `app/(portal)/admin/blog/page.tsx`, `new/page.tsx`, `[id]/page.tsx` | Create | List + Create + Edit pages |
| `components/admin/settings/website-settings-form.tsx` | Create | Singleton get-or-create form |
| `app/(portal)/admin/settings/page.tsx` | Create | Single settings page (no `[id]`) |
| `components/admin/users/*` | Create | Columns (inline role `Select`, role filter), `invite-agent-dialog.tsx` |
| `app/(portal)/admin/users/page.tsx` | Create | List page (no `[id]`, no `new/`) |
| `components/admin/media/*` | Create | Media card, entity-type filter, delete confirm |
| `app/(portal)/admin/media/page.tsx` | Create | Paginated grid page |
| `components/admin/audit-logs/*` | Create | Read-only paginated table, resource/actor filters |
| `app/(portal)/admin/audit-logs/page.tsx` | Create | Viewer page |
| `components/admin/admin-nav-items.ts` | Modify | Add Leads, Blog, Media, Users & Roles, Website Settings, Audit Logs |
| `app/(portal)/admin/page.tsx` | Modify | Add Leads, Blog count cards (Media/Users/Settings/Audit Logs don't need one — not "entity" counts) |
| `PLAN.md` | Modify | Check off all six remaining Phase 4 items + the SEO-override-fields item |
| `TECH_STACK.md` | Modify | Document Tiptap, singleton-settings, paginated-table, and grid-gallery conventions |

---

### Task 1: Schema + shared component groundwork

Add `auditLogs.by_resource` index to `convex/schema.ts`. Build `components/forms/seo-fields-section.tsx` (extracted verbatim from any existing form's SEO tab) and retrofit the 5 existing forms to use it — pure refactor, no behavior change; run each entity's existing test suite after to confirm no regression. Build `components/forms/rich-text-editor.tsx` and add the `richText` prop to `LocalizedTextField`.

### Task 2: `convex/leads.ts` (TDD)

`list`/`get` require `leads:read`. `update` requires `leads:update`, accepts only `{ id, status, assignedAgentId }`, applies the Agent ownership check (decision 8) before patching, throws if not found. `remove` requires `leads:delete`. No `create` (decision 2 — deferred to Phase 5's public inquiry form, a separate unauthenticated mutation not built in this sub-phase). Audit-log `update`/`remove` under resource `"leads"`.

### Task 3: Leads admin UI

`lead-columns.tsx` (Name/Email, Property/Project — resolved via id→name maps built from `properties.list`/`projects.list`, "Deleted property"/"Deleted project" fallback per decision 3 — Status badge, Assigned Agent name via `agents.list` map, createdAt, Actions: View + Delete). List page. Edit page/form: read-only block (name, email, phone, message, property/project links) + editable Status `Select` + Assigned Agent `OptionalRelationSelect` (reusing the existing pattern from `property-form.tsx`), Save button. No SEO/media/tabs.

### Task 4: `convex/blogPosts.ts` (TDD)

Mirrors `developers.ts`'s shape (global slug uniqueness via `by_publishing_slug`, publishing timestamp lifecycle). `create` args: `title`/`body` (LocalizedText), `seo`, `slug`, `status` — no `authorUserId` arg; handler sets `authorUserId: actor._id` (decision 6). `update` never accepts/changes `authorUserId`. `remove` has no reference guard (nothing references a blog post by id). Audit-log every mutation under resource `"blogPosts"`.

### Task 5: Blog admin UI

`blog-post-columns.tsx` factory (thumbnail via `listPrimaryByEntityIds({ entityType: "blogPost" })`, Title, Status badge, createdAt, Actions). Unified `blog-post-form.tsx` (`{ mode: "create" } | { mode: "edit"; blogPost }`, same convention as the 5 existing entities): Title (`LocalizedTextField`), tabs Details (Body via `LocalizedTextField richText`, slug, status) / SEO (`SeoFieldsSection`); read-only "Posted by {author email}" line in edit mode only (resolved via `users.getById`); `MediaPicker` in create mode, `MediaUploader entityType="blogPost"` in edit mode, staged-upload-on-create lifecycle identical to the 5 existing entities. List, Create, Edit pages.

### Task 6: `convex/websiteSettings.ts` (TDD)

`get` requires `websiteSettings:read`, returns `.first()` or `null`. `upsert` requires `websiteSettings:update`, args mirror `websiteSettingsSchema` (`siteName`, `contactEmail`, `contactPhone`, `socialLinks`, `defaultSeo`); finds existing row via `.first()`, `patch()`s if found else `insert()`s, sets `updatedAt: Date.now()` itself. No `remove`. Audit-log the upsert under resource `"websiteSettings"`.

### Task 7: Website Settings admin UI

`website-settings-form.tsx`: single Client Component, `useQuery(api.websiteSettings.get)` reactively, skeleton while loading, empty defaults if `null`, fields per `websiteSettingsSchema` (`SeoFieldsSection` for `defaultSeo`), one Save button calling `upsert`. Page at `/admin/settings` — no list, no `[id]`.

### Task 8: `convex/auditLogs.ts` (TDD)

`listPaginated` requires `auditLogs:read`. Args: `paginationOpts: paginationOptsValidator`, optional `resource: v.optional(...)` (from `RESOURCES`), optional `actorUserId: v.optional(v.id("users"))`. Picks `by_resource` index when `resource` is set, `by_actor` when `actorUserId` is set (and not `resource`), else `by_created_at`; always `.order("desc")`. v1 supports one filter dimension at a time (documented simplification, decision 4). No mutations.

### Task 9: Audit Logs viewer UI

`app/(portal)/admin/audit-logs/page.tsx`: `usePaginatedQuery(api.auditLogs.listPaginated, { resource, actorUserId }, { initialNumItems: 50 })` + "Load more" button. Resource `Select` (from `RESOURCES`), Actor `Select` (from `users.list`, built in Task 10 — sequence this after Task 10, or inline a minimal actor list query now if easier). Columns: Timestamp (`formatDate` + time), Actor email (resolved via the same id→email map used by Users), Resource, Action, Target ID (plain text), Details. Read-only, no row actions.

### Task 10: `convex/users.ts` additions (TDD)

`list` requires `users:read`, `.collect()` (decision 14). `updateRole` requires `users:update`, args `{ id, role }`: throws if `id === actor._id` (no self-change); if `actor.role === "admin"`, throws if the target's current role or the requested role is `admin`/`super_admin` (decision 9); otherwise patches `role`. Audit-log under resource `"users"`, action `"update_role"`.

### Task 11: Users & Roles admin UI

`user-columns.tsx`: Name/email, Role (inline `Select` bound to `updateRole`, disabled per decision 9's client-side mirror of the server rule), createdAt. Role filter `Select` above the table. `invite-agent-dialog.tsx` (single email `Input`, calls the existing `agentInvitations.inviteAgent` action, toast on success/failure) — the one `Dialog` in this sub-phase (decision 10). Page at `/admin/users` — no `[id]`, no `new/`.

### Task 12: `convex/mediaItems.ts` addition (TDD)

`listAllPaginated`: requires `mediaItems:read`; args `paginationOpts`, optional `entityType` (must be a public type per `MEDIA_ACCESS_CONFIG`, else throw — excludes `propertySubmission`, decision 5); queries with or without the `entityType` prefix of the existing `by_entity` index, `.order("desc")`, `.paginate(...)`.

### Task 13: Media Library UI

`app/(portal)/admin/media/page.tsx`: `usePaginatedQuery(api.mediaItems.listAllPaginated, { entityType }, { initialNumItems: 40 })`, grid of cards (`MediaImage` thumbnail, entity-type badge, "View entity" link to `/admin/<plural>/<entityId>`, Delete with confirm — reuses the existing `getForDelete`/`deleteRecord` Server Action pair from Phase 3). Entity-type filter `Select` above the grid (default "All", excludes `propertySubmission`). "Load more" button.

### Task 14: Wiring + docs

Nav items (Leads, Blog, Media, Users & Roles, Website Settings, Audit Logs — in that order, matching the sidebar's existing top-to-bottom entity ordering), dashboard count cards for Leads/Blog only (decision: Media/Users/Settings/Audit Logs aren't "entity" counts the way the others are), `PLAN.md`, `TECH_STACK.md`.

### Task 15: Verify

`npm run lint; npx tsc --noEmit` and full `vitest` run, all clean.
