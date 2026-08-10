# Roles & Portals — Design Spec

> Status: Approved. Supersedes the 6-role list in `TECH_STACK.md` and resolves
> the "Public visitor accounts" item in `PLAN.md`'s Open Decisions.

## Context

`TECH_STACK.md` originally specified 6 roles (Super Admin, Admin, Property
Manager, Content Editor, Agent, Viewer), all scoped to the internal admin
dashboard, with no concept of external (Agent- or Client-facing) accounts.
`PLAN.md` had an open, unresolved question about whether public visitor
accounts were needed at all.

This spec replaces that role model with a 4-role model that includes two new
external-facing portals: an **Agent Portal** (for assigned Agents to manage
their own listings and leads) and a **Client Portal** (for property owners to
submit a property to be listed on the site).

## Roles

Full replacement of the previous 6-role list — Property Manager, Content
Editor, and Viewer are dropped as separate roles.

| Role | Scope |
|---|---|
| **Super Admin** | Full access to everything. Only role that can create/manage other Admin accounts. |
| **Admin** | Full access to Properties, Projects, Developers, Agents, Blog, Leads, Media, Settings, Audit Logs. Creates Agent accounts. Assigns property submissions to Agents (or reviews them personally). |
| **Agent** *(has portal access)* | Scoped to their own assigned Properties/Projects (edit rights) and Leads/submissions assigned to them for review. No access to Users, Settings, Audit Logs, or other agents' records. |
| **Client** *(has portal access)* | Scoped to only their own submitted properties. Can create new submissions and upload documents to them, and view status. No buyer-side browsing/favorites — this role exists solely for property owners listing a property. |

The Permission Matrix Open Decision in `PLAN.md` (needed by Phase 1) now
resolves against these 4 roles instead of the original 6.

## Client Portal — "List Your Property" flow

1. Homepage gets a new **"List Your Property"** CTA button (public-facing,
   Phase 5 addition to `TECH_STACK.md`'s route list).
2. Clicking it leads to Clerk sign-up/sign-in, then a submission form:
   - Property details: address/location, expected price, bedrooms, bathrooms,
     area, description, property type.
   - Supporting documents: title deed, ownership proof, floor plan, photos,
     etc. (reuses the Phase 3 Blob upload pipeline / `MediaItem` shape).
3. Submission is stored in a new `propertySubmissions` table (see Data Model)
   with status `pending → under_review → approved | rejected`.
4. An Admin assigns the submission to an Agent (or reviews it personally).
5. On **approval**: a real `properties` record is created, with a
   back-reference to the originating submission for audit trail.
6. On **rejection**: a rejection reason is recorded and visible to the client.
7. The Client can log back into their portal anytime to check status and
   submit additional properties later.

Property submissions are intentionally **not** modeled as `leads` — they get
their own dedicated table and review workflow, distinct from buyer inquiries
collected via the public contact form.

## Agent Portal

- Reuses the admin dashboard's visual style and components (`DataTable`,
  shell layout) rather than a separate design system — the portal is a
  permission-scoped view, not a different UI.
- Shows: the Agent's own assigned Properties/Projects (editable), Leads
  assigned to them, and property submissions assigned to them for review
  (with an approve/reject action).

## Data Model Changes (Phase 1 impact)

- **New table: `propertySubmissions`**
  - `clientId` — ref to the submitting Client's user record
  - `assignedReviewerId` — ref to Admin or Agent reviewing it (nullable until assigned)
  - Property-detail fields (subset of the full `properties` schema — owner-provided facts, not the full admin-curated content model)
  - `documents: MediaItem[]`
  - `status: "pending" | "under_review" | "approved" | "rejected"`
  - `rejectionReason?: string`
  - `convertedPropertyId?` — set on approval, references the created `properties` row
  - `submittedAt`, `reviewedAt?`
- **`properties` table** gains an optional `sourceSubmissionId` back-reference for audit trail.
- **`users`/role field** becomes `"super_admin" | "admin" | "agent" | "client"` (was a 6-value enum).

## Auth Changes (Phase 2 impact)

- **Resolves the "Public visitor accounts" Open Decision: yes.** Clerk now
  extends beyond admin-only — Agents and Clients both get Clerk accounts with
  a Convex role.
- Client accounts are self-service, created through the List Your Property
  flow.
- Agent accounts are created by an Admin/Super Admin — not self-signup, same
  pattern as today's internal admin accounts.

## Routing

- Both Agent Portal and Client Portal live **outside `[locale]`**,
  English-only — same pattern as the admin dashboard, not the translated
  public site. (Exact paths, e.g. `/agent-portal` vs. nested under an existing
  route group, are an implementation detail for the plan, not this spec.)

## Plan-Wide Impact Summary

| Phase | Impact |
|---|---|
| Phase 1 (Data Model) | New `propertySubmissions` table; updated role enum; permission matrix covers 4 roles |
| Phase 2 (Auth) | Clerk extends to Agent/Client roles; resolves the Open Decision |
| Phase 3 (Media Pipeline) | Submission documents reuse the same Blob/`MediaItem` pipeline |
| Phase 4 (Admin Dashboard Core) | Adds Agent Portal + Client Portal screens and a submission review queue |
| Phase 5 (Public Website) | Adds "List Your Property" homepage CTA |

## Explicitly Out of Scope (for this spec)

- Buyer-side accounts (saved searches/favorites) — not part of the Client
  role; not being built.
- Client-Agent in-portal messaging — status tracking only, no messaging
  thread (can be revisited later if a real need arises).
- Exact route paths/URL structure for the portals — left to the implementation
  plan.
