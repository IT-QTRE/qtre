# Phase 1 — Data Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define the full Convex schema (13 tables), shared validators, the permission matrix + `requireRole`/`can()` helper, the audit-log helper, and mirrored Zod schemas for form validation — the complete data-model foundation every later phase builds on.

**Architecture:** Shared, composable Convex validators (`LocalizedText`, `SeoFields`, `PublishingFields`, a country-aware `communities` model, and a unified `mediaItems` table) live in `convex/lib/`, imported into a single `convex/schema.ts`. A `propertySharedFactsValidator` is shared between `properties` and `propertySubmissions` via `.fields` spreading so the two can't drift. Authorization is enforced via a `requireRole`/`can()` helper that resolves identity through `ctx.auth.getUserIdentity().tokenIdentifier`, never a client-supplied `userId`. Every Convex table has a mirrored Zod schema under `lib/validation/` for form reuse (Phase 4). All Convex-side logic is tested with `convex-test` + `vitest`; Zod schemas are tested with plain `vitest`.

**Tech Stack:** Convex `1.43.0`, Zod `4.4.3`, `convex-test` + `vitest` + `@edge-runtime/vm` (new devDependencies this phase).

## Global Constraints

- **No agent runs `git add` or `git commit` — ever, for any task.** All changes stay uncommitted in the working tree. Every "Commit" step is replaced by a "Do not commit" note.
- TypeScript `strict: true` is already enabled — every new file must type-check with no `any` (except the deliberately-typed `v.any()` cases, of which this plan has none).
- Convex guidelines (`convex/_generated/ai/guidelines.md`, target `^1.41.0`, this project is on `1.43.0`) apply throughout: no unbounded embedded arrays (hence the unified `mediaItems` table, not embedded `MediaItem[]`), always include argument validators, index fields must appear in the index name, never accept a `userId` as a function argument for authorization — derive identity via `ctx.auth.getUserIdentity()` and match on `identity.tokenIdentifier`.
- Roles are exactly `super_admin | admin | agent | client` per `docs/superpowers/specs/2026-08-07-roles-and-portals-design.md`.
- Communities/media follow `docs/superpowers/specs/2026-08-08-communities-and-media-model.md`: `communities` is a real table with `countryCode`; `properties`/`projects` carry their own `countryCode`/`city` so a listing is valid even without a curated community page; `mediaItems` is one unified table (`entityType`/`entityId` + `order` index), not embedded arrays.
- Leads are split by source: the general Contact page (Phase 5) embeds a GoHighLevel form and never touches Convex — no schema impact from that path. But **property/project-specific inquiries do get their own `leads` table in this schema** (Task 10), because they need real `propertyId`/`projectId`/`agentId` foreign keys to power the admin Leads screen and Agent Portal (Phase 4) — see "GoHighLevel" and "Convex data areas" in `TECH_STACK.md`. `propertySubmissions` (client-submitted properties pending review) is a separate, unrelated concept that also stays in Convex.
- This phase defines schema and pure/helper logic only — no public `query`/`mutation` CRUD endpoints (those are Phase 4) and no Clerk wiring (Phase 2). Tests call helpers directly or via `t.run()`, never via `api.*`/`internal.*` function references, since no functions are registered yet.
- A `npx convex dev` watch process may already be running in another terminal from Phase 0 — check for it (`Get-Content` the relevant terminal, or `Get-Process -Name node`) before starting a second one; if it's already running and watching `convex/`, just check its output for a successful sync after each schema change instead of running `npx convex dev --once` again.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `vitest.config.ts` | Create | Test runner config (`edge-runtime` environment, per Convex testing guidelines) |
| `package.json` | Modify | Add `convex-test`, `vitest`, `@edge-runtime/vm` devDependencies + `test`/`test:once` scripts |
| `convex/lib/localizedText.ts` | Create | `localizedTextValidator` + `LocalizedText` type — reused on every translatable field |
| `convex/lib/seoFields.ts` | Create | `seoFieldsValidator`, `publishingFieldsValidator` — reused on every publishable entity |
| `convex/lib/mediaEntityType.ts` | Create | `mediaEntityTypeValidator` — shared by `schema.ts`'s `mediaItems` table and future mutation args |
| `convex/lib/roles.ts` | Create | `ROLES`, `roleValidator`, `RESOURCES`, `PERMISSION_MATRIX` — resolves the Permission Matrix Open Decision |
| `convex/lib/propertyFacts.ts` | Create | `propertySharedFactsValidator` — the exact field subset shared by `properties` and `propertySubmissions` |
| `convex/schema.ts` | Create | Full Convex schema — all 13 tables, built incrementally across Tasks 6–11 |
| `convex/schema.test.ts` | Create | `convex-test` coverage for table shapes/relationships/indexes, built incrementally alongside `schema.ts` |
| `convex/lib/permissions.ts` | Create | `requireRole`/`can()` — identity resolved via `tokenIdentifier`, never a `userId` argument |
| `convex/lib/permissions.test.ts` | Create | Tests for `requireRole`/`can()` |
| `convex/lib/auditLog.ts` | Create | `writeAuditLog` helper, called from sensitive mutations starting Phase 2 |
| `convex/lib/auditLog.test.ts` | Create | Tests for `writeAuditLog` |
| `lib/validation/shared.ts` | Create | Zod mirrors of `LocalizedText`/`SeoFields`/`PublishingFields` |
| `lib/validation/propertyShared.ts` | Create | Zod mirror of `propertySharedFactsValidator` |
| `lib/validation/properties.ts`, `projects.ts`, `propertySubmissions.ts` | Create | Zod schemas for the three highest-value entities, deriving from the shared pieces above |
| `lib/validation/developers.ts`, `agents.ts`, `communities.ts`, `leads.ts`, `blogPosts.ts`, `users.ts`, `websiteSettings.ts`, `mediaItems.ts` | Create | Zod mirrors for the remaining tables |
| `PLAN.md` | Modify | Check off completed Phase 1 items |

---

### Task 1: Test tooling setup (`convex-test` + `vitest`)

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`
- Create (temporary): `convex/lib/setup.smoke.test.ts` — deleted at the end of Task 6 once real schema-based tests exist

**Interfaces:**
- Consumes: nothing.
- Produces: a working `npm run test`/`npm run test:once` pipeline every later task's tests run through.

- [ ] **Step 1: Install test dependencies**

```bash
npm install --save-dev convex-test vitest @edge-runtime/vm
```

- [ ] **Step 2: Add `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
  },
});
```

- [ ] **Step 3: Add test scripts to `package.json`**

Add these entries to the existing `"scripts"` object (alongside `dev`/`build`/`start`/`lint`):

```json
"test": "vitest",
"test:once": "vitest run",
```

- [ ] **Step 4: Write a smoke test to verify the pipeline**

```ts
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";

test("convex-test + vitest tooling is wired up correctly", async () => {
  const t = convexTest();
  const insertedId = await t.run(async (ctx) => {
    return await ctx.db.insert("scratch", { ok: true });
  });
  const doc = await t.run(async (ctx) => ctx.db.get(insertedId));
  expect(doc).toMatchObject({ ok: true });
});
```

- [ ] **Step 5: Run it**

Run: `npm run test:once`
Expected: `1 passed`.

- [ ] **Step 6: Do not commit**

Leave `vitest.config.ts`, `package.json`, and the smoke test uncommitted — no `git add`/`git commit`.

---

### Task 2: `LocalizedText` validator

**Files:**
- Create: `convex/lib/localizedText.ts`
- Test: `convex/lib/localizedText.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `localizedTextValidator` (a Convex `v.object` validator) and `LocalizedText` (its inferred TS type) — imported by `seoFields.ts` (Task 3) and every translatable field in `schema.ts` (Tasks 7, 9, 10, 11).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { localizedTextValidator } from "./localizedText";

describe("localizedTextValidator", () => {
  it("requires an `en` field and allows optional `ar`/`tr`", () => {
    expect(Object.keys(localizedTextValidator.fields).sort()).toEqual(["ar", "en", "tr"]);
    expect(localizedTextValidator.fields.en.isOptional).toBe("required");
    expect(localizedTextValidator.fields.ar.isOptional).toBe("optional");
    expect(localizedTextValidator.fields.tr.isOptional).toBe("optional");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run convex/lib/localizedText.test.ts`
Expected: FAIL with "Cannot find module './localizedText'" (or similar).

- [ ] **Step 3: Write minimal implementation**

```ts
import { v, type Infer } from "convex/values";

export const localizedTextValidator = v.object({
  en: v.string(),
  ar: v.optional(v.string()),
  tr: v.optional(v.string()),
});

export type LocalizedText = Infer<typeof localizedTextValidator>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run convex/lib/localizedText.test.ts`
Expected: `1 passed`.

- [ ] **Step 5: Do not commit**

Leave `convex/lib/localizedText.ts` and its test uncommitted — no `git add`/`git commit`.

---

### Task 3: `SeoFields` and `PublishingFields` validators

**Files:**
- Create: `convex/lib/seoFields.ts`
- Test: `convex/lib/seoFields.test.ts`

**Interfaces:**
- Consumes: `localizedTextValidator` from `convex/lib/localizedText.ts` (Task 2).
- Produces: `seoFieldsValidator`, `publishingFieldsValidator` (+ `SeoFields`/`PublishingFields` types) — embedded on every publishable entity in `schema.ts` starting Task 7.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { publishingFieldsValidator, seoFieldsValidator } from "./seoFields";

describe("seoFieldsValidator", () => {
  it("has only optional fields", () => {
    expect(seoFieldsValidator.fields.seoTitle.isOptional).toBe("optional");
    expect(seoFieldsValidator.fields.seoDescription.isOptional).toBe("optional");
    expect(seoFieldsValidator.fields.canonicalPath.isOptional).toBe("optional");
  });
});

describe("publishingFieldsValidator", () => {
  it("requires slug/status/updatedAt but not publishedAt", () => {
    expect(publishingFieldsValidator.fields.slug.isOptional).toBe("required");
    expect(publishingFieldsValidator.fields.status.isOptional).toBe("required");
    expect(publishingFieldsValidator.fields.updatedAt.isOptional).toBe("required");
    expect(publishingFieldsValidator.fields.publishedAt.isOptional).toBe("optional");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run convex/lib/seoFields.test.ts`
Expected: FAIL with "Cannot find module './seoFields'".

- [ ] **Step 3: Write minimal implementation**

```ts
import { v, type Infer } from "convex/values";
import { localizedTextValidator } from "./localizedText";

export const seoFieldsValidator = v.object({
  seoTitle: v.optional(localizedTextValidator),
  seoDescription: v.optional(localizedTextValidator),
  canonicalPath: v.optional(v.string()),
});

export type SeoFields = Infer<typeof seoFieldsValidator>;

// Distinct from any entity's own listing/construction status (e.g.
// `properties.listingStatus`) — this is CMS visibility only: draft content
// is never served on the public site regardless of any other status field.
export const publishingFieldsValidator = v.object({
  slug: v.string(),
  status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
  publishedAt: v.optional(v.number()),
  updatedAt: v.number(),
});

export type PublishingFields = Infer<typeof publishingFieldsValidator>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run convex/lib/seoFields.test.ts`
Expected: `2 passed`.

- [ ] **Step 5: Do not commit**

Leave `convex/lib/seoFields.ts` and its test uncommitted — no `git add`/`git commit`.

---

### Task 4: `mediaEntityType` validator

**Files:**
- Create: `convex/lib/mediaEntityType.ts`
- Test: `convex/lib/mediaEntityType.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `mediaEntityTypeValidator` (+ `MediaEntityType` type) — used by `schema.ts`'s `mediaItems` table (Task 8) and, later, Phase 3's upload mutation args.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { mediaEntityTypeValidator } from "./mediaEntityType";

describe("mediaEntityTypeValidator", () => {
  it("covers every entity that can carry attached media", () => {
    const kinds = mediaEntityTypeValidator.members.map((m) => m.value);
    expect(kinds.sort()).toEqual(
      ["agent", "blogPost", "community", "developer", "project", "property", "propertySubmission"].sort(),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run convex/lib/mediaEntityType.test.ts`
Expected: FAIL with "Cannot find module './mediaEntityType'".

- [ ] **Step 3: Write minimal implementation**

```ts
import { v, type Infer } from "convex/values";

export const mediaEntityTypeValidator = v.union(
  v.literal("property"),
  v.literal("project"),
  v.literal("developer"),
  v.literal("agent"),
  v.literal("community"),
  v.literal("blogPost"),
  v.literal("propertySubmission"),
);

export type MediaEntityType = Infer<typeof mediaEntityTypeValidator>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run convex/lib/mediaEntityType.test.ts`
Expected: `1 passed`.

- [ ] **Step 5: Do not commit**

Leave `convex/lib/mediaEntityType.ts` and its test uncommitted — no `git add`/`git commit`.

---

### Task 5: Roles and the permission matrix

**Files:**
- Create: `convex/lib/roles.ts`
- Test: `convex/lib/roles.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `ROLES`, `roleValidator`, `RESOURCES`, `Resource`, `Action`, `PERMISSION_MATRIX`, `can(role, resource, action)` — `roleValidator` is used by `schema.ts`'s `users` table (Task 6); `can()` and the matrix are used by `convex/lib/permissions.ts`'s `requireRole` (Task 12). This resolves the "Permission matrix" Open Decision in `PLAN.md`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { PERMISSION_MATRIX, RESOURCES, ROLES, can } from "./roles";

describe("PERMISSION_MATRIX", () => {
  it("has an entry for every role and every resource", () => {
    for (const role of ROLES) {
      for (const resource of RESOURCES) {
        expect(PERMISSION_MATRIX[role][resource]).toBeInstanceOf(Array);
      }
    }
  });

  it("gives super_admin full access to every resource except read-only auditLogs", () => {
    for (const resource of RESOURCES) {
      const actions = PERMISSION_MATRIX.super_admin[resource];
      if (resource === "auditLogs") {
        expect(actions).toEqual(["read"]);
      } else {
        expect(actions).toEqual(["read", "create", "update", "delete"]);
      }
    }
  });

  it("gives client no access to properties directly, only their own submissions", () => {
    expect(PERMISSION_MATRIX.client.properties).toEqual([]);
    expect(PERMISSION_MATRIX.client.propertySubmissions).toEqual(["read", "create", "update"]);
  });

  it("gives agent read/update on properties and leads but no delete", () => {
    expect(PERMISSION_MATRIX.agent.properties).toEqual(["read", "update"]);
    expect(PERMISSION_MATRIX.agent.leads).toEqual(["read", "update"]);
  });
});

describe("can", () => {
  it("checks the matrix for a given role/resource/action", () => {
    expect(can("admin", "properties", "delete")).toBe(true);
    expect(can("client", "properties", "delete")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run convex/lib/roles.test.ts`
Expected: FAIL with "Cannot find module './roles'".

- [ ] **Step 3: Write minimal implementation**

```ts
import { v, type Infer } from "convex/values";

export const ROLES = ["super_admin", "admin", "agent", "client"] as const;

export const roleValidator = v.union(
  v.literal("super_admin"),
  v.literal("admin"),
  v.literal("agent"),
  v.literal("client"),
);

export type Role = Infer<typeof roleValidator>;

// "leads" here means property/project inquiries only — the general
// Contact page's GoHighLevel form never touches Convex, so it has no
// resource here at all. `propertySubmissions` (client-submitted properties
// pending review) is a separate, unrelated concept.
export const RESOURCES = [
  "properties",
  "projects",
  "developers",
  "agents",
  "communities",
  "leads",
  "propertySubmissions",
  "blogPosts",
  "mediaItems",
  "users",
  "websiteSettings",
  "auditLogs",
] as const;

export type Resource = (typeof RESOURCES)[number];

export type Action = "read" | "create" | "update" | "delete";

// This grid covers *general* role capability per resource. Row-level
// scoping — an Agent editing only their own assigned properties, a Client
// seeing only their own submissions — is enforced separately in
// convex/lib/permissions.ts (Task 12) and Phase 4's queries/mutations via an
// explicit ownership check (e.g. `property.agentId === user._id`), not by
// this matrix alone.
export const PERMISSION_MATRIX: Record<Role, Record<Resource, Action[]>> = {
  super_admin: {
    properties: ["read", "create", "update", "delete"],
    projects: ["read", "create", "update", "delete"],
    developers: ["read", "create", "update", "delete"],
    agents: ["read", "create", "update", "delete"],
    communities: ["read", "create", "update", "delete"],
    leads: ["read", "create", "update", "delete"],
    propertySubmissions: ["read", "create", "update", "delete"],
    blogPosts: ["read", "create", "update", "delete"],
    mediaItems: ["read", "create", "update", "delete"],
    users: ["read", "create", "update", "delete"],
    websiteSettings: ["read", "create", "update", "delete"],
    auditLogs: ["read"],
  },
  admin: {
    properties: ["read", "create", "update", "delete"],
    projects: ["read", "create", "update", "delete"],
    developers: ["read", "create", "update", "delete"],
    agents: ["read", "create", "update", "delete"],
    communities: ["read", "create", "update", "delete"],
    leads: ["read", "create", "update", "delete"],
    propertySubmissions: ["read", "create", "update", "delete"],
    blogPosts: ["read", "create", "update", "delete"],
    mediaItems: ["read", "create", "update", "delete"],
    // Cannot delete user records, and cannot create/manage other Admin
    // accounts (Super Admin only per the roles/portals spec) — that
    // narrower restriction is enforced in Phase 2's user-management
    // mutations, not expressible in this per-resource grid.
    users: ["read", "create", "update"],
    websiteSettings: ["read", "update"],
    auditLogs: ["read"],
  },
  agent: {
    properties: ["read", "update"],
    projects: ["read", "update"],
    developers: ["read"],
    agents: ["read"],
    communities: ["read"],
    leads: ["read", "update"],
    propertySubmissions: ["read", "update"],
    blogPosts: [],
    mediaItems: ["read", "create", "update", "delete"],
    users: [],
    websiteSettings: [],
    auditLogs: [],
  },
  client: {
    properties: [],
    projects: [],
    developers: [],
    agents: [],
    communities: ["read"],
    leads: [],
    propertySubmissions: ["read", "create", "update"],
    blogPosts: [],
    mediaItems: ["read", "create"],
    users: [],
    websiteSettings: [],
    auditLogs: [],
  },
};

export function can(role: Role, resource: Resource, action: Action): boolean {
  return PERMISSION_MATRIX[role][resource].includes(action);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run convex/lib/roles.test.ts`
Expected: `5 passed`.

- [ ] **Step 5: Do not commit**

Leave `convex/lib/roles.ts` and its test uncommitted — no `git add`/`git commit`.

---

### Task 6: Schema — `users` and `auditLogs`

**Files:**
- Create: `convex/schema.ts`
- Create: `convex/schema.test.ts`
- Delete: `convex/lib/setup.smoke.test.ts` (superseded — real schema-based tests exist from this task on)

**Interfaces:**
- Consumes: `roleValidator` from `convex/lib/roles.ts` (Task 5).
- Produces: the `users` table (with `by_token_identifier` — the index `convex/lib/permissions.ts` will query in Task 12 — and `by_role`) and `auditLogs` table. These two are defined first, before any other table, because `agents.userId` (Task 7) and `blogPosts.authorUserId` (Task 10) both reference `v.id("users")`, and `auditLogs.actorUserId` does too.

These two tables go first specifically to avoid forward-reference errors: Convex requires every `v.id("<table>")` to reference a table that exists somewhere in the same `defineSchema({...})` call, and since this plan builds `schema.ts` up incrementally task-by-task, any table referenced via `v.id()` must already be present in the file *at the time of that reference*.

- [ ] **Step 1: Delete the Task 1 smoke test**

```bash
Remove-Item convex/lib/setup.smoke.test.ts
```

- [ ] **Step 2: Write the failing test**

```ts
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("users table", () => {
  test("inserts a user and looks it up by tokenIdentifier", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        tokenIdentifier: "clerk|user-1",
        email: "user1@example.com",
        name: "User One",
        role: "admin",
        createdAt: Date.now(),
      });
    });

    const found = await t.run(async (ctx) => {
      return await ctx.db
        .query("users")
        .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", "clerk|user-1"))
        .unique();
    });

    expect(found?._id).toBe(userId);
  });
});

describe("auditLogs table", () => {
  test("records an action against an actor", async () => {
    const t = convexTest(schema, modules);
    const actorUserId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        tokenIdentifier: "clerk|admin-1",
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
        createdAt: Date.now(),
      });
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("auditLogs", {
        actorUserId,
        resource: "properties",
        action: "delete",
        createdAt: Date.now(),
      });
    });

    const logs = await t.run(async (ctx) => {
      return await ctx.db
        .query("auditLogs")
        .withIndex("by_actor", (q) => q.eq("actorUserId", actorUserId))
        .collect();
    });

    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe("delete");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run convex/schema.test.ts`
Expected: FAIL with "Cannot find module './schema'".

- [ ] **Step 4: Write minimal implementation**

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { roleValidator } from "./lib/roles";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.string(),
    name: v.string(),
    role: roleValidator,
    createdAt: v.number(),
  })
    .index("by_token_identifier", ["tokenIdentifier"])
    .index("by_role", ["role"]),

  auditLogs: defineTable({
    actorUserId: v.id("users"),
    resource: v.string(),
    action: v.string(),
    targetId: v.optional(v.string()),
    details: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_actor", ["actorUserId"])
    .index("by_created_at", ["createdAt"]),
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run convex/schema.test.ts`
Expected: `2 passed`.

- [ ] **Step 6: Verify the schema pushes to the real Convex deployment**

If a `npx convex dev` watch process is already running (from Phase 0), check its terminal output for a successful sync with no errors after saving `schema.ts`. Otherwise run: `npx convex dev --once`
Expected: no schema validation errors.

- [ ] **Step 7: Do not commit**

Leave `convex/schema.ts` and `convex/schema.test.ts` uncommitted — no `git add`/`git commit`.

---

### Task 7: Schema — `developers`, `agents`, `communities`

**Files:**
- Modify: `convex/schema.ts`
- Modify: `convex/schema.test.ts`

**Interfaces:**
- Consumes: `localizedTextValidator` (Task 2), `seoFieldsValidator`/`publishingFieldsValidator` (Task 3), the `users` table (Task 6, for `agents.userId`).
- Produces: `developers`, `agents`, `communities` tables. `communities.countryCode` + `by_country_and_slug` index are the country-aware design from `docs/superpowers/specs/2026-08-08-communities-and-media-model.md` — this is what lets a second country be added later without a schema change.

- [ ] **Step 1: Add tests for the three new tables**

Append to `convex/schema.test.ts` (after the existing `describe` blocks):

```ts
describe("developers table", () => {
  test("inserts a developer with a localized name and publishing fields", async () => {
    const t = convexTest(schema, modules);
    const developerId = await t.run(async (ctx) => {
      return await ctx.db.insert("developers", {
        name: { en: "Emaar Properties", ar: "إعمار العقارية" },
        publishing: { slug: "emaar-properties", status: "published", updatedAt: Date.now() },
      });
    });
    const found = await t.run(async (ctx) => ctx.db.get(developerId));
    expect(found?.name.en).toBe("Emaar Properties");
  });
});

describe("agents table", () => {
  test("links an agent to a users row via userId", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        tokenIdentifier: "clerk|agent-1",
        email: "agent1@example.com",
        name: "Agent One",
        role: "agent",
        createdAt: Date.now(),
      });
    });
    await t.run(async (ctx) => {
      await ctx.db.insert("agents", {
        name: "Agent One",
        email: "agent1@example.com",
        userId,
        publishing: { slug: "agent-one", status: "published", updatedAt: Date.now() },
      });
    });
    const found = await t.run(async (ctx) => {
      return await ctx.db.query("agents").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    });
    expect(found?.name).toBe("Agent One");
  });
});

describe("communities table", () => {
  test("is queryable by countryCode + slug together", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("communities", {
        name: { en: "Dubai Marina", ar: "دبي مارينا" },
        city: { en: "Dubai", ar: "دبي" },
        countryCode: "AE",
        publishing: { slug: "dubai-marina", status: "published", updatedAt: Date.now() },
      });
    });
    const found = await t.run(async (ctx) => {
      return await ctx.db
        .query("communities")
        .withIndex("by_country_and_slug", (q) => q.eq("countryCode", "AE").eq("publishing.slug", "dubai-marina"))
        .unique();
    });
    expect(found?.name.en).toBe("Dubai Marina");
  });

  test("supports a second country's communities with no schema change", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("communities", {
        name: { en: "Sukhumvit" },
        city: { en: "Bangkok" },
        countryCode: "TH",
        publishing: { slug: "sukhumvit", status: "published", updatedAt: Date.now() },
      });
    });
    const found = await t.run(async (ctx) => {
      return await ctx.db
        .query("communities")
        .withIndex("by_country_and_slug", (q) => q.eq("countryCode", "TH").eq("publishing.slug", "sukhumvit"))
        .unique();
    });
    expect(found?.city.en).toBe("Bangkok");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run convex/schema.test.ts`
Expected: FAIL — `developers`/`agents`/`communities` are not yet valid table names in the schema.

- [ ] **Step 3: Add the three tables to `convex/schema.ts`**

Full resulting file:

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { localizedTextValidator } from "./lib/localizedText";
import { seoFieldsValidator, publishingFieldsValidator } from "./lib/seoFields";
import { roleValidator } from "./lib/roles";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.string(),
    name: v.string(),
    role: roleValidator,
    createdAt: v.number(),
  })
    .index("by_token_identifier", ["tokenIdentifier"])
    .index("by_role", ["role"]),

  auditLogs: defineTable({
    actorUserId: v.id("users"),
    resource: v.string(),
    action: v.string(),
    targetId: v.optional(v.string()),
    details: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_actor", ["actorUserId"])
    .index("by_created_at", ["createdAt"]),

  developers: defineTable({
    name: localizedTextValidator,
    description: v.optional(localizedTextValidator),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    seo: v.optional(seoFieldsValidator),
    publishing: publishingFieldsValidator,
  })
    .index("by_publishing_slug", ["publishing.slug"])
    .index("by_publishing_status", ["publishing.status"]),

  // `name` is a plain string, not LocalizedText — a person's proper name
  // isn't translated (mirrors how Developer names could be, but people's
  // names generally aren't).
  agents: defineTable({
    name: v.string(),
    bio: v.optional(localizedTextValidator),
    email: v.string(),
    phone: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    seo: v.optional(seoFieldsValidator),
    publishing: publishingFieldsValidator,
  })
    .index("by_publishing_slug", ["publishing.slug"])
    .index("by_user", ["userId"]),

  communities: defineTable({
    name: localizedTextValidator,
    city: localizedTextValidator,
    countryCode: v.string(),
    description: v.optional(localizedTextValidator),
    seo: v.optional(seoFieldsValidator),
    publishing: publishingFieldsValidator,
  }).index("by_country_and_slug", ["countryCode", "publishing.slug"]),
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run convex/schema.test.ts`
Expected: `6 passed`.

- [ ] **Step 5: Verify the schema pushes to the real Convex deployment**

Same as Task 6, Step 6 — check the running `npx convex dev` output, or run `npx convex dev --once`.
Expected: no schema validation errors.

- [ ] **Step 6: Do not commit**

Leave `convex/schema.ts`/`convex/schema.test.ts` uncommitted — no `git add`/`git commit`.

---

### Task 8: Schema — `mediaItems`

**Files:**
- Modify: `convex/schema.ts`
- Modify: `convex/schema.test.ts`

**Interfaces:**
- Consumes: `mediaEntityTypeValidator` (Task 4), `localizedTextValidator` (Task 2).
- Produces: the unified `mediaItems` table per `docs/superpowers/specs/2026-08-08-communities-and-media-model.md` — `entityId` is a plain `v.string()`, not a `v.id()`, because it must accept IDs from any of seven different tables (polymorphic reference); the `by_entity` index (`entityType`, `entityId`, `order`) is what backs both "media for entity X" (Phase 3 uploads) and "the whole media library" (Phase 4's library screen) queries.

- [ ] **Step 1: Add a test**

Append to `convex/schema.test.ts`:

```ts
describe("mediaItems table", () => {
  test("orders items for one entity via the by_entity index, independent of other entities", async () => {
    const t = convexTest(schema, modules);
    const developerId = await t.run(async (ctx) => {
      return await ctx.db.insert("developers", {
        name: { en: "Emaar Properties" },
        publishing: { slug: "emaar-properties", status: "published", updatedAt: Date.now() },
      });
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("mediaItems", {
        entityType: "developer",
        entityId: developerId,
        url: "https://example.com/logo.png",
        pathname: "developers/emaar/logo.png",
        order: 0,
        mimeType: "image/png",
      });
      // A second, unrelated entity's media must not show up in the query below.
      await ctx.db.insert("mediaItems", {
        entityType: "community",
        entityId: "some-other-id",
        url: "https://example.com/hero.png",
        pathname: "communities/dubai-marina/hero.png",
        order: 0,
        mimeType: "image/png",
      });
    });

    const developerMedia = await t.run(async (ctx) => {
      return await ctx.db
        .query("mediaItems")
        .withIndex("by_entity", (q) => q.eq("entityType", "developer").eq("entityId", developerId))
        .collect();
    });

    expect(developerMedia).toHaveLength(1);
    expect(developerMedia[0].url).toBe("https://example.com/logo.png");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run convex/schema.test.ts`
Expected: FAIL — `mediaItems` is not yet a valid table name.

- [ ] **Step 3: Add `mediaItems` to `convex/schema.ts`**

Add the import and table (full resulting file):

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { localizedTextValidator } from "./lib/localizedText";
import { seoFieldsValidator, publishingFieldsValidator } from "./lib/seoFields";
import { mediaEntityTypeValidator } from "./lib/mediaEntityType";
import { roleValidator } from "./lib/roles";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.string(),
    name: v.string(),
    role: roleValidator,
    createdAt: v.number(),
  })
    .index("by_token_identifier", ["tokenIdentifier"])
    .index("by_role", ["role"]),

  auditLogs: defineTable({
    actorUserId: v.id("users"),
    resource: v.string(),
    action: v.string(),
    targetId: v.optional(v.string()),
    details: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_actor", ["actorUserId"])
    .index("by_created_at", ["createdAt"]),

  developers: defineTable({
    name: localizedTextValidator,
    description: v.optional(localizedTextValidator),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    seo: v.optional(seoFieldsValidator),
    publishing: publishingFieldsValidator,
  })
    .index("by_publishing_slug", ["publishing.slug"])
    .index("by_publishing_status", ["publishing.status"]),

  agents: defineTable({
    name: v.string(),
    bio: v.optional(localizedTextValidator),
    email: v.string(),
    phone: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    seo: v.optional(seoFieldsValidator),
    publishing: publishingFieldsValidator,
  })
    .index("by_publishing_slug", ["publishing.slug"])
    .index("by_user", ["userId"]),

  communities: defineTable({
    name: localizedTextValidator,
    city: localizedTextValidator,
    countryCode: v.string(),
    description: v.optional(localizedTextValidator),
    seo: v.optional(seoFieldsValidator),
    publishing: publishingFieldsValidator,
  }).index("by_country_and_slug", ["countryCode", "publishing.slug"]),

  mediaItems: defineTable({
    entityType: mediaEntityTypeValidator,
    entityId: v.string(),
    url: v.string(),
    pathname: v.string(),
    alt: v.optional(localizedTextValidator),
    order: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    mimeType: v.string(),
  }).index("by_entity", ["entityType", "entityId", "order"]),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run convex/schema.test.ts`
Expected: `7 passed`.

- [ ] **Step 5: Verify the schema pushes to the real Convex deployment**

Same as Task 6, Step 6.

- [ ] **Step 6: Do not commit**

Leave `convex/schema.ts`/`convex/schema.test.ts` uncommitted — no `git add`/`git commit`.

---

### Task 9: `propertySharedFacts` + `properties` + `projects`

**Files:**
- Create: `convex/lib/propertyFacts.ts`
- Test: `convex/lib/propertyFacts.test.ts`
- Modify: `convex/schema.ts`
- Modify: `convex/schema.test.ts`

**Interfaces:**
- Consumes: `localizedTextValidator` (Task 2), `seoFieldsValidator`/`publishingFieldsValidator` (Task 3), `developers`/`agents`/`communities` tables (Task 7).
- Produces: `propertySharedFactsValidator` — the exact field subset shared verbatim between `properties` and `propertySubmissions` (Task 11 spreads `.fields` from this same constant, so the two tables can't drift apart) — plus the `properties` and `projects` tables. `properties.sourceSubmissionId` is deliberately **not** added yet — it references `propertySubmissions`, which doesn't exist until Task 11; adding it now would be a forward reference to a table that isn't in the schema yet. Task 11 adds it as a schema modification once `propertySubmissions` exists, resolving what would otherwise be a circular dependency between the two tables.

- [ ] **Step 1: Write the failing test for `propertyFacts.ts`**

```ts
import { describe, expect, it } from "vitest";
import { propertySharedFactsValidator } from "./propertyFacts";

describe("propertySharedFactsValidator", () => {
  it("only contains facts that are identical in shape for an owner submission and an admin-curated listing", () => {
    expect(Object.keys(propertySharedFactsValidator.fields).sort()).toEqual(
      ["areaSqft", "bathrooms", "bedrooms", "countryCode", "price"].sort(),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run convex/lib/propertyFacts.test.ts`
Expected: FAIL with "Cannot find module './propertyFacts'".

- [ ] **Step 3: Write `convex/lib/propertyFacts.ts`**

```ts
import { v, type Infer } from "convex/values";

// Fields shared verbatim between `properties` (admin-curated, published) and
// `propertySubmissions` (client-submitted, pending review) — the exact
// subset of a property's facts that a property owner can supply themselves.
// Defined once so the two tables' `defineTable()` calls can both spread
// `.fields` from this constant instead of duplicating field definitions.
// Translated fields (title/description/city) are NOT here even though both
// tables have them — a client submission's are plain strings (single
// language, as typed by the owner), while a published property's are
// LocalizedText (translated by staff on approval), so those two shapes
// genuinely differ and can't be shared.
export const propertySharedFactsValidator = v.object({
  price: v.number(),
  bedrooms: v.number(),
  bathrooms: v.number(),
  areaSqft: v.number(),
  countryCode: v.string(),
});

export type PropertySharedFacts = Infer<typeof propertySharedFactsValidator>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run convex/lib/propertyFacts.test.ts`
Expected: `1 passed`.

- [ ] **Step 5: Add tests for `properties` and `projects` to `convex/schema.test.ts`**

Append:

```ts
describe("projects table", () => {
  test("references a developer and an optional community", async () => {
    const t = convexTest(schema, modules);
    const developerId = await t.run(async (ctx) => {
      return await ctx.db.insert("developers", {
        name: { en: "Emaar Properties" },
        publishing: { slug: "emaar-properties", status: "published", updatedAt: Date.now() },
      });
    });
    const communityId = await t.run(async (ctx) => {
      return await ctx.db.insert("communities", {
        name: { en: "Dubai Marina" },
        city: { en: "Dubai" },
        countryCode: "AE",
        publishing: { slug: "dubai-marina", status: "published", updatedAt: Date.now() },
      });
    });
    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        title: { en: "Marina Heights" },
        description: { en: "A waterfront tower." },
        developerId,
        communityId,
        countryCode: "AE",
        city: { en: "Dubai" },
        status: "under_construction",
        publishing: { slug: "marina-heights", status: "published", updatedAt: Date.now() },
      });
    });
    const byDeveloper = await t.run(async (ctx) => {
      return await ctx.db.query("projects").withIndex("by_developer", (q) => q.eq("developerId", developerId)).collect();
    });
    expect(byDeveloper.map((p) => p._id)).toContain(projectId);
  });
});

describe("properties table", () => {
  test("stores shared facts alongside translated content and optional relationships", async () => {
    const t = convexTest(schema, modules);
    const agentId = await t.run(async (ctx) => {
      return await ctx.db.insert("agents", {
        name: "Agent One",
        email: "agent1@example.com",
        publishing: { slug: "agent-one", status: "published", updatedAt: Date.now() },
      });
    });
    const propertyId = await t.run(async (ctx) => {
      return await ctx.db.insert("properties", {
        price: 2_500_000,
        bedrooms: 3,
        bathrooms: 2,
        areaSqft: 1800,
        countryCode: "AE",
        title: { en: "Marina View Apartment" },
        description: { en: "A stunning apartment with marina views." },
        city: { en: "Dubai" },
        listingStatus: "for_sale",
        agentId,
        publishing: { slug: "marina-view-apartment", status: "published", updatedAt: Date.now() },
      });
    });
    const byAgent = await t.run(async (ctx) => {
      return await ctx.db.query("properties").withIndex("by_agent", (q) => q.eq("agentId", agentId)).collect();
    });
    expect(byAgent.map((p) => p._id)).toContain(propertyId);
    const found = await t.run(async (ctx) => ctx.db.get(propertyId));
    expect(found?.price).toBe(2_500_000);
    expect(found?.title.en).toBe("Marina View Apartment");
  });
});
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `npx vitest run convex/schema.test.ts`
Expected: FAIL — `properties`/`projects` are not yet valid table names.

- [ ] **Step 7: Add `properties` and `projects` to `convex/schema.ts`**

Full resulting file:

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { localizedTextValidator } from "./lib/localizedText";
import { seoFieldsValidator, publishingFieldsValidator } from "./lib/seoFields";
import { mediaEntityTypeValidator } from "./lib/mediaEntityType";
import { roleValidator } from "./lib/roles";
import { propertySharedFactsValidator } from "./lib/propertyFacts";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.string(),
    name: v.string(),
    role: roleValidator,
    createdAt: v.number(),
  })
    .index("by_token_identifier", ["tokenIdentifier"])
    .index("by_role", ["role"]),

  auditLogs: defineTable({
    actorUserId: v.id("users"),
    resource: v.string(),
    action: v.string(),
    targetId: v.optional(v.string()),
    details: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_actor", ["actorUserId"])
    .index("by_created_at", ["createdAt"]),

  developers: defineTable({
    name: localizedTextValidator,
    description: v.optional(localizedTextValidator),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    seo: v.optional(seoFieldsValidator),
    publishing: publishingFieldsValidator,
  })
    .index("by_publishing_slug", ["publishing.slug"])
    .index("by_publishing_status", ["publishing.status"]),

  agents: defineTable({
    name: v.string(),
    bio: v.optional(localizedTextValidator),
    email: v.string(),
    phone: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    seo: v.optional(seoFieldsValidator),
    publishing: publishingFieldsValidator,
  })
    .index("by_publishing_slug", ["publishing.slug"])
    .index("by_user", ["userId"]),

  communities: defineTable({
    name: localizedTextValidator,
    city: localizedTextValidator,
    countryCode: v.string(),
    description: v.optional(localizedTextValidator),
    seo: v.optional(seoFieldsValidator),
    publishing: publishingFieldsValidator,
  }).index("by_country_and_slug", ["countryCode", "publishing.slug"]),

  mediaItems: defineTable({
    entityType: mediaEntityTypeValidator,
    entityId: v.string(),
    url: v.string(),
    pathname: v.string(),
    alt: v.optional(localizedTextValidator),
    order: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    mimeType: v.string(),
  }).index("by_entity", ["entityType", "entityId", "order"]),

  projects: defineTable({
    title: localizedTextValidator,
    description: localizedTextValidator,
    developerId: v.id("developers"),
    communityId: v.optional(v.id("communities")),
    countryCode: v.string(),
    city: localizedTextValidator,
    status: v.union(v.literal("upcoming"), v.literal("under_construction"), v.literal("completed")),
    startingPrice: v.optional(v.number()),
    coordinates: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    amenities: v.optional(v.array(v.string())),
    seo: v.optional(seoFieldsValidator),
    publishing: publishingFieldsValidator,
  })
    .index("by_developer", ["developerId"])
    .index("by_community", ["communityId"])
    .index("by_publishing_slug", ["publishing.slug"])
    .index("by_publishing_status", ["publishing.status"]),

  properties: defineTable({
    ...propertySharedFactsValidator.fields,
    title: localizedTextValidator,
    description: localizedTextValidator,
    city: localizedTextValidator,
    coordinates: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    listingStatus: v.union(
      v.literal("for_sale"),
      v.literal("for_rent"),
      v.literal("sold"),
      v.literal("rented"),
      v.literal("off_market"),
    ),
    amenities: v.optional(v.array(v.string())),
    communityId: v.optional(v.id("communities")),
    developerId: v.optional(v.id("developers")),
    projectId: v.optional(v.id("projects")),
    agentId: v.optional(v.id("agents")),
    seo: v.optional(seoFieldsValidator),
    publishing: publishingFieldsValidator,
  })
    .index("by_agent", ["agentId"])
    .index("by_project", ["projectId"])
    .index("by_developer", ["developerId"])
    .index("by_community", ["communityId"])
    .index("by_publishing_slug", ["publishing.slug"])
    .index("by_listing_status", ["listingStatus"]),
});
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npx vitest run convex/schema.test.ts`
Expected: `9 passed`.

- [ ] **Step 9: Verify the schema pushes to the real Convex deployment**

Same as Task 6, Step 6.

- [ ] **Step 10: Do not commit**

Leave all modified/created files uncommitted — no `git add`/`git commit`.

---

### Task 10: Schema — `leads`, `blogPosts`, `websiteSettings`

**Files:**
- Modify: `convex/schema.ts`
- Modify: `convex/schema.test.ts`

**Interfaces:**
- Consumes: `properties`/`projects`/`agents` tables (for `leads`' relationships), `users` table (for `blogPosts.authorUserId`), `seoFieldsValidator` (Task 3).
- Produces: `leads`, `blogPosts`, `websiteSettings` tables. `leads` is for property/project inquiries only ("Contact this agent about this listing," Phase 5) — the general Contact page's GoHighLevel form never reaches Convex, so it has no row here; see "GoHighLevel" in `TECH_STACK.md`. `websiteSettings` is a concrete-shape singleton table (one row per deployment) rather than a generic key/value store — Convex guidelines discourage `v.any()`, and the site only has a small, known set of settings today.

- [ ] **Step 1: Add tests**

Append to `convex/schema.test.ts`:

```ts
describe("leads table", () => {
  test("can be filtered by status via an index, and optionally links to a property/project/agent", async () => {
    const t = convexTest(schema, modules);
    const agentId = await t.run(async (ctx) => {
      return await ctx.db.insert("agents", {
        name: "Agent One",
        email: "agent1@example.com",
        publishing: { slug: "agent-one", status: "published", updatedAt: Date.now() },
      });
    });
    const propertyId = await t.run(async (ctx) => {
      return await ctx.db.insert("properties", {
        price: 2_500_000,
        bedrooms: 3,
        bathrooms: 2,
        areaSqft: 1800,
        countryCode: "AE",
        title: { en: "Marina View Apartment" },
        description: { en: "A stunning apartment with marina views." },
        city: { en: "Dubai" },
        listingStatus: "for_sale",
        agentId,
        publishing: { slug: "marina-view-apartment", status: "published", updatedAt: Date.now() },
      });
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("leads", {
        name: "Jane Buyer",
        email: "jane@example.com",
        propertyId,
        status: "new",
        assignedAgentId: agentId,
        createdAt: Date.now(),
      });
    });

    const newLeads = await t.run(async (ctx) => {
      return await ctx.db.query("leads").withIndex("by_status", (q) => q.eq("status", "new")).collect();
    });
    expect(newLeads).toHaveLength(1);
    expect(newLeads[0].propertyId).toBe(propertyId);

    const assignedToAgent = await t.run(async (ctx) => {
      return await ctx.db
        .query("leads")
        .withIndex("by_assigned_agent", (q) => q.eq("assignedAgentId", agentId))
        .collect();
    });
    expect(assignedToAgent).toHaveLength(1);
  });
});

describe("blogPosts table", () => {
  test("requires an authorUserId referencing users", async () => {
    const t = convexTest(schema, modules);
    const authorUserId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        tokenIdentifier: "clerk|author-1",
        email: "author1@example.com",
        name: "Author One",
        role: "admin",
        createdAt: Date.now(),
      });
    });
    const postId = await t.run(async (ctx) => {
      return await ctx.db.insert("blogPosts", {
        title: { en: "Dubai Market Update" },
        body: { en: "The market is..." },
        authorUserId,
        publishing: { slug: "dubai-market-update", status: "published", updatedAt: Date.now() },
      });
    });
    const byAuthor = await t.run(async (ctx) => {
      return await ctx.db.query("blogPosts").withIndex("by_author", (q) => q.eq("authorUserId", authorUserId)).collect();
    });
    expect(byAuthor.map((p) => p._id)).toContain(postId);
  });
});

describe("websiteSettings table", () => {
  test("stores a single settings document with structured fields", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("websiteSettings", {
        siteName: "QuickTalk Real Estate",
        contactEmail: "hello@qtre.ae",
        socialLinks: { instagram: "https://instagram.com/qtre" },
        updatedAt: Date.now(),
      });
    });
    const settings = await t.run(async (ctx) => ctx.db.query("websiteSettings").first());
    expect(settings?.siteName).toBe("QuickTalk Real Estate");
    expect(settings?.socialLinks?.instagram).toBe("https://instagram.com/qtre");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run convex/schema.test.ts`
Expected: FAIL — `leads`/`blogPosts`/`websiteSettings` are not yet valid table names.

- [ ] **Step 3: Add the three tables to `convex/schema.ts`**

Add these three table definitions inside the existing `defineSchema({...})` call, after `properties` (no new imports needed — everything they use is already imported):

```ts
  leads: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    message: v.optional(v.string()),
    propertyId: v.optional(v.id("properties")),
    projectId: v.optional(v.id("projects")),
    status: v.union(v.literal("new"), v.literal("contacted"), v.literal("qualified"), v.literal("closed")),
    assignedAgentId: v.optional(v.id("agents")),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_assigned_agent", ["assignedAgentId"]),

  blogPosts: defineTable({
    title: localizedTextValidator,
    body: localizedTextValidator,
    authorUserId: v.id("users"),
    seo: v.optional(seoFieldsValidator),
    publishing: publishingFieldsValidator,
  })
    .index("by_publishing_slug", ["publishing.slug"])
    .index("by_author", ["authorUserId"]),

  websiteSettings: defineTable({
    siteName: v.string(),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    socialLinks: v.optional(
      v.object({
        facebook: v.optional(v.string()),
        instagram: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        twitter: v.optional(v.string()),
      }),
    ),
    defaultSeo: v.optional(seoFieldsValidator),
    updatedAt: v.number(),
  }),
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run convex/schema.test.ts`
Expected: `12 passed`.

- [ ] **Step 5: Verify the schema pushes to the real Convex deployment**

Same as Task 6, Step 6.

- [ ] **Step 6: Do not commit**

Leave `convex/schema.ts`/`convex/schema.test.ts` uncommitted — no `git add`/`git commit`.

---

### Task 11: Schema — `propertySubmissions` + `properties.sourceSubmissionId`

**Files:**
- Modify: `convex/schema.ts`
- Modify: `convex/schema.test.ts`

**Interfaces:**
- Consumes: `users` table (`clientId`/`assignedReviewerId`), `properties` table (`convertedPropertyId`), `propertySharedFactsValidator` (Task 9).
- Produces: the `propertySubmissions` table, and adds `properties.sourceSubmissionId` (deferred from Task 9 — see that task's note). This closes out the "List Your Property" data model from `docs/superpowers/specs/2026-08-07-roles-and-portals-design.md`.

- [ ] **Step 1: Add tests**

Append to `convex/schema.test.ts`:

```ts
describe("propertySubmissions table", () => {
  test("supports the full pending -> approved lifecycle with a back-reference to the created property", async () => {
    const t = convexTest(schema, modules);
    const clientId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        tokenIdentifier: "clerk|client-1",
        email: "owner@example.com",
        name: "Property Owner",
        role: "client",
        createdAt: Date.now(),
      });
    });
    const reviewerId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        tokenIdentifier: "clerk|agent-2",
        email: "agent2@example.com",
        name: "Reviewing Agent",
        role: "agent",
        createdAt: Date.now(),
      });
    });

    const submissionId = await t.run(async (ctx) => {
      return await ctx.db.insert("propertySubmissions", {
        clientId,
        assignedReviewerId: reviewerId,
        price: 1_800_000,
        bedrooms: 2,
        bathrooms: 2,
        areaSqft: 1200,
        countryCode: "AE",
        title: "My apartment in JBR",
        description: "Sea view, high floor.",
        city: "Dubai",
        status: "under_review",
        submittedAt: Date.now(),
      });
    });

    const propertyId = await t.run(async (ctx) => {
      return await ctx.db.insert("properties", {
        price: 1_800_000,
        bedrooms: 2,
        bathrooms: 2,
        areaSqft: 1200,
        countryCode: "AE",
        title: { en: "Apartment in JBR" },
        description: { en: "Sea view, high floor." },
        city: { en: "Dubai" },
        listingStatus: "for_sale",
        sourceSubmissionId: submissionId,
        publishing: { slug: "apartment-in-jbr", status: "published", updatedAt: Date.now() },
      });
    });

    await t.run(async (ctx) => {
      await ctx.db.patch(submissionId, {
        status: "approved",
        convertedPropertyId: propertyId,
        reviewedAt: Date.now(),
      });
    });

    const approved = await t.run(async (ctx) => ctx.db.get(submissionId));
    expect(approved?.status).toBe("approved");
    expect(approved?.convertedPropertyId).toBe(propertyId);

    const createdProperty = await t.run(async (ctx) => ctx.db.get(propertyId));
    expect(createdProperty?.sourceSubmissionId).toBe(submissionId);
  });

  test("records a rejection reason for the rejected path", async () => {
    const t = convexTest(schema, modules);
    const clientId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        tokenIdentifier: "clerk|client-2",
        email: "owner2@example.com",
        name: "Another Owner",
        role: "client",
        createdAt: Date.now(),
      });
    });
    const submissionId = await t.run(async (ctx) => {
      return await ctx.db.insert("propertySubmissions", {
        clientId,
        price: 500_000,
        bedrooms: 1,
        bathrooms: 1,
        areaSqft: 600,
        countryCode: "AE",
        title: "Studio",
        description: "A studio.",
        city: "Sharjah",
        status: "pending",
        submittedAt: Date.now(),
      });
    });
    await t.run(async (ctx) => {
      await ctx.db.patch(submissionId, {
        status: "rejected",
        rejectionReason: "Missing title deed documentation.",
        reviewedAt: Date.now(),
      });
    });
    const rejected = await t.run(async (ctx) => ctx.db.get(submissionId));
    expect(rejected?.status).toBe("rejected");
    expect(rejected?.rejectionReason).toBe("Missing title deed documentation.");
  });

  test("can be listed by assigned reviewer", async () => {
    const t = convexTest(schema, modules);
    const clientId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        tokenIdentifier: "clerk|client-3",
        email: "owner3@example.com",
        name: "Owner Three",
        role: "client",
        createdAt: Date.now(),
      });
    });
    const reviewerId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        tokenIdentifier: "clerk|agent-3",
        email: "agent3@example.com",
        name: "Agent Three",
        role: "agent",
        createdAt: Date.now(),
      });
    });
    await t.run(async (ctx) => {
      await ctx.db.insert("propertySubmissions", {
        clientId,
        assignedReviewerId: reviewerId,
        price: 900_000,
        bedrooms: 2,
        bathrooms: 1,
        areaSqft: 950,
        countryCode: "AE",
        title: "Family home",
        description: "Nice place.",
        city: "Abu Dhabi",
        status: "under_review",
        submittedAt: Date.now(),
      });
    });
    const assigned = await t.run(async (ctx) => {
      return await ctx.db
        .query("propertySubmissions")
        .withIndex("by_assigned_reviewer", (q) => q.eq("assignedReviewerId", reviewerId))
        .collect();
    });
    expect(assigned).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run convex/schema.test.ts`
Expected: FAIL — `propertySubmissions` is not yet a valid table name, and `properties.sourceSubmissionId` doesn't exist yet.

- [ ] **Step 3: Add `propertySubmissions` and `properties.sourceSubmissionId` to `convex/schema.ts`**

In the `properties` table definition, add one field right after `agentId`:

```ts
    // Added now (not in Task 9) because it references `propertySubmissions`,
    // defined for the first time just below in this same file.
    sourceSubmissionId: v.optional(v.id("propertySubmissions")),
```

Then add a new `propertySubmissions` table at the end of the `defineSchema({...})` call, after `websiteSettings`:

```ts
  propertySubmissions: defineTable({
    ...propertySharedFactsValidator.fields,
    clientId: v.id("users"),
    assignedReviewerId: v.optional(v.id("users")),
    title: v.string(),
    description: v.string(),
    city: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("under_review"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    rejectionReason: v.optional(v.string()),
    convertedPropertyId: v.optional(v.id("properties")),
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
  })
    .index("by_client", ["clientId"])
    .index("by_assigned_reviewer", ["assignedReviewerId"])
    .index("by_status", ["status"]),
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run convex/schema.test.ts`
Expected: `15 passed`.

- [ ] **Step 5: Verify the schema pushes to the real Convex deployment**

Same as Task 6, Step 6.

- [ ] **Step 6: Do not commit**

Leave `convex/schema.ts`/`convex/schema.test.ts` uncommitted — no `git add`/`git commit`.

---

### Task 12: `requireRole`/`can()` permission helper

**Files:**
- Create: `convex/lib/permissions.ts`
- Test: `convex/lib/permissions.test.ts`

**Interfaces:**
- Consumes: `can`, `PERMISSION_MATRIX`, `Role`, `Resource`, `Action` from `convex/lib/roles.ts` (Task 5); the `users` table (Task 6).
- Produces: `ForbiddenError`, `requireRole(ctx, resource, action)` — Phase 2's Clerk sync and Phase 4's admin/portal mutations call this at the top of every sensitive query/mutation. Per Convex's auth guidelines, identity is always resolved server-side via `ctx.auth.getUserIdentity().tokenIdentifier` — this function never accepts a `userId` argument.

- [ ] **Step 1: Write the failing test**

```ts
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../schema";
import { ForbiddenError, requireRole } from "./permissions";

const modules = import.meta.glob("../**/*.ts");

describe("requireRole", () => {
  test("throws when there is no authenticated identity", async () => {
    const t = convexTest(schema, modules);
    await expect(t.run(async (ctx) => requireRole(ctx, "properties", "read"))).rejects.toThrow(
      ForbiddenError,
    );
  });

  test("throws when the identity has no matching users row", async () => {
    const t = convexTest(schema, modules);
    const asUnknown = t.withIdentity({ tokenIdentifier: "clerk|unknown" });
    await expect(asUnknown.run(async (ctx) => requireRole(ctx, "properties", "read"))).rejects.toThrow(
      ForbiddenError,
    );
  });

  test("throws when the user's role lacks the action", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: "clerk|client-1",
        email: "owner@example.com",
        name: "Property Owner",
        role: "client",
        createdAt: Date.now(),
      });
    });
    const asClient = t.withIdentity({ tokenIdentifier: "clerk|client-1" });
    await expect(asClient.run(async (ctx) => requireRole(ctx, "properties", "delete"))).rejects.toThrow(
      ForbiddenError,
    );
  });

  test("returns the user row when the role has the action", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: "clerk|admin-1",
        email: "admin@example.com",
        name: "Admin User",
        role: "admin",
        createdAt: Date.now(),
      });
    });
    const asAdmin = t.withIdentity({ tokenIdentifier: "clerk|admin-1" });
    const user = await asAdmin.run(async (ctx) => requireRole(ctx, "properties", "create"));
    expect(user.role).toBe("admin");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run convex/lib/permissions.test.ts`
Expected: FAIL with "Cannot find module './permissions'".

- [ ] **Step 3: Write minimal implementation**

```ts
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { can, type Action, type Resource } from "./roles";

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ForbiddenError("Not authenticated");
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) {
    throw new ForbiddenError("No user record for this identity");
  }
  return user;
}

export async function requireRole(ctx: QueryCtx | MutationCtx, resource: Resource, action: Action) {
  const user = await getCurrentUser(ctx);
  if (!can(user.role, resource, action)) {
    throw new ForbiddenError(`Role "${user.role}" cannot "${action}" on "${resource}"`);
  }
  return user;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run convex/lib/permissions.test.ts`
Expected: `4 passed`.

- [ ] **Step 5: Do not commit**

Leave `convex/lib/permissions.ts` and its test uncommitted — no `git add`/`git commit`.

---

### Task 13: `writeAuditLog` helper

**Files:**
- Create: `convex/lib/auditLog.ts`
- Test: `convex/lib/auditLog.test.ts`

**Interfaces:**
- Consumes: the `auditLogs` and `users` tables (Task 6); `Resource` type from `convex/lib/roles.ts` (Task 5).
- Produces: `writeAuditLog(ctx, args)` — called from every sensitive admin mutation starting Phase 2 (user/role changes, deletes, publishes, submission approvals/rejections), per `PLAN.md`'s Phase 2 checklist.

- [ ] **Step 1: Write the failing test**

```ts
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../schema";
import { writeAuditLog } from "./auditLog";

const modules = import.meta.glob("../**/*.ts");

describe("writeAuditLog", () => {
  test("inserts a row with the given shape", async () => {
    const t = convexTest(schema, modules);
    const actorUserId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        tokenIdentifier: "clerk|admin-1",
        email: "admin@example.com",
        name: "Admin User",
        role: "admin",
        createdAt: Date.now(),
      });
    });

    await t.run(async (ctx) => {
      await writeAuditLog(ctx, {
        actorUserId,
        resource: "properties",
        action: "delete",
        targetId: "some-property-id",
      });
    });

    const logs = await t.run(async (ctx) => ctx.db.query("auditLogs").collect());
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      actorUserId,
      resource: "properties",
      action: "delete",
      targetId: "some-property-id",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run convex/lib/auditLog.test.ts`
Expected: FAIL with "Cannot find module './auditLog'".

- [ ] **Step 3: Write minimal implementation**

```ts
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import type { Resource } from "./roles";

export async function writeAuditLog(
  ctx: MutationCtx,
  args: {
    actorUserId: Id<"users">;
    resource: Resource;
    action: string;
    targetId?: string;
    details?: string;
  },
) {
  await ctx.db.insert("auditLogs", {
    actorUserId: args.actorUserId,
    resource: args.resource,
    action: args.action,
    targetId: args.targetId,
    details: args.details,
    createdAt: Date.now(),
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run convex/lib/auditLog.test.ts`
Expected: `1 passed`.

- [ ] **Step 5: Do not commit**

Leave `convex/lib/auditLog.ts` and its test uncommitted — no `git add`/`git commit`.

---

### Task 14: Zod mirrors — shared building blocks

**Files:**
- Create: `lib/validation/shared.ts`
- Test: `lib/validation/shared.test.ts`
- Create: `lib/validation/propertyShared.ts`
- Test: `lib/validation/propertyShared.test.ts`

**Interfaces:**
- Consumes: nothing (Zod schemas are independent of Convex validators — they're a hand-mirrored, parallel definition, since Convex's `v.*` validators and Zod's `z.*` schemas are different libraries with no automatic conversion in this stack).
- Produces: `localizedTextSchema`, `seoFieldsSchema`, `publishingFieldsSchema` (mirroring `convex/lib/localizedText.ts` + `convex/lib/seoFields.ts` field-for-field) and `propertySharedFactsSchema` (mirroring `convex/lib/propertyFacts.ts`). Phase 4's admin forms (Developers/Agents/Communities/Projects/Properties CRUD, per `PLAN.md`) and Phase 6's public "List Your Property" form both import these.

- [ ] **Step 1: Write the failing test for `shared.ts`**

```ts
import { describe, expect, it } from "vitest";
import { localizedTextSchema, publishingFieldsSchema, seoFieldsSchema } from "./shared";

describe("localizedTextSchema", () => {
  it("requires en, allows optional ar/tr", () => {
    expect(localizedTextSchema.safeParse({ en: "Hello" }).success).toBe(true);
    expect(localizedTextSchema.safeParse({ ar: "مرحبا" }).success).toBe(false);
  });
});

describe("seoFieldsSchema", () => {
  it("is fully optional", () => {
    expect(seoFieldsSchema.safeParse({}).success).toBe(true);
  });
});

describe("publishingFieldsSchema", () => {
  it("requires slug/status/updatedAt, restricts status to the three known values", () => {
    expect(
      publishingFieldsSchema.safeParse({ slug: "x", status: "draft", updatedAt: Date.now() }).success,
    ).toBe(true);
    expect(
      publishingFieldsSchema.safeParse({ slug: "x", status: "live", updatedAt: Date.now() }).success,
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/validation/shared.test.ts`
Expected: FAIL with "Cannot find module './shared'".

- [ ] **Step 3: Write `lib/validation/shared.ts`**

```ts
import { z } from "zod";

export const localizedTextSchema = z.object({
  en: z.string().min(1),
  ar: z.string().min(1).optional(),
  tr: z.string().min(1).optional(),
});

export const seoFieldsSchema = z.object({
  seoTitle: localizedTextSchema.optional(),
  seoDescription: localizedTextSchema.optional(),
  canonicalPath: z.string().optional(),
});

export const publishingFieldsSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, and hyphen-separated"),
  status: z.enum(["draft", "published", "archived"]),
  publishedAt: z.number().optional(),
  updatedAt: z.number(),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/validation/shared.test.ts`
Expected: `3 passed`.

- [ ] **Step 5: Write the failing test for `propertyShared.ts`**

```ts
import { describe, expect, it } from "vitest";
import { propertySharedFactsSchema } from "./propertyShared";

describe("propertySharedFactsSchema", () => {
  it("rejects negative price/bedrooms/bathrooms/areaSqft", () => {
    const base = { price: 100, bedrooms: 1, bathrooms: 1, areaSqft: 100, countryCode: "AE" };
    expect(propertySharedFactsSchema.safeParse(base).success).toBe(true);
    expect(propertySharedFactsSchema.safeParse({ ...base, price: -1 }).success).toBe(false);
  });

  it("requires a 2-letter uppercase countryCode", () => {
    const base = { price: 100, bedrooms: 1, bathrooms: 1, areaSqft: 100 };
    expect(propertySharedFactsSchema.safeParse({ ...base, countryCode: "AE" }).success).toBe(true);
    expect(propertySharedFactsSchema.safeParse({ ...base, countryCode: "ae" }).success).toBe(false);
    expect(propertySharedFactsSchema.safeParse({ ...base, countryCode: "UAE" }).success).toBe(false);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run lib/validation/propertyShared.test.ts`
Expected: FAIL with "Cannot find module './propertyShared'".

- [ ] **Step 7: Write `lib/validation/propertyShared.ts`**

```ts
import { z } from "zod";

export const propertySharedFactsSchema = z.object({
  price: z.number().positive(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().int().nonnegative(),
  areaSqft: z.number().positive(),
  countryCode: z.string().regex(/^[A-Z]{2}$/, "Use an ISO 3166-1 alpha-2 code, e.g. AE"),
});
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run lib/validation/propertyShared.test.ts`
Expected: `2 passed`.

- [ ] **Step 9: Do not commit**

Leave all created files uncommitted — no `git add`/`git commit`.

---

### Task 15: Zod mirrors — `properties`, `projects`, `propertySubmissions`

**Files:**
- Create: `lib/validation/properties.ts`
- Test: `lib/validation/properties.test.ts`
- Create: `lib/validation/projects.ts`
- Test: `lib/validation/projects.test.ts`
- Create: `lib/validation/propertySubmissions.ts`
- Test: `lib/validation/propertySubmissions.test.ts`

**Interfaces:**
- Consumes: `localizedTextSchema`/`seoFieldsSchema`/`publishingFieldsSchema` (Task 14, `shared.ts`), `propertySharedFactsSchema` (Task 14, `propertyShared.ts`).
- Produces: `propertySchema`, `projectSchema`, `propertySubmissionSchema` — Phase 4's Properties/Projects CRUD forms and Phase 6's "List Your Property" form (`PLAN.md`) validate against these client-side before calling the corresponding Convex mutation.

- [ ] **Step 1: Write the failing test for `properties.ts`**

```ts
import { describe, expect, it } from "vitest";
import { propertySchema } from "./properties";

describe("propertySchema", () => {
  it("accepts a full valid property and rejects one missing translated title", () => {
    const valid = {
      price: 2_500_000,
      bedrooms: 3,
      bathrooms: 2,
      areaSqft: 1800,
      countryCode: "AE",
      title: { en: "Marina View Apartment" },
      description: { en: "A stunning apartment with marina views." },
      city: { en: "Dubai" },
      listingStatus: "for_sale",
      publishing: { slug: "marina-view-apartment", status: "published", updatedAt: Date.now() },
    };
    expect(propertySchema.safeParse(valid).success).toBe(true);
    const { title: _title, ...missingTitle } = valid;
    expect(propertySchema.safeParse(missingTitle).success).toBe(false);
  });

  it("restricts listingStatus to the five known values", () => {
    const base = {
      price: 1,
      bedrooms: 1,
      bathrooms: 1,
      areaSqft: 1,
      countryCode: "AE",
      title: { en: "x" },
      description: { en: "x" },
      city: { en: "x" },
      publishing: { slug: "x", status: "published", updatedAt: Date.now() },
    };
    expect(propertySchema.safeParse({ ...base, listingStatus: "for_sale" }).success).toBe(true);
    expect(propertySchema.safeParse({ ...base, listingStatus: "leased" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/validation/properties.test.ts`
Expected: FAIL with "Cannot find module './properties'".

- [ ] **Step 3: Write `lib/validation/properties.ts`**

```ts
import { z } from "zod";
import { localizedTextSchema, publishingFieldsSchema, seoFieldsSchema } from "./shared";
import { propertySharedFactsSchema } from "./propertyShared";

export const propertySchema = propertySharedFactsSchema.extend({
  title: localizedTextSchema,
  description: localizedTextSchema,
  city: localizedTextSchema,
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  listingStatus: z.enum(["for_sale", "for_rent", "sold", "rented", "off_market"]),
  amenities: z.array(z.string()).optional(),
  communityId: z.string().optional(),
  developerId: z.string().optional(),
  projectId: z.string().optional(),
  agentId: z.string().optional(),
  seo: seoFieldsSchema.optional(),
  publishing: publishingFieldsSchema,
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/validation/properties.test.ts`
Expected: `2 passed`.

- [ ] **Step 5: Write the failing test for `projects.ts`**

```ts
import { describe, expect, it } from "vitest";
import { projectSchema } from "./projects";

describe("projectSchema", () => {
  it("requires a developerId but not a communityId", () => {
    const base = {
      title: { en: "Marina Heights" },
      description: { en: "A waterfront tower." },
      developerId: "some-developer-id",
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "under_construction",
      publishing: { slug: "marina-heights", status: "published", updatedAt: Date.now() },
    };
    expect(projectSchema.safeParse(base).success).toBe(true);
    const { developerId: _developerId, ...missingDeveloper } = base;
    expect(projectSchema.safeParse(missingDeveloper).success).toBe(false);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run lib/validation/projects.test.ts`
Expected: FAIL with "Cannot find module './projects'".

- [ ] **Step 7: Write `lib/validation/projects.ts`**

```ts
import { z } from "zod";
import { localizedTextSchema, publishingFieldsSchema, seoFieldsSchema } from "./shared";

export const projectSchema = z.object({
  title: localizedTextSchema,
  description: localizedTextSchema,
  developerId: z.string().min(1),
  communityId: z.string().optional(),
  countryCode: z.string().regex(/^[A-Z]{2}$/, "Use an ISO 3166-1 alpha-2 code, e.g. AE"),
  city: localizedTextSchema,
  status: z.enum(["upcoming", "under_construction", "completed"]),
  startingPrice: z.number().positive().optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  amenities: z.array(z.string()).optional(),
  seo: seoFieldsSchema.optional(),
  publishing: publishingFieldsSchema,
});
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run lib/validation/projects.test.ts`
Expected: `1 passed`.

- [ ] **Step 9: Write the failing test for `propertySubmissions.ts`**

```ts
import { describe, expect, it } from "vitest";
import { propertySubmissionSchema } from "./propertySubmissions";

describe("propertySubmissionSchema", () => {
  it("uses plain string title/description/city, unlike propertySchema's LocalizedText", () => {
    const valid = {
      price: 1_800_000,
      bedrooms: 2,
      bathrooms: 2,
      areaSqft: 1200,
      countryCode: "AE",
      title: "My apartment in JBR",
      description: "Sea view, high floor.",
      city: "Dubai",
    };
    expect(propertySubmissionSchema.safeParse(valid).success).toBe(true);
    expect(propertySubmissionSchema.safeParse({ ...valid, title: { en: "not a string" } }).success).toBe(
      false,
    );
  });

  it("does not require staff-only fields like status or assignedReviewerId", () => {
    const valid = {
      price: 1,
      bedrooms: 1,
      bathrooms: 1,
      areaSqft: 1,
      countryCode: "AE",
      title: "x",
      description: "x",
      city: "x",
    };
    const result = propertySubmissionSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 10: Run test to verify it fails**

Run: `npx vitest run lib/validation/propertySubmissions.test.ts`
Expected: FAIL with "Cannot find module './propertySubmissions'".

- [ ] **Step 11: Write `lib/validation/propertySubmissions.ts`**

```ts
import { z } from "zod";
import { propertySharedFactsSchema } from "./propertyShared";

// Only the fields a client fills out on the public "List Your Property"
// form. Staff-only fields (status, assignedReviewerId, rejectionReason,
// convertedPropertyId, submittedAt/reviewedAt) are set server-side by the
// Convex mutation itself in Phase 6, never supplied by the client, so they
// are intentionally absent here.
export const propertySubmissionSchema = propertySharedFactsSchema.extend({
  title: z.string().min(1),
  description: z.string().min(1),
  city: z.string().min(1),
});
```

- [ ] **Step 12: Run test to verify it passes**

Run: `npx vitest run lib/validation/propertySubmissions.test.ts`
Expected: `2 passed`.

- [ ] **Step 13: Do not commit**

Leave all created files uncommitted — no `git add`/`git commit`.

---

### Task 16: Zod mirrors — remaining entities

**Files:**
- Create: `lib/validation/developers.ts`, `lib/validation/agents.ts`, `lib/validation/communities.ts`, `lib/validation/leads.ts`, `lib/validation/blogPosts.ts`, `lib/validation/users.ts`, `lib/validation/websiteSettings.ts`, `lib/validation/mediaItems.ts`
- Test: `lib/validation/developers.test.ts`, `lib/validation/agents.test.ts`, `lib/validation/communities.test.ts`, `lib/validation/leads.test.ts`, `lib/validation/blogPosts.test.ts`, `lib/validation/users.test.ts`, `lib/validation/websiteSettings.test.ts`, `lib/validation/mediaItems.test.ts`

**Interfaces:**
- Consumes: `localizedTextSchema`/`seoFieldsSchema`/`publishingFieldsSchema` (Task 14, `shared.ts`).
- Produces: one Zod schema per remaining table, mirroring `convex/schema.ts` field-for-field. Phase 4's Developers/Agents/Communities/Leads/Blog CRUD forms and Phase 3's media metadata forms import these. `leadSchema` covers property/project inquiries only — the general Contact page's GoHighLevel form has no Zod schema on our side; see "GoHighLevel" in `TECH_STACK.md`.

This task follows the exact same red/green loop as Tasks 14–15, repeated per file. To keep this plan scannable, each remaining schema is specified as a single test + implementation pair below — implement and verify them one file at a time, in this order (matching each table's dependency on `users`/`agents` where relevant).

- [ ] **Step 1: `developers`**

Test (`lib/validation/developers.test.ts`):

```ts
import { describe, expect, it } from "vitest";
import { developerSchema } from "./developers";

describe("developerSchema", () => {
  it("requires a localized name and publishing block, everything else optional", () => {
    expect(
      developerSchema.safeParse({
        name: { en: "Emaar Properties" },
        publishing: { slug: "emaar-properties", status: "published", updatedAt: Date.now() },
      }).success,
    ).toBe(true);
    expect(developerSchema.safeParse({ publishing: { slug: "x", status: "published", updatedAt: 1 } }).success).toBe(
      false,
    );
  });
});
```

Run `npx vitest run lib/validation/developers.test.ts` to confirm it fails, then implement:

```ts
import { z } from "zod";
import { localizedTextSchema, publishingFieldsSchema, seoFieldsSchema } from "./shared";

export const developerSchema = z.object({
  name: localizedTextSchema,
  description: localizedTextSchema.optional(),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  email: z.email().optional(),
  seo: seoFieldsSchema.optional(),
  publishing: publishingFieldsSchema,
});
```

Run the test again to confirm `2 passed`.

- [ ] **Step 2: `agents`**

Test (`lib/validation/agents.test.ts`):

```ts
import { describe, expect, it } from "vitest";
import { agentSchema } from "./agents";

describe("agentSchema", () => {
  it("requires name/email/publishing, rejects an invalid email", () => {
    const base = {
      name: "Agent One",
      email: "agent1@example.com",
      publishing: { slug: "agent-one", status: "published", updatedAt: Date.now() },
    };
    expect(agentSchema.safeParse(base).success).toBe(true);
    expect(agentSchema.safeParse({ ...base, email: "not-an-email" }).success).toBe(false);
  });
});
```

Run to confirm it fails, then implement:

```ts
import { z } from "zod";
import { localizedTextSchema, publishingFieldsSchema, seoFieldsSchema } from "./shared";

export const agentSchema = z.object({
  name: z.string().min(1),
  bio: localizedTextSchema.optional(),
  email: z.email(),
  phone: z.string().optional(),
  userId: z.string().optional(),
  seo: seoFieldsSchema.optional(),
  publishing: publishingFieldsSchema,
});
```

Run again to confirm `2 passed`.

- [ ] **Step 3: `communities`**

Test (`lib/validation/communities.test.ts`):

```ts
import { describe, expect, it } from "vitest";
import { communitySchema } from "./communities";

describe("communitySchema", () => {
  it("requires countryCode as a 2-letter uppercase code", () => {
    const base = {
      name: { en: "Dubai Marina" },
      city: { en: "Dubai" },
      publishing: { slug: "dubai-marina", status: "published", updatedAt: Date.now() },
    };
    expect(communitySchema.safeParse({ ...base, countryCode: "AE" }).success).toBe(true);
    expect(communitySchema.safeParse({ ...base, countryCode: "ae" }).success).toBe(false);
  });
});
```

Run to confirm it fails, then implement:

```ts
import { z } from "zod";
import { localizedTextSchema, publishingFieldsSchema, seoFieldsSchema } from "./shared";

export const communitySchema = z.object({
  name: localizedTextSchema,
  city: localizedTextSchema,
  countryCode: z.string().regex(/^[A-Z]{2}$/, "Use an ISO 3166-1 alpha-2 code, e.g. AE"),
  description: localizedTextSchema.optional(),
  seo: seoFieldsSchema.optional(),
  publishing: publishingFieldsSchema,
});
```

Run again to confirm `2 passed`.

- [ ] **Step 4: `leads`**

Test (`lib/validation/leads.test.ts`):

```ts
import { describe, expect, it } from "vitest";
import { leadSchema } from "./leads";

describe("leadSchema", () => {
  it("requires name/email, defaults status to new when omitted", () => {
    const result = leadSchema.safeParse({ name: "Jane Buyer", email: "jane@example.com" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("new");
    }
  });
});
```

Run to confirm it fails, then implement:

```ts
import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  phone: z.string().optional(),
  message: z.string().optional(),
  propertyId: z.string().optional(),
  projectId: z.string().optional(),
  status: z.enum(["new", "contacted", "qualified", "closed"]).default("new"),
  assignedAgentId: z.string().optional(),
});
```

Run again to confirm `1 passed`.

- [ ] **Step 5: `blogPosts`**

Test (`lib/validation/blogPosts.test.ts`):

```ts
import { describe, expect, it } from "vitest";
import { blogPostSchema } from "./blogPosts";

describe("blogPostSchema", () => {
  it("requires localized title/body, authorUserId, and publishing", () => {
    const base = {
      title: { en: "Dubai Market Update" },
      body: { en: "The market is..." },
      authorUserId: "some-user-id",
      publishing: { slug: "dubai-market-update", status: "published", updatedAt: Date.now() },
    };
    expect(blogPostSchema.safeParse(base).success).toBe(true);
    const { authorUserId: _authorUserId, ...missingAuthor } = base;
    expect(blogPostSchema.safeParse(missingAuthor).success).toBe(false);
  });
});
```

Run to confirm it fails, then implement:

```ts
import { z } from "zod";
import { localizedTextSchema, publishingFieldsSchema, seoFieldsSchema } from "./shared";

export const blogPostSchema = z.object({
  title: localizedTextSchema,
  body: localizedTextSchema,
  authorUserId: z.string().min(1),
  seo: seoFieldsSchema.optional(),
  publishing: publishingFieldsSchema,
});
```

Run again to confirm `2 passed`.

- [ ] **Step 6: `users`**

Test (`lib/validation/users.test.ts`):

```ts
import { describe, expect, it } from "vitest";
import { userSchema } from "./users";
import { ROLES } from "../../convex/lib/roles";

describe("userSchema", () => {
  it("restricts role to the four Convex-defined roles", () => {
    for (const role of ROLES) {
      expect(userSchema.safeParse({ email: "a@b.com", name: "A", role }).success).toBe(true);
    }
    expect(userSchema.safeParse({ email: "a@b.com", name: "A", role: "superuser" }).success).toBe(false);
  });
});
```

Run to confirm it fails, then implement (importing `ROLES` directly from the Convex source of truth so the two can never drift):

```ts
import { z } from "zod";
import { ROLES } from "../../convex/lib/roles";

export const userSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
  role: z.enum(ROLES),
});
```

Run again to confirm `2 passed`.

- [ ] **Step 7: `websiteSettings`**

Test (`lib/validation/websiteSettings.test.ts`):

```ts
import { describe, expect, it } from "vitest";
import { websiteSettingsSchema } from "./websiteSettings";

describe("websiteSettingsSchema", () => {
  it("requires siteName, validates nested socialLinks as URLs", () => {
    expect(websiteSettingsSchema.safeParse({ siteName: "QuickTalk Real Estate" }).success).toBe(true);
    expect(
      websiteSettingsSchema.safeParse({
        siteName: "QuickTalk Real Estate",
        socialLinks: { instagram: "not-a-url" },
      }).success,
    ).toBe(false);
  });
});
```

Run to confirm it fails, then implement:

```ts
import { z } from "zod";
import { seoFieldsSchema } from "./shared";

export const websiteSettingsSchema = z.object({
  siteName: z.string().min(1),
  contactEmail: z.email().optional(),
  contactPhone: z.string().optional(),
  socialLinks: z
    .object({
      facebook: z.string().url().optional(),
      instagram: z.string().url().optional(),
      linkedin: z.string().url().optional(),
      twitter: z.string().url().optional(),
    })
    .optional(),
  defaultSeo: seoFieldsSchema.optional(),
});
```

Run again to confirm `2 passed`.

- [ ] **Step 8: `mediaItems`**

Test (`lib/validation/mediaItems.test.ts`):

```ts
import { describe, expect, it } from "vitest";
import { mediaItemSchema } from "./mediaItems";
import { mediaEntityTypeValidator } from "../../convex/lib/mediaEntityType";

describe("mediaItemSchema", () => {
  it("restricts entityType to the same union Convex defines", () => {
    const kinds = mediaEntityTypeValidator.members.map((m) => m.value as string);
    for (const entityType of kinds) {
      expect(
        mediaItemSchema.safeParse({
          entityType,
          entityId: "some-id",
          url: "https://example.com/x.png",
          pathname: "x/x.png",
          order: 0,
          mimeType: "image/png",
        }).success,
      ).toBe(true);
    }
    expect(mediaItemSchema.safeParse({ entityType: "invoice" }).success).toBe(false);
  });
});
```

Run to confirm it fails, then implement (mirroring the Convex union member-by-member, since Zod and Convex validators can't be converted into each other automatically):

```ts
import { z } from "zod";
import { localizedTextSchema } from "./shared";

export const mediaItemSchema = z.object({
  entityType: z.enum(["property", "project", "developer", "agent", "community", "blogPost", "propertySubmission"]),
  entityId: z.string().min(1),
  url: z.string().url(),
  pathname: z.string().min(1),
  alt: localizedTextSchema.optional(),
  order: z.number().int().nonnegative(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  mimeType: z.string().min(1),
});
```

Run again to confirm `2 passed`.

- [ ] **Step 9: Do not commit**

Leave all created files uncommitted — no `git add`/`git commit`.

---

### Task 17: Full test suite, `PLAN.md` checkboxes, final review

**Files:**
- Modify: `PLAN.md`

**Interfaces:**
- Consumes: every file created in Tasks 1–16.
- Produces: a fully green test suite and an up-to-date `PLAN.md` reflecting Phase 1's completion — the exit criteria for this plan.

- [ ] **Step 1: Run the entire test suite**

Run: `npm run test:once`
Expected: every test file across `convex/` and `lib/validation/` passes, with no failures — this is the first point where all 16 prior tasks' tests run together as one suite, so it also catches any cross-file drift (e.g. a schema field renamed in `schema.ts` without updating its Zod mirror).

- [ ] **Step 2: Run the linter and type-checker**

Run: `npm run lint`
Expected: no errors.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Verify the schema is live on the Convex deployment**

Check the running `npx convex dev` terminal's output for the final state (all 13 tables synced with no errors), or run `npx convex dev --once` if no watch process is running.

- [ ] **Step 4: Update `PLAN.md`'s Phase 1 checklist**

Read `PLAN.md`'s Phase 1 section and check off (`- [x]`) every task now complete: the schema (all 13 tables), `LocalizedText`/`SeoFields`/`PublishingFields`/`propertySharedFacts` shared validators, the `mediaItems` unified table, the country-aware `communities` table, the permission matrix + `requireRole`/`can()` helper, the `writeAuditLog` helper, and the Zod validation mirrors for every table.

- [ ] **Step 5: Do not commit**

Leave `PLAN.md` and every file from Tasks 1–17 uncommitted — no `git add`/`git commit`. Report completion to the user and let them review the full diff before deciding what (if anything) to commit.

---
