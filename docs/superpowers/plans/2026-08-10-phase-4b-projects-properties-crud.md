# Phase 4b — Projects CRUD + Properties CRUD

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Projects and Properties CRUD screens in the admin dashboard — the two entities that reference the Phase 4a trio (Developers/Agents/Communities) and each other. This is sub-phase 4b of 4 — see `c:\Users\TUF F16\.cursor\plans\phase_4_sub-phase_roadmap_32646a22.plan.md` for the full Phase 4 roadmap (4a: shell + Developers/Agents/Communities, done; 4c: Leads/Blog/Media library/Users/Settings/Audit logs; 4d: the two portals + submission review).

**Architecture decisions (new this sub-phase, beyond what 4a already established):**

1. **FK pickers use plain shadcn `Select`s**, populated from each related entity's own `list` query (Developer/Community/Project/Agent) — the same widget already used for `status`. No new combobox/search component; revisit only if a list grows long enough to need it.
2. **Referential-integrity delete guards.** Properties/Projects reference Developers, Communities, and (for Properties) Projects and Agents via optional foreign keys. Deleting a still-referenced record is now blocked with a thrown error, rather than left to go stale:
   - `projects.remove` blocks if any `properties.projectId` points to it.
   - `developers.remove` blocks if any `projects.developerId` or `properties.developerId` points to it.
   - `communities.remove` blocks if any `projects.communityId` or `properties.communityId` points to it.
   - `properties.remove` has no guard — nothing in the current schema references a `properties` row by id.
3. **Agent row-level ownership scoping on `properties.update`.** `convex/lib/roles.ts` already grants the `agent` role `"update"` on `properties`, with a comment noting row-level scoping ("an Agent editing only their own assigned properties") is expected to be enforced in Phase 4's mutations, not by the permission matrix alone. This sub-phase adds that check: when the caller's role is `agent`, `properties.update` requires `existing.agentId === actor._id`, throwing `ForbiddenError` otherwise. `projects.update` has no analogous ownership field (no `agentId` on `projects`) and stays role-gated only — a deliberate asymmetry, not an oversight.
4. **`FieldHint` component for form UX.** A new `components/forms/field-hint.tsx` (a styled `<p>`) plus an optional `hint` prop on `LocalizedTextField`, used to add short helper text under fields whose format/behavior isn't self-evident (slug, country code, coordinates, amenities, SEO fallback behavior, etc.). Applied to the new Projects/Properties forms **and** retrofitted onto the already-shipped Developer/Agent/Community forms.
5. **Properties' Edit form is tabbed** (`Details` / `Relations` / `SEO`) — the first tabbed entity form in this project, because Properties has meaningfully more fields than any 4a entity. Media stays outside/below the tabs, consistent with every other entity's "media always visible below the form" convention. Projects' edit form stays single-scroll (fewer fields, doesn't need it).
6. **Create dialogs stay minimal.** Properties' create dialog is fields-only and *not* tabbed — relations (developer/community/project/agent), SEO, and media are all deferred to the Edit page, same as every 4a entity's "Create is fields-only" convention.
7. **Map integration is out of scope** (Phase 5, per `PLAN.md`). `coordinates` is exposed as two plain number inputs (lat/lng), optional.

## Global Constraints

- No agent runs `git add` or `git commit` — ever, for any task. All changes stay uncommitted.
- A `npx convex dev` watch process is already running — check its terminal output for a successful sync after any `convex/` change instead of running `npx convex dev --once`.
- Role is derived server-side via `requireRole`/`getCurrentUser` — never a client-supplied `userId`/role.
- Every sensitive mutation (`create`/`update`/`remove`) calls `writeAuditLog` after the role/ownership check succeeds.
- Use existing `lib/validation/projects.ts` / `properties.ts` / `propertyShared.ts` Zod schemas for client-side form validation — do not redefine field shapes.
- Icons: `lucide-react` only. Toasts: `sonner`.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `convex/projects.ts`, `convex/projects.test.ts` | Create | `list`, `get`, `create`, `update`, `remove` (with properties-reference delete guard) |
| `convex/properties.ts`, `convex/properties.test.ts` | Create | `list`, `get`, `create`, `update` (with Agent ownership check), `remove` |
| `convex/developers.ts`, `convex/developers.test.ts` | Modify | Add reference-guard to `remove` |
| `convex/communities.ts`, `convex/communities.test.ts` | Modify | Add reference-guard to `remove` |
| `components/forms/field-hint.tsx` | Create | Shared hint-text component |
| `components/forms/localized-text-field.tsx` | Modify | Add optional `hint` prop |
| `components/admin/projects/*` | Create | Columns, delete action, create dialog, edit form |
| `app/(portal)/admin/projects/page.tsx`, `[id]/page.tsx` | Create | List + Edit pages |
| `components/admin/properties/*` | Create | Columns, delete action, create dialog, tabbed edit form |
| `app/(portal)/admin/properties/page.tsx`, `[id]/page.tsx` | Create | List + Edit pages |
| `components/admin/admin-nav-items.ts` | Modify | Add Projects, Properties nav entries |
| `app/(portal)/admin/page.tsx` | Modify | Add Projects, Properties count cards |
| `components/admin/developers/developer-create-dialog.tsx`, `developer-edit-form.tsx` | Modify | Add hints |
| `components/admin/agents/agent-create-dialog.tsx`, `agent-edit-form.tsx` | Modify | Add hints |
| `components/admin/communities/community-create-dialog.tsx`, `community-edit-form.tsx` | Modify | Add hints |
| `PLAN.md` | Modify | Check off Projects CRUD, Properties CRUD |
| `TECH_STACK.md` | Modify | Document FK-Select, delete-guard, ownership-check, and `FieldHint` conventions |

---

### Task 1: `convex/projects.ts` (TDD)

Mirrors `convex/communities.ts`'s shape. `list`/`get` require `projects:read`. `create`/`update` require `projects:create`/`update`, set `publishing.updatedAt`/`publishedAt` server-side, enforce global slug uniqueness via `by_publishing_slug`. `remove` requires `projects:delete` and throws if `properties.by_project` has any match. Args: `title`/`description`/`city` (LocalizedText), `developerId` (required `v.id("developers")`), `communityId` (optional), `countryCode`, `status` (upcoming/under_construction/completed), `startingPrice`, `coordinates`, `amenities`, `seo`, `slug`, `status` (publishing). Audit-log every mutation under resource `"projects"`.

### Task 2: Delete guards on `convex/developers.ts` and `convex/communities.ts`

Add a reference check before delete in both files' `remove` mutations (query `projects`/`properties` by the corresponding `by_developer`/`by_community` index, throw if any match). New test cases for the blocked path in both test files.

### Task 3: Projects admin UI

`project-columns.tsx` (Title, Developer name via client-side id→name Map, Country/City, Status badge, Actions), `project-delete-action.tsx`, `project-create-dialog.tsx` (fields-only), `project-edit-form.tsx` (full form incl. Developer/Community Selects, coordinates, amenities, SEO, hints, `MediaUploader entityType="project"`), list + edit pages.

### Task 4: `convex/properties.ts` (TDD)

Mirrors the same structure, spreading `propertySharedFactsValidator.fields` for `price`/`bedrooms`/`bathrooms`/`areaSqft`/`countryCode`. `update` adds the Agent-ownership check (`existing.agentId === actor._id` when `actor.role === "agent"`). `remove` has no reference guard. Args otherwise mirror the `properties` table (excluding `sourceSubmissionId`, never client-settable).

### Task 5: Properties admin UI

`property-columns.tsx`, `property-delete-action.tsx`, `property-create-dialog.tsx` (fields-only, un-tabbed), `property-edit-form.tsx` (tabbed: Details / Relations / SEO, `MediaUploader entityType="property"` below tabs), list + edit pages.

### Task 6: `FieldHint` component + hints across all forms

Build `components/forms/field-hint.tsx`, add `hint` prop to `LocalizedTextField`, apply hint copy (see the confirmed plan) to Projects/Properties forms and retrofit onto Developers/Agents/Communities forms.

### Task 7: Wiring + docs

Nav items, dashboard count cards, `PLAN.md`, `TECH_STACK.md`.

### Task 8: Verify

`npm run lint; npx tsc --noEmit` and full `vitest` run, all clean.
