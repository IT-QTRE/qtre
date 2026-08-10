# Auth Architecture — Design Spec

> Status: Approved. Resolves Phase 2's implementation approach and the
> remaining pieces of `docs/superpowers/specs/2026-08-07-roles-and-portals-design.md`
> that spec left as "implementation detail for the plan."

## Context

Phase 1 built the data model (`users` table with `role`, the `RESOURCES`/`PERMISSION_MATRIX`/`can()` matrix, `requireRole`) and the roles/portals spec resolved *who* the four roles are. This spec resolves *how* Clerk and Convex are wired together to make that matrix actually enforce anything, and how each role's Convex `users` row comes into existence.

## Clerk ↔ Convex wiring

Convex's Clerk integration no longer needs a JWT template (that's the older pattern). Current mechanism:

1. Activate the **Convex integration** toggle in the Clerk Dashboard (`dashboard.clerk.com/apps/setup/convex`) — manual, one-time, per Clerk instance. **User does this.**
2. Copy the Clerk app's *Frontend API URL* into `CLERK_JWT_ISSUER_DOMAIN` (new env var, added to `.env.example`/`.env.local`).
3. `convex/auth.config.ts`:
   ```ts
   import { AuthConfig } from "convex/server";
   export default {
     providers: [{ domain: process.env.CLERK_JWT_ISSUER_DOMAIN!, applicationID: "convex" }],
   } satisfies AuthConfig;
   ```
4. `components/providers/convex-client-provider.tsx` switches from plain `ConvexProvider` to `ConvexProviderWithClerk` (from `convex/react-clerk`), wired to Clerk's `useAuth()` hook. This is required for any authenticated client-side query/mutation (e.g. the Client Portal's submission form) to actually carry the user's identity to Convex — today it silently wouldn't.
5. Server Components needing Convex data under auth use `fetchQuery`/`fetchMutation` (from `convex/nextjs`) with `{ token: await (await auth()).getToken() }` — no template param needed with the native integration.

## Role source of truth — no Clerk-metadata mirroring for ongoing checks

Clerk proves identity only. Convex's `users` table (`role` field, built in Phase 1) is the **only** ongoing source of truth for authorization — never Clerk session claims or metadata, to avoid a second copy of the role that can drift. Every portal's root layout and every Convex function re-derives role from that table on every request; nothing caches a "you're an admin" decision from login time.

The one narrow exception: Clerk `public_metadata.role` is used **transiently, once, at first-login provisioning** as a hint for which role a brand-new Convex `users` row should get (see "User provisioning" below). Once that row exists, Clerk's metadata is never consulted again.

## Route structure — shared `(portal)` route group

Restructures today's standalone `app/admin/` into a shared group so `admin`, `agent-portal`, `client-portal`, `sign-in`, `sign-up` all share one root layout (`<html>`, fonts, `ClerkProvider`) instead of duplicating it per zone:

```
app/(portal)/
  layout.tsx                          # <html>, ClerkProvider, fonts — the one shared root
  admin/
    layout.tsx                        # role guard: redirect unless role ∈ {admin, super_admin}
    page.tsx
  agent-portal/
    layout.tsx                        # role guard: redirect unless role === agent
    page.tsx
  client-portal/
    layout.tsx                        # role guard: redirect unless role === client (auto-provisions on first visit)
    page.tsx
  sign-in/[[...sign-in]]/page.tsx      # mounts Clerk's <SignIn />, shadcn-themed
  sign-up/[[...sign-up]]/page.tsx      # mounts Clerk's <SignUp />, shadcn-themed
```

Paths: `/admin`, `/agent-portal`, `/client-portal`, `/sign-in`, `/sign-up` — all top-level, all outside `[locale]`, English-only, matching the roles/portals spec.

**Why a shared group, not three separate roots:** Next.js route groups exist specifically for this ("layout zones" sharing a root without affecting the URL); it matches this workspace's own `foundation.mdc` convention; and it means one place to edit `<html>`/fonts/`ClerkProvider` instead of three near-identical copies.

**Sign-in is role-agnostic.** One shared `/sign-in` page works for all three portals — Clerk doesn't need to know the difference between an Admin, Agent, or Client at login time. Each portal's own link passes `?redirect_url=` back to itself (e.g. `/sign-in?redirect_url=/admin`); after auth, the destination portal's own layout is what actually checks the Convex role and redirects away on a mismatch. This is the real enforcement point, not the sign-in page.

## Middleware (`proxy.ts`)

Wrap everything in `clerkMiddleware()`. Only call `auth.protect()` (sign-in required, not yet role-specific) for `/admin`, `/agent-portal`, `/client-portal`. Delegate to the existing next-intl middleware for `[locale]` paths. Leave `/sign-in`, `/sign-up` public. This is a coarse "must be signed in" gate only — role enforcement happens in each portal's layout (Convex-backed) and in every Convex function via `requireRole` (Phase 1), never in middleware alone.

## User provisioning

Provisioning is asymmetric by *how* the account came to exist, but funnels through one mechanism:

- **Client** (self-service): no invitation. Homepage's "List Your Property" CTA → `/sign-up?redirect_url=/client-portal` → normal Clerk sign-up → lands on `/client-portal`.
- **Agent** (Admin-created only, per roles/portals spec — no self-signup): an Admin/Super Admin-only Convex action calls Clerk's Backend API (`POST /v1/invitations`, `{ email_address, public_metadata: { role: "agent" } }`) using `CLERK_SECRET_KEY`. The Agent receives Clerk's invite email, clicks it, and sets their own password (their choice over "Admin sets a temp password and shares it out-of-band"). The actual Admin-facing form for this is Phase 4's "Users & Roles" screen; Phase 2 only builds the underlying action.
- **Admin / Super Admin**: no self-provisioning path exists. The very first Super Admin comes from a normal sign-up (which provisions a `client` row, same as any organic signup) that is then manually promoted to `super_admin` directly in the Convex dashboard — a one-time, human, out-of-band step, consistent with "I'll do any Convex dev/deploy needed."

**The provisioning mechanism itself** (one Convex action, `ensureUserProvisioned`, called from the Client Portal's and Agent Portal's layouts on every visit — cheap no-op once a row exists):

1. `ctx.auth.getUserIdentity()` — if none, the caller isn't authenticated (shouldn't happen past middleware, but action still checks).
2. `ctx.runQuery(internal.users.getByTokenIdentifier, ...)` — if a row already exists, return it immediately (no Clerk API call).
3. If no row exists: call Clerk's Backend API (`GET /v1/users/{identity.subject}`) with `CLERK_SECRET_KEY` to read `public_metadata.role`. If it's `"agent"` (set by the invite action above), that's the new row's role; otherwise default to `"client"`.
4. `ctx.runMutation(internal.users.upsert, { tokenIdentifier, email, name, role })`.

Convex mutations can't make external HTTP calls (must stay deterministic) — that's why this has to be an action calling an internal mutation, not a plain mutation. This design needs no Clerk webhooks, no `svix` dependency, and no session-token customization: `public_metadata` is read directly via one Backend API call, only on the one first-visit-with-no-row case.

**Why this doesn't let anyone grant themselves admin/agent access:** the Admin/Agent Portal layouts never call the "default to client" path — only the Client Portal layout does. Landing on `/agent-portal` with no existing Convex row (and thus no accepted invitation) is just denied, full stop; there's no auto-provision fallback there.

## Convex environments (dev/prod split)

Deferred, confirmed again at this Phase 2 review — a single dev Convex deployment + single dev Clerk instance is sufficient until closer to launch (Phase 8), rather than doubling every env var and Dashboard config now for an app with no live users yet.

## Plan-Wide Impact Summary

| Area | Resolution |
|---|---|
| `convex/auth.config.ts` | New — Clerk issuer domain, `applicationID: "convex"` |
| `components/providers/convex-client-provider.tsx` | `ConvexProvider` → `ConvexProviderWithClerk` |
| `app/admin/` | Restructured into `app/(portal)/admin/` alongside new `agent-portal`, `client-portal`, `sign-in`, `sign-up` |
| `proxy.ts` | `clerkMiddleware()` added, composed with the existing next-intl middleware |
| `convex/users.ts` (new) | `current` query, `getByTokenIdentifier` internal query, `upsert` internal mutation, `ensureUserProvisioned` action |
| Agent creation | Admin/Super Admin-only Convex action calling Clerk's invitation API — mechanism in Phase 2, UI form in Phase 4 |
| Role storage | Convex `users.role` only — no Clerk metadata mirroring for ongoing checks |
