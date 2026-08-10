# Phase 2 — Auth & Authorization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Clerk and Convex together for real (native integration, no JWT template), restructure the "outside-`[locale]`" zone into a shared route group covering Admin/Agent Portal/Client Portal, add the coarse sign-in gate in `proxy.ts`, and implement the user-provisioning + Agent-invitation mechanisms so every portal's role guard has a real Convex `users` row to check against.

**Architecture:** Full detail in `docs/superpowers/specs/2026-08-08-auth-architecture.md`. Summary: Convex's `users` table (Phase 1) is the *only* ongoing source of truth for role — never Clerk metadata or session claims for repeated checks. Clerk `public_metadata.role` is read exactly once, transiently, by a single Convex action (`ensureUserProvisioned`) at first-login provisioning, to decide whether a brand-new `users` row should be `"agent"` (set by an Admin's invite) or default to `"client"` (organic self-signup). Middleware (`proxy.ts`) only enforces "must be signed in" for `/admin`, `/agent-portal`, `/client-portal`; each portal's own root layout re-derives role from Convex on every request and redirects on a mismatch — that's the real enforcement point, alongside `requireRole` inside every Convex function (Phase 1).

**Tech Stack:** `@clerk/nextjs` `7.7.0` (Core 3), `convex` `1.43.0`. No new dependencies this phase — `ConvexProviderWithClerk` ships from `convex/react-clerk`, `fetchQuery`/`fetchAction` from `convex/nextjs`, both already part of the installed `convex` package.

## Global Constraints

- **No agent runs `git add` or `git commit` — ever, for any task.** All changes stay uncommitted. Every "Commit" step is replaced by a "Do not commit" note.
- Convex mutations cannot make external HTTP calls (must stay deterministic) — anything calling Clerk's Backend API must be an `action`, delegating DB reads/writes to `internalQuery`/`internalMutation` via `ctx.runQuery`/`ctx.runMutation`.
- `fetch()` is available in Convex's default runtime — no `"use node"` needed anywhere in this phase.
- Per Convex guidelines: when `ctx.runQuery`/`ctx.runMutation` calls a function defined in the *same file*, annotate the call's return type explicitly (TypeScript circularity limitation) — this applies to `convex/users.ts`, which defines `ensureUserProvisioned` alongside the internal functions it calls.
- Role is derived server-side via `ctx.auth.getUserIdentity().tokenIdentifier` — never a client-supplied `userId`/role (same rule Phase 1 established for `requireRole`).
- Some steps require a manual action in the Clerk Dashboard (there is no CLI/API path for these) — those steps are called out explicitly and are the user's to perform, consistent with "I will do any Convex dev/deploy needed."
- A `npx convex dev` watch process may already be running from earlier phases — check its terminal output for a successful sync after any `convex/` change instead of running `npx convex dev --once` again.
- This phase does not touch Phase 4's actual UI (sidebar shells, forms, the Users & Roles screen) — portal pages built here are placeholders, same pattern as `app/admin/page.tsx` today.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `.env.example` | Modify | Add `CLERK_JWT_ISSUER_DOMAIN` |
| `convex/auth.config.ts` | Create | Points Convex at Clerk's issuer domain for token validation |
| `components/providers/convex-client-provider.tsx` | Modify | `ConvexProvider` → `ConvexProviderWithClerk` |
| `convex/lib/clerkMetadata.ts` | Create | `resolveRoleFromClerkMetadata` — pure, tested logic extracted out of the action that calls Clerk's API |
| `convex/lib/clerkMetadata.test.ts` | Create | Tests for the above |
| `convex/users.ts` | Create | `current` (public query), `getByTokenIdentifier`/`upsert` (internal), `ensureUserProvisioned` (public action) |
| `convex/users.test.ts` | Create | Tests for `current`/`getByTokenIdentifier`/`upsert` via `convex-test` |
| `convex/lib/agentInvitation.ts` | Create | `buildInvitationRequestBody` — pure, tested request-shape logic |
| `convex/lib/agentInvitation.test.ts` | Create | Tests for the above |
| `convex/agentInvitations.ts` | Create | `authorizeAndLogInvite` (internal mutation: `requireRole` gate + audit log), `inviteAgent` (public action calling Clerk's invitation API) |
| `convex/agentInvitations.test.ts` | Create | Tests for `authorizeAndLogInvite`'s authorization/audit-log behavior |
| `app/admin/layout.tsx`, `app/admin/page.tsx` | Move | → `app/(portal)/admin/` |
| `app/(portal)/layout.tsx` | Create | Shared root layout (`<html>`, fonts, `ClerkProvider`) for admin/agent-portal/client-portal/sign-in/sign-up |
| `app/(portal)/admin/layout.tsx` | Create | Role guard: redirect unless role ∈ {admin, super_admin} |
| `app/(portal)/agent-portal/layout.tsx`, `page.tsx` | Create | Role guard (provisions + requires `agent`) + placeholder page |
| `app/(portal)/client-portal/layout.tsx`, `page.tsx` | Create | Role guard (provisions + requires `client`) + placeholder page |
| `app/(portal)/sign-in/[[...sign-in]]/page.tsx` | Create | Mounts Clerk's `<SignIn />` |
| `app/(portal)/sign-up/[[...sign-up]]/page.tsx` | Create | Mounts Clerk's `<SignUp />` |
| `proxy.ts` | Modify | Add `clerkMiddleware()`, protect the three portal roots, keep next-intl for `[locale]` |
| `PLAN.md` | Modify | Check off completed Phase 2 items |

---

### Task 1: Clerk Dashboard activation + `CLERK_JWT_ISSUER_DOMAIN`

**Files:**
- Modify: `.env.example`

**Interfaces:**
- Consumes: nothing.
- Produces: the env var Task 2's `auth.config.ts` reads. This task has a manual, human-only step — no CLI/API path exists for it.

- [ ] **Step 1: Manual — activate the Convex integration in Clerk (user-performed)**

In the Clerk Dashboard, open **Configure → Convex** (or `https://dashboard.clerk.com/apps/setup/convex`) and activate the integration. Copy the app's **Frontend API URL** (format: `https://<name>.clerk.accounts.dev` in development).

- [ ] **Step 2: Add the env var to `.env.example`**

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_ISSUER_DOMAIN=
```

- [ ] **Step 3: Manual — set the real values (user-performed)**

Add `CLERK_JWT_ISSUER_DOMAIN` (the Frontend API URL from Step 1) to `.env.local`. Also set the same variable on the Convex dashboard's dev deployment environment variables (Convex reads it server-side, not from `.env.local` — that file only affects the Next.js process). This project already has `CLERK_SECRET_KEY` from Phase 0.

- [ ] **Step 4: Do not commit**

`.env.example` only (never commit `.env.local`, which is already gitignored) — no `git add`/`git commit`.

---

### Task 2: `convex/auth.config.ts`

**Files:**
- Create: `convex/auth.config.ts`

**Interfaces:**
- Consumes: `CLERK_JWT_ISSUER_DOMAIN` (Task 1, set on the Convex deployment).
- Produces: the auth provider config Convex uses to validate every incoming token's issuer/audience. Nothing in this repo imports this file directly — Convex's deploy step reads it automatically.

- [ ] **Step 1: Write the file**

```ts
import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      // Clerk's Frontend API URL (Task 1) — set on the Convex deployment,
      // not just .env.local, since Convex reads this server-side.
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
```

- [ ] **Step 2: Verify the config syncs to the real Convex deployment**

Check the running `npx convex dev` terminal's output for a successful sync with no errors, or run `npx convex dev --once` if no watch process is running. Expected: no auth-config validation errors. If `CLERK_JWT_ISSUER_DOMAIN` isn't set on the deployment yet (Task 1, Step 3 not done), this will fail — that's expected until the manual step is complete; note it and move on, revisiting once the user confirms it's set.

- [ ] **Step 3: Do not commit**

Leave `convex/auth.config.ts` uncommitted — no `git add`/`git commit`.

---

### Task 3: `ConvexProviderWithClerk`

**Files:**
- Modify: `components/providers/convex-client-provider.tsx`

**Interfaces:**
- Consumes: Clerk's `useAuth()` hook (already available — `@clerk/nextjs` is installed).
- Produces: every authenticated client-side Convex query/mutation now actually carries the signed-in user's identity. Before this change, `ctx.auth.getUserIdentity()` would return `null` for every client-originated call regardless of Clerk sign-in state.

- [ ] **Step 1: Rewrite the provider**

```tsx
"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import type { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Do not commit**

Leave `components/providers/convex-client-provider.tsx` uncommitted — no `git add`/`git commit`.

---

### Task 4: `resolveRoleFromClerkMetadata`

**Files:**
- Create: `convex/lib/clerkMetadata.ts`
- Test: `convex/lib/clerkMetadata.test.ts`

**Interfaces:**
- Consumes: `Role` type from `convex/lib/roles.ts` (Phase 1).
- Produces: `resolveRoleFromClerkMetadata(publicMetadata)` — the pure decision logic `ensureUserProvisioned` (Task 5) uses after fetching a Clerk user's metadata. Extracted into its own pure function specifically so it's unit-testable without a real Clerk API call.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { resolveRoleFromClerkMetadata } from "./clerkMetadata";

describe("resolveRoleFromClerkMetadata", () => {
  it("returns agent when public_metadata.role is agent (set by an invite)", () => {
    expect(resolveRoleFromClerkMetadata({ role: "agent" })).toBe("agent");
  });

  it("defaults to client when there is no role metadata (organic self-signup)", () => {
    expect(resolveRoleFromClerkMetadata({})).toBe("client");
    expect(resolveRoleFromClerkMetadata(null)).toBe("client");
    expect(resolveRoleFromClerkMetadata(undefined)).toBe("client");
  });

  it("never resolves to admin/super_admin from metadata — those roles have no self/invite provisioning path", () => {
    expect(resolveRoleFromClerkMetadata({ role: "admin" })).toBe("client");
    expect(resolveRoleFromClerkMetadata({ role: "super_admin" })).toBe("client");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run convex/lib/clerkMetadata.test.ts`
Expected: FAIL with "Cannot find module './clerkMetadata'".

- [ ] **Step 3: Write minimal implementation**

```ts
import type { Role } from "./roles";

// Deliberately narrow: the only role Clerk metadata can ever grant is
// "agent" (set by convex/agentInvitations.ts's inviteAgent action at
// invitation time). Everything else — including any attempt to smuggle
// "admin"/"super_admin" through metadata — resolves to the safe default,
// since those roles have no self-service or invite-based provisioning path
// per docs/superpowers/specs/2026-08-08-auth-architecture.md.
export function resolveRoleFromClerkMetadata(publicMetadata: unknown): Role {
  if (
    publicMetadata &&
    typeof publicMetadata === "object" &&
    "role" in publicMetadata &&
    (publicMetadata as { role: unknown }).role === "agent"
  ) {
    return "agent";
  }
  return "client";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run convex/lib/clerkMetadata.test.ts`
Expected: `3 passed`.

- [ ] **Step 5: Do not commit**

Leave `convex/lib/clerkMetadata.ts` and its test uncommitted — no `git add`/`git commit`.

---

### Task 5: `convex/users.ts` — `current`, provisioning internals, `ensureUserProvisioned`

**Files:**
- Create: `convex/users.ts`
- Test: `convex/users.test.ts`

**Interfaces:**
- Consumes: the `users` table (Phase 1), `resolveRoleFromClerkMetadata` (Task 4).
- Produces: `current` (public query, used by every portal layout to read the signed-in user's role), `getByTokenIdentifier`/`upsert` (internal, DB access for the action below), `ensureUserProvisioned` (public action, called by the Agent/Client Portal layouts on every visit — cheap no-op once a row exists). This is the first task in this plan to register real Convex functions (`query`/`action`/`internal*`) — Phase 1 only defined schema and pure helpers.

- [ ] **Step 1: Write the failing tests for `current`, `getByTokenIdentifier`, `upsert`**

```ts
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { api, internal } from "./_generated/api";

const modules = import.meta.glob("./**/*.ts");

describe("users.current", () => {
  test("returns null when not authenticated", async () => {
    const t = convexTest(schema, modules);
    const result = await t.query(api.users.current, {});
    expect(result).toBeNull();
  });

  test("returns the matching row for the authenticated identity", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: "clerk|user-1",
        email: "user1@example.com",
        name: "User One",
        role: "client",
        createdAt: Date.now(),
      });
    });
    const asUser = t.withIdentity({ tokenIdentifier: "clerk|user-1" });
    const result = await asUser.query(api.users.current, {});
    expect(result?.email).toBe("user1@example.com");
  });
});

describe("users.upsert (internal)", () => {
  test("inserts a new row when none exists, and is idempotent on a second call", async () => {
    const t = convexTest(schema, modules);
    const args = {
      tokenIdentifier: "clerk|user-2",
      email: "user2@example.com",
      name: "User Two",
      role: "client" as const,
    };
    const firstId = await t.mutation(internal.users.upsert, args);
    const secondId = await t.mutation(internal.users.upsert, args);
    expect(secondId).toBe(firstId);

    const rows = await t.run(async (ctx) => ctx.db.query("users").collect());
    expect(rows).toHaveLength(1);
  });
});

describe("users.getByTokenIdentifier (internal)", () => {
  test("returns null for an unknown identity", async () => {
    const t = convexTest(schema, modules);
    const result = await t.query(internal.users.getByTokenIdentifier, {
      tokenIdentifier: "clerk|unknown",
    });
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run convex/users.test.ts`
Expected: FAIL with "Cannot find module './_generated/api'" resolution errors for `api.users`/`internal.users` (the module exists, but has no `users` export yet).

- [ ] **Step 3: Write `convex/users.ts`**

```ts
import { v } from "convex/values";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { roleValidator } from "./lib/roles";
import { resolveRoleFromClerkMetadata } from "./lib/clerkMetadata";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    return await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
  },
});

export const getByTokenIdentifier = internalQuery({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();
  },
});

export const upsert = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    email: v.string(),
    name: v.string(),
    role: roleValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();
    if (existing) {
      return existing._id;
    }
    return await ctx.db.insert("users", { ...args, createdAt: Date.now() });
  },
});

// Called by the Agent/Client Portal layouts on every visit. Cheap no-op
// once a row exists — only hits Clerk's Backend API on a brand-new
// identity's very first visit. This is an `action` (not a `mutation`)
// specifically because reading Clerk's API is a non-deterministic external
// HTTP call, which mutations must never do.
export const ensureUserProvisioned = action({
  args: {},
  handler: async (ctx): Promise<Id<"users">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Same-file ctx.runQuery/runMutation calls need an explicit return type
    // annotation (TypeScript circularity limitation noted in the Convex
    // guidelines) — hence the `Doc<"users"> | null` and `Id<"users">` below.
    const existing: Doc<"users"> | null = await ctx.runQuery(internal.users.getByTokenIdentifier, {
      tokenIdentifier: identity.tokenIdentifier,
    });
    if (existing) {
      return existing._id;
    }

    const response = await fetch(`https://api.clerk.com/v1/users/${identity.subject}`, {
      headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
    });
    const role = response.ok
      ? resolveRoleFromClerkMetadata((await response.json()).public_metadata)
      : "client";

    const userId: Id<"users"> = await ctx.runMutation(internal.users.upsert, {
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email ?? "",
      name: identity.name ?? "Unknown",
      role,
    });
    return userId;
  },
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run convex/users.test.ts`
Expected: `4 passed`. (`ensureUserProvisioned` isn't covered here — it makes a real `fetch()` call to Clerk's API, which isn't something to exercise in a unit test; it's verified manually in Task 10 once the portal layouts call it against the real dev deployment.)

- [ ] **Step 5: Verify the new functions sync to the real Convex deployment**

Check the running `npx convex dev` output, or run `npx convex dev --once`. Expected: no errors; `users:current`, `users:ensureUserProvisioned` etc. appear in the deployed function list.

- [ ] **Step 6: Do not commit**

Leave `convex/users.ts` and its test uncommitted — no `git add`/`git commit`.

---

### Task 6: Agent invitation — `buildInvitationRequestBody` + `convex/agentInvitations.ts`

**Files:**
- Create: `convex/lib/agentInvitation.ts`
- Test: `convex/lib/agentInvitation.test.ts`
- Create: `convex/agentInvitations.ts`
- Test: `convex/agentInvitations.test.ts`

**Interfaces:**
- Consumes: `requireRole` (Phase 1's `convex/lib/permissions.ts`), `writeAuditLog` (Phase 1's `convex/lib/auditLog.ts`).
- Produces: `inviteAgent` (public action) — the mechanism an Admin/Super Admin uses to grant someone Agent access. Per the roles/portals spec, Agents never self-signup; per `docs/superpowers/specs/2026-08-08-auth-architecture.md`, this sends a real Clerk email invitation (the Agent sets their own password) rather than an Admin-set temporary password. The Admin-facing form that calls this is Phase 4's "Users & Roles" screen — this task only builds the backend mechanism.

- [ ] **Step 1: Write the failing test for the pure request-body helper**

```ts
import { describe, expect, it } from "vitest";
import { buildInvitationRequestBody } from "./agentInvitation";

describe("buildInvitationRequestBody", () => {
  it("sets public_metadata.role to agent so ensureUserProvisioned can pick it up on first login", () => {
    expect(buildInvitationRequestBody("agent@example.com")).toEqual({
      email_address: "agent@example.com",
      public_metadata: { role: "agent" },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run convex/lib/agentInvitation.test.ts`
Expected: FAIL with "Cannot find module './agentInvitation'".

- [ ] **Step 3: Write `convex/lib/agentInvitation.ts`**

```ts
// This body's shape is read back on the invited Agent's first login by
// convex/lib/clerkMetadata.ts's resolveRoleFromClerkMetadata — the two must
// stay in sync (this sets `{ role: "agent" }`, that reads `role === "agent"`).
export function buildInvitationRequestBody(email: string) {
  return {
    email_address: email,
    public_metadata: { role: "agent" },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run convex/lib/agentInvitation.test.ts`
Expected: `1 passed`.

- [ ] **Step 5: Write the failing test for `authorizeAndLogInvite`**

```ts
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { internal } from "./_generated/api";
import { ForbiddenError } from "./lib/permissions";

const modules = import.meta.glob("./**/*.ts");

describe("agentInvitations.authorizeAndLogInvite", () => {
  test("rejects a caller without users:create permission", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: "clerk|agent-1",
        email: "agent1@example.com",
        name: "Agent One",
        role: "agent",
        createdAt: Date.now(),
      });
    });
    const asAgent = t.withIdentity({ tokenIdentifier: "clerk|agent-1" });
    await expect(
      asAgent.mutation(internal.agentInvitations.authorizeAndLogInvite, {
        email: "newagent@example.com",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  test("allows an Admin and writes an audit log entry", async () => {
    const t = convexTest(schema, modules);
    const adminId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        tokenIdentifier: "clerk|admin-1",
        email: "admin1@example.com",
        name: "Admin One",
        role: "admin",
        createdAt: Date.now(),
      });
    });
    const asAdmin = t.withIdentity({ tokenIdentifier: "clerk|admin-1" });
    await asAdmin.mutation(internal.agentInvitations.authorizeAndLogInvite, {
      email: "newagent@example.com",
    });

    const logs = await t.run(async (ctx) => {
      return await ctx.db
        .query("auditLogs")
        .withIndex("by_actor", (q) => q.eq("actorUserId", adminId))
        .collect();
    });
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ action: "invite_agent", targetId: "newagent@example.com" });
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run convex/agentInvitations.test.ts`
Expected: FAIL — `internal.agentInvitations` doesn't exist yet.

- [ ] **Step 7: Write `convex/agentInvitations.ts`**

```ts
import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireRole } from "./lib/permissions";
import { writeAuditLog } from "./lib/auditLog";
import { buildInvitationRequestBody } from "./lib/agentInvitation";

// Runs BEFORE the action below ever calls Clerk's API — an unauthorized
// caller never reaches the external request at all, since this throws
// first. `requireRole` needs `ctx.db`, so this has to be a mutation the
// action delegates to, not inline logic inside the action itself.
export const authorizeAndLogInvite = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "users", "create");
    await writeAuditLog(ctx, {
      actorUserId: actor._id,
      resource: "users",
      action: "invite_agent",
      targetId: args.email,
    });
  },
});

export const inviteAgent = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.agentInvitations.authorizeAndLogInvite, { email: args.email });

    const response = await fetch("https://api.clerk.com/v1/invitations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildInvitationRequestBody(args.email)),
    });
    if (!response.ok) {
      throw new Error(`Clerk invitation request failed: ${response.status} ${await response.text()}`);
    }
    return await response.json();
  },
});
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run convex/agentInvitations.test.ts`
Expected: `2 passed`. (`inviteAgent` itself isn't covered here for the same reason as `ensureUserProvisioned` — it's a real Clerk API call, verified manually once Phase 4 builds the calling UI.)

- [ ] **Step 9: Verify the new functions sync to the real Convex deployment**

Same as Task 5, Step 5.

- [ ] **Step 10: Do not commit**

Leave all four files uncommitted — no `git add`/`git commit`.

---

### Task 7: Route restructure — shared `app/(portal)/` group

**Files:**
- Move: `app/admin/layout.tsx`, `app/admin/page.tsx` → `app/(portal)/admin/`
- Create: `app/(portal)/layout.tsx`
- Delete: the now-empty `app/admin/` directory

**Interfaces:**
- Consumes: nothing new — same fonts/`cn` helper `app/admin/layout.tsx` already used.
- Produces: one shared root layout (`<html>`, fonts, `ClerkProvider`) for every route this phase adds under `(portal)`. Per `docs/superpowers/specs/2026-08-08-auth-architecture.md`, this replaces three near-identical standalone root layouts with one.

- [ ] **Step 1: Create the shared root layout**

```tsx
// app/(portal)/layout.tsx
import { Geist_Mono, Inter, Poppins } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "../globals.css";
import { cn } from "@/lib/utils";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", inter.variable, poppins.variable, geistMono.variable, "font-sans")}
    >
      <body className="min-h-full">
        <ClerkProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Move the existing admin files**

```bash
New-Item -ItemType Directory -Force "app/(portal)/admin" | Out-Null
Move-Item "app/admin/page.tsx" "app/(portal)/admin/page.tsx"
Remove-Item "app/admin/layout.tsx"
Remove-Item "app/admin" -Recurse -Force
```

`app/admin/layout.tsx` is removed rather than moved — its `<html>`/fonts/`ClerkProvider` responsibilities are now covered by the new shared `app/(portal)/layout.tsx`; Task 10 adds `app/(portal)/admin/layout.tsx` back as a thin role-guard-only layout (no `<html>`, no `ClerkProvider` — those belong to the parent now).

- [ ] **Step 3: Verify the dev server still serves `/admin`**

Run the app (`npm run dev` if not already running) and visit `/admin`. Expected: the same "Admin Dashboard (placeholder — built out in Phase 4)" heading renders, now inside the shared layout — no visual regression, no console errors about a missing `<html>` root.

- [ ] **Step 4: Do not commit**

Leave all moved/created files uncommitted — no `git add`/`git commit`.

---

### Task 8: Sign-in / sign-up pages

**Files:**
- Create: `app/(portal)/sign-in/[[...sign-in]]/page.tsx`
- Create: `app/(portal)/sign-up/[[...sign-up]]/page.tsx`

**Interfaces:**
- Consumes: Clerk's `<SignIn />`/`<SignUp />` components.
- Produces: one shared, role-agnostic sign-in/up entry point for all three portals. Per `docs/superpowers/specs/2026-08-08-auth-architecture.md`, each portal's own "Login"/"List Your Property" link supplies its own `redirect_url` back to itself — Clerk's components forward that automatically, so no custom redirect logic is needed here.

- [ ] **Step 1: Write the sign-in page**

```tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <SignIn />
    </div>
  );
}
```

- [ ] **Step 2: Write the sign-up page**

```tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <SignUp />
    </div>
  );
}
```

- [ ] **Step 3: Verify both render**

Visit `/sign-in` and `/sign-up`. Expected: Clerk's hosted sign-in/up forms render inside the shared `(portal)` layout, no errors. (Applying the shadcn theme to these — `@clerk/ui`'s `shadcn` appearance preset, per the `clerk-setup` skill — is a cosmetic follow-up, not a blocker for this phase; note it as a Phase 4/8 polish item rather than doing it here.)

- [ ] **Step 4: Do not commit**

Leave both pages uncommitted — no `git add`/`git commit`.

---

### Task 9: `proxy.ts` — `clerkMiddleware()` composed with next-intl

**Files:**
- Modify: `proxy.ts`

**Interfaces:**
- Consumes: `routing` from `i18n/routing.ts` (unchanged from Phase 0).
- Produces: the coarse "must be signed in" gate for `/admin`, `/agent-portal`, `/client-portal`. This is intentionally coarse — it does not check role; that happens in each portal's own layout (Task 10) and inside every Convex function via `requireRole` (Phase 1).

> **Correction (found during Task 8's verification, before this task was dispatched):** the original draft below only skipped `intlMiddleware` for `isProtectedPortalRoute` (`/admin`, `/agent-portal`, `/client-portal`). `/sign-in`/`/sign-up` fell through to `intlMiddleware`, which locale-prefixed them (`/sign-in` → redirect to `/en/sign-in`, a 404, since those routes live outside `[locale]`) — contradicting this same task's own Step 3, which expects both to render without a redirect. Fixed by adding a second, broader `isPortalRoute` matcher (includes sign-in/sign-up) that skips `intlMiddleware` without requiring auth.

- [ ] **Step 1: Rewrite `proxy.ts`**

```ts
import createMiddleware from "next-intl/middleware";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const isProtectedPortalRoute = createRouteMatcher(["/admin(.*)", "/agent-portal(.*)", "/client-portal(.*)"]);
// Broader than isProtectedPortalRoute: also covers /sign-in and /sign-up,
// which must skip locale-prefixing (they live outside [locale]) but must
// NOT require auth.protect() — they're how a signed-out user gets signed in.
const isPortalRoute = createRouteMatcher([
  "/admin(.*)",
  "/agent-portal(.*)",
  "/client-portal(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedPortalRoute(req)) {
    await auth.protect();
    // Portal routes live outside [locale] entirely (per the roles/portals
    // spec) — never hand these off to the next-intl middleware.
    return;
  }
  if (isPortalRoute(req)) {
    // Sign-in/sign-up: no auth required, but still must not be
    // locale-prefixed — same reasoning as the protected portal routes above.
    return;
  }
  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // Runs Clerk on every route (needed so /admin, /agent-portal,
    // /client-portal, /sign-in, /sign-up all get auth context), while still
    // excluding Next.js internals and static/metadata files.
    "/((?!_next|favicon.ico|icon0.svg|icon1.png|apple-icon.png|manifest.json|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
```

- [ ] **Step 2: Verify locale routing still works**

Visit `/` (no locale prefix). Expected: still redirects/rewrites to `/en` (or the detected locale) exactly as before — this phase must not regress Phase 0's locale middleware.

- [ ] **Step 3: Verify the sign-in gate**

While signed out, visit `/admin`. Expected: redirected to `/sign-in` (with a `redirect_url` back to `/admin`). Visit `/sign-in` and `/sign-up` directly while signed out. Expected: both render without a redirect loop (they must stay outside `isProtectedPortalRoute`).

- [ ] **Step 4: Do not commit**

Leave `proxy.ts` uncommitted — no `git add`/`git commit`.

---

### Task 10: Portal role-guard layouts

**Files:**
- Create: `app/(portal)/admin/layout.tsx`
- Create: `app/(portal)/agent-portal/layout.tsx`, `app/(portal)/agent-portal/page.tsx`
- Create: `app/(portal)/client-portal/layout.tsx`, `app/(portal)/client-portal/page.tsx`

**Interfaces:**
- Consumes: `api.users.current`/`api.users.ensureUserProvisioned` (Task 5), Clerk's `auth()` (server-side).
- Produces: the actual role-enforcement point for all three portals — middleware (Task 9) only checked "signed in," these layouts check "signed in **as the right role**" and redirect on a mismatch (cross-role access denied, per the roles/portals spec).

- [ ] **Step 1: Write the Admin layout (no auto-provisioning — a missing row is just denied)**

```tsx
// app/(portal)/admin/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId, getToken } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/admin");
  }

  const token = (await getToken()) ?? undefined;
  const currentUser = await fetchQuery(api.users.current, {}, { token });
  if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "super_admin")) {
    // No Convex row (or the wrong role) means no access, even with a valid
    // Clerk session — Admin/Super Admin rows are never auto-provisioned.
    redirect("/");
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Write the Agent Portal layout + placeholder page**

```tsx
// app/(portal)/agent-portal/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { fetchAction, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export default async function AgentPortalLayout({ children }: { children: React.ReactNode }) {
  const { userId, getToken } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/agent-portal");
  }

  const token = (await getToken()) ?? undefined;
  // Provisions the row on an invited Agent's first-ever visit (reads their
  // Clerk public_metadata.role, set by convex/agentInvitations.ts at invite
  // time) — a no-op if the row already exists.
  await fetchAction(api.users.ensureUserProvisioned, {}, { token });

  const currentUser = await fetchQuery(api.users.current, {}, { token });
  if (!currentUser || currentUser.role !== "agent") {
    redirect("/");
  }

  return <>{children}</>;
}
```

```tsx
// app/(portal)/agent-portal/page.tsx
export default function AgentPortalHomePage() {
  return <h1>Agent Portal (placeholder — built out in Phase 4)</h1>;
}
```

- [ ] **Step 3: Write the Client Portal layout + placeholder page**

```tsx
// app/(portal)/client-portal/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { fetchAction, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export default async function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const { userId, getToken } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/client-portal");
  }

  const token = (await getToken()) ?? undefined;
  // Provisions the row on a self-service signup's first-ever visit — the
  // only portal where a missing row is filled in with a default role
  // ("client") rather than denied.
  await fetchAction(api.users.ensureUserProvisioned, {}, { token });

  const currentUser = await fetchQuery(api.users.current, {}, { token });
  if (!currentUser || currentUser.role !== "client") {
    redirect("/");
  }

  return <>{children}</>;
}
```

```tsx
// app/(portal)/client-portal/page.tsx
export default function ClientPortalHomePage() {
  return <h1>Client Portal (placeholder — built out in Phase 4)</h1>;
}
```

- [ ] **Step 4: Manually verify all three role guards**

With no `npx convex dev`/`npm run dev` errors, verify by hand (this logic depends on Next.js Server Components + a live Clerk session, so it isn't `convex-test`/`vitest`-coverable):
- Signed out → `/admin`, `/agent-portal`, `/client-portal` all redirect to `/sign-in`.
- Signed in with no Convex `users` row → `/admin`/`/agent-portal` redirect to `/`; `/client-portal` succeeds and a new `client`-role row appears in the Convex dashboard's `users` table.
- (Once Task 1's manual Super Admin bootstrap is done by the user) signed in as an `admin`/`super_admin` row → `/admin` renders; `/agent-portal`/`/client-portal` redirect to `/`.

- [ ] **Step 5: Do not commit**

Leave all six files uncommitted — no `git add`/`git commit`.

---

### Task 11: Full verification, `.env.example`, `PLAN.md` checkboxes, final review

**Files:**
- Modify: `PLAN.md`

**Interfaces:**
- Consumes: every file from Tasks 1–10.
- Produces: a fully green test suite and an up-to-date `PLAN.md` — the exit criteria for this plan.

- [ ] **Step 1: Run the entire test suite**

Run: `npm run test:once`
Expected: every test file across `convex/` and `lib/validation/` passes, including this phase's new `convex/lib/clerkMetadata.test.ts`, `convex/users.test.ts`, `convex/lib/agentInvitation.test.ts`, `convex/agentInvitations.test.ts`.

- [ ] **Step 2: Run the linter and type-checker**

Run: `npm run lint`
Expected: no errors.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Verify everything is live on the Convex deployment**

Check the running `npx convex dev` terminal's output (or run `npx convex dev --once`) for a clean sync of `auth.config.ts`, `users.ts`, and `agentInvitations.ts` with no errors.

- [ ] **Step 4: Confirm the manual Clerk Dashboard steps are done**

Confirm with the user that Task 1's Clerk Dashboard "activate Convex integration" step and setting `CLERK_JWT_ISSUER_DOMAIN` on the Convex deployment are both complete — sign-in won't actually authenticate against Convex until they are, even though every other step in this plan can be written and tested without them.

- [ ] **Step 5: Update `PLAN.md`'s Phase 2 checklist**

Check off (`- [x]`) every completed item in the Phase 2 section.

- [ ] **Step 6: Do not commit**

Leave `PLAN.md` and every file from Tasks 1–11 uncommitted — no `git add`/`git commit`. Report completion to the user and let them review the full diff before deciding what (if anything) to commit.

---
