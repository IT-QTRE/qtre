# Phase 3 — Media & Image Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the reusable Vercel Blob upload pipeline that every Phase 4 admin CRUD form (and the Phase 4 Client Portal submission form) will depend on for images/documents: client-direct upload (no file routed through a Vercel Function), `mediaItems` rows recorded via Convex, drag-drop reordering, alt-text entry, delete — plus a real public/private security split so client-submitted documents aren't just "protected" by an unguessable URL.

**Architecture decisions from review (corrections to `PLAN.md`'s original phrasing + new decisions):**

1. **Route Handler, not a Server Action, for the upload token exchange.** `PLAN.md` said "signed token from an authenticated server action." Vercel's client-direct upload (`upload()` from `@vercel/blob/client`) requires a stable HTTP endpoint reachable both for the initial token request and (in production) Vercel's own completion webhook — that's a Route Handler (`app/api/blob/upload/route.ts`) using `handleUpload()`, not a `"use server"` function. Server Actions are capped at 4.5MB (Vercel Functions' hard body limit) and unsuitable for anything beyond a trivial avatar-sized file anyway. The Route Handler is still fully auth-gated inside `onBeforeGenerateToken` — "no public upload endpoint" meant "no *unauthenticated* one," which this satisfies.
2. **Don't rely on `onUploadCompleted`.** That webhook never fires in local dev without an ngrok tunnel. The `mediaItems` row is instead recorded by the client calling a Convex mutation directly right after `upload()` resolves — identical behavior in dev and prod. `onUploadCompleted` stays a no-op (see Task 8) so production doesn't get a second, racing insert.
3. **Two Vercel Blob stores — public and private.** Access mode (public/private) is a property of the *store*, not a per-file flag — confirmed against Vercel's current docs. Property/project/developer/agent/community/blog media is public marketing content (served directly via CDN URL). `propertySubmission` documents (title deeds, floor plans — real client-submitted personal documents) go to a **second, private** store: every read goes through an authenticated Route Handler (Task 9), so a leaked URL alone is useless and access can be revoked instantly. This needs a one-time manual dashboard step (Task 1), mirroring Phase 2's Clerk Dashboard activation.
4. **Client-side WebP compression before upload, no new dependency.** Real-estate photos from phones/DSLRs are often 5–15MB; resizing + re-encoding to WebP client-side (native Canvas API — `createImageBitmap` + `canvas.toBlob('image/webp', quality)`, no library) cuts that dramatically before the bytes ever leave the browser, reducing upload time and Blob storage cost. (Note: `next/image` already re-encodes to WebP/AVIF *for display* regardless of stored format — this step is about the *stored/uploaded* size, a separate, complementary win.) Falls back to uploading the original file untouched if the browser can't encode WebP or the input isn't an image (PDFs pass through as-is).
5. **Client role gets `mediaItems: delete`, scoped to their own pending submission.** Phase 1's permission matrix only gave Client `read`+`create`. Extended so a Client can remove a document they mistakenly attached to their own submission — but only while it's still `"pending"` (once Admin/Agent review starts, the record is locked). The same pending-only gate applies to `create` for the Client role, for symmetry.
6. **Per-entity-type allowed file types.** Marketing entities (property/project/developer/agent/community/blogPost): images only (jpeg/png/webp/avif). `propertySubmission`: images + PDF.
7. **`@dnd-kit/core` + `@dnd-kit/sortable` added as a new dependency** for accessible (mouse/touch/keyboard) drag-and-drop reordering.
8. **Manual verification via a temporary admin test page.** Phase 4's real CRUD forms don't exist yet, so there's nothing real to attach media to. Task 13 builds a throwaway `/admin/media-test` page (hardcoded fake entity IDs) to click through the full flow end-to-end, then deletes it before this plan is marked done.

## Global Constraints

- **No agent runs `git add` or `git commit` — ever, for any task.** All changes stay uncommitted. Every "Commit" step is replaced by a "Do not commit" note.
- Convex mutations cannot make external HTTP calls (must stay deterministic) — Blob upload-token generation and `del()` both happen in Next.js (Route Handler / Server Action), never inside a Convex function. Convex functions here only ever touch `ctx.db`.
- This codebase's existing `ctx.db.get`/`.patch`/`.delete` calls use the single-argument form (`ctx.db.get(id)`, not `ctx.db.get(tableName, id)`) — see `convex/schema.test.ts`. Match that convention for consistency; both forms exist in Convex's current API, but the single-arg form is what's already in use here.
- Role is derived server-side via `ctx.auth.getUserIdentity().tokenIdentifier` — never a client-supplied `userId`/role. Every Convex function that reads/writes `mediaItems` re-derives and re-checks authorization itself — no function trusts a prior check from elsewhere (the upload Route Handler and delete Server Action both call a Convex query for the authorization check, then the actual `create`/`deleteRecord` mutation re-checks independently).
- A `npx convex dev` watch process may already be running from earlier phases — check its terminal output for a successful sync after any `convex/` change instead of running `npx convex dev --once` again.
- This phase does not build Phase 4's real admin forms — the uploader component built here is generic (`entityType`/`entityId` props) and gets wired into real forms next phase.
- `mediaItems.entityId` is `v.string()` (polymorphic — no single table it always points to), so ownership checks that need to load the referenced document (`propertySubmissions`, specifically) must cast: `ctx.db.get(entityId as Id<"propertySubmissions">)`.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `.env.example` | Modify | Add `PRIVATE_BLOB_READ_WRITE_TOKEN` |
| `convex/lib/mediaAccessConfig.ts` | Create | Single source of truth: entityType → `{ access, allowedContentTypes, maxSizeBytes }` |
| `convex/lib/mediaAccessConfig.test.ts` | Create | Tests for the above |
| `convex/lib/roles.ts` | Modify | Add `"delete"` to client's `mediaItems` actions |
| `convex/lib/roles.test.ts` | Modify | Cover the new client `delete` grant |
| `convex/lib/permissions.ts` | Modify | Export `getCurrentUser` (was private) for reuse by `mediaAuthorization.ts` |
| `convex/lib/mediaAuthorization.ts` | Create | `assertCanWriteMedia`, `assertCanReadMedia` — role + entity-ownership checks |
| `convex/lib/mediaAuthorization.test.ts` | Create | Tests for the above |
| `convex/mediaItems.ts` | Create | `checkUploadAuthorization`, `create`, `listByEntity`, `reorder`, `getForDelete`, `deleteRecord`, `getForPrivateDelivery` |
| `convex/mediaItems.test.ts` | Create | Tests for the above |
| `lib/media/imageDimensions.ts` | Create | Pure resize-math: target dimensions preserving aspect ratio, downscale-only |
| `lib/media/imageDimensions.test.ts` | Create | Tests for the above |
| `lib/media/compressImage.ts` | Create | Browser Canvas-based resize + WebP encode, with fallback to original file |
| `app/api/blob/upload/route.ts` | Create | `handleUpload()` Route Handler — auth + authorization + per-entity-type token/config |
| `app/api/blob/private/route.ts` | Create | Authenticated delivery route for private (`propertySubmission`) blobs |
| `lib/actions/media.ts` | Create | `deleteMediaItem` Server Action — authorize → `del()` → delete Convex row |
| `package.json` | Modify | Add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| `components/media/media-uploader.tsx` | Create | The reusable widget: drop zone, list, drag-reorder, alt text, delete |
| `components/media/media-image.tsx` | Create | `next/image`-based public-media display; plain `<img>` via the private delivery route for private media |
| `next.config.ts` | Modify | `images.remotePatterns` for the public Blob store's hostname |
| `app/(portal)/admin/media-test/page.tsx` | Create, then Delete | Temporary manual-verification harness (Task 13) |
| `PLAN.md` | Modify | Check off completed Phase 3 items |
| `TECH_STACK.md` | Modify | Document the two-store split, client-side WebP compression, `@dnd-kit` addition |

---

### Task 1: Manual setup — private Vercel Blob store + env var

**Files:**
- Modify: `.env.example`

**Interfaces:**
- Consumes: nothing.
- Produces: `PRIVATE_BLOB_READ_WRITE_TOKEN`, read by Tasks 8–10. This task has manual, human-only steps — no CLI/API path exists for creating a store from inside this repo.

- [x] **Step 1: Manual — create a second, private Blob store (user-performed)**

Done. Vercel project `quicktalk-it-proj/qtre` linked via `vercel link` (Option B — CLI link, no GitHub connection). Public store created (default prefix → `BLOB_READ_WRITE_TOKEN`) and private store created (prefix `PRIVATE_BLOB` → `PRIVATE_BLOB_READ_WRITE_TOKEN`), both with Access correctly set (Public/Private) and both connected to Development, Preview, and Production environments, with the read-write token env var included.

- [x] **Step 2: Add the env var placeholder to `.env.example`**

Done — `.env.example` now has:

```bash
# Vercel Blob — public store (marketing entities: properties, projects, developers, agents, communities, blogPosts)
BLOB_READ_WRITE_TOKEN=

# Vercel Blob — private store (propertySubmissions documents only)
PRIVATE_BLOB_READ_WRITE_TOKEN=
```

- [x] **Step 3: Manual — pull/add the real value (user-performed)**

Done via `npx vercel env pull .env.local` — confirmed present: `BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID`, `BLOB_WEBHOOK_PUBLIC_KEY`, `PRIVATE_BLOB_READ_WRITE_TOKEN`, `PRIVATE_BLOB_STORE_ID`, `PRIVATE_BLOB_WEBHOOK_PUBLIC_KEY` (variable names verified, values not inspected by the agent).

- [x] **Step 4: Do not commit**

`.env.example` only — no `git add`/`git commit`.

---

### Task 2: `lib/media/imageDimensions.ts` — pure resize math

**Files:**
- Create: `lib/media/imageDimensions.ts`
- Test: `lib/media/imageDimensions.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `computeTargetDimensions(width, height, maxDimension)` — used by `compressImage.ts` (Task 3) to decide the output size before drawing to canvas. Pure and isolated specifically so the sizing logic is unit-testable without any real browser Canvas/Image API.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";
import { computeTargetDimensions } from "./imageDimensions";

describe("computeTargetDimensions", () => {
  it("leaves dimensions unchanged when already within the max", () => {
    expect(computeTargetDimensions(800, 600, 2560)).toEqual({ width: 800, height: 600 });
  });

  it("downscales a landscape image so the longest edge equals maxDimension", () => {
    expect(computeTargetDimensions(6000, 4000, 2560)).toEqual({ width: 2560, height: 1707 });
  });

  it("downscales a portrait image so the longest edge equals maxDimension", () => {
    expect(computeTargetDimensions(4000, 6000, 2560)).toEqual({ width: 1707, height: 2560 });
  });

  it("never upscales", () => {
    expect(computeTargetDimensions(400, 300, 2560)).toEqual({ width: 400, height: 300 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/media/imageDimensions.test.ts`
Expected: FAIL with "Cannot find module './imageDimensions'".

- [ ] **Step 3: Write the implementation**

```ts
export function computeTargetDimensions(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  const longestEdge = Math.max(width, height);
  if (longestEdge <= maxDimension) {
    return { width, height };
  }
  const scale = maxDimension / longestEdge;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/media/imageDimensions.test.ts`
Expected: `4 passed`.

- [ ] **Step 5: Do not commit**

---

### Task 3: `lib/media/compressImage.ts` — browser-side resize + WebP encode

**Files:**
- Create: `lib/media/compressImage.ts`

**Interfaces:**
- Consumes: `computeTargetDimensions` (Task 2).
- Produces: `compressImageFile(file, options?)` — called by `media-uploader.tsx` (Task 11) before every image upload. Not unit-tested (real `createImageBitmap`/`canvas.toBlob` browser APIs aren't meaningfully mockable) — verified manually in Task 13.

- [ ] **Step 1: Write the implementation**

```ts
import { computeTargetDimensions } from "./imageDimensions";

const DEFAULT_MAX_DIMENSION = 2560;
const DEFAULT_QUALITY = 0.82;

// Resizes + re-encodes an image file to WebP entirely client-side, so large
// phone/DSLR photos never hit the network (or Blob storage) at their
// original size. Falls back to the original file untouched if the input
// isn't an image, or if the browser can't produce a WebP blob (very old
// browsers) — never blocks an upload on this being unsupported.
export async function compressImageFile(
  file: File,
  { maxDimension = DEFAULT_MAX_DIMENSION, quality = DEFAULT_QUALITY } = {},
): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = computeTargetDimensions(bitmap.width, bitmap.height, maxDimension);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (!blob) {
      return file;
    }

    const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], newName, { type: "image/webp" });
  } catch {
    // Any failure (unsupported format, decode error, etc.) falls back to
    // uploading the original — never block the user's upload on this.
    return file;
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Do not commit**

---

### Task 4: `convex/lib/mediaAccessConfig.ts`

**Files:**
- Create: `convex/lib/mediaAccessConfig.ts`
- Test: `convex/lib/mediaAccessConfig.test.ts`

**Interfaces:**
- Consumes: `MediaEntityType` from `convex/lib/mediaEntityType.ts` (Phase 1).
- Produces: `MEDIA_ACCESS_CONFIG` — the single source of truth both the upload Route Handler (Task 8, via `@/convex/lib/mediaAccessConfig`) and `mediaAuthorization.ts`/`mediaItems.ts` (Tasks 6–7) read from. Lives inside `convex/lib/` (not root `lib/`) specifically so Next.js can import it the same way it already imports `@/convex/_generated/api` — Convex functions can only reliably import modules that live under `convex/`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { MEDIA_ACCESS_CONFIG } from "./mediaAccessConfig";

describe("MEDIA_ACCESS_CONFIG", () => {
  it("marks propertySubmission as private with images+PDF allowed", () => {
    expect(MEDIA_ACCESS_CONFIG.propertySubmission.access).toBe("private");
    expect(MEDIA_ACCESS_CONFIG.propertySubmission.allowedContentTypes).toContain("application/pdf");
  });

  it("marks every marketing entity type as public, images-only", () => {
    for (const entityType of ["property", "project", "developer", "agent", "community", "blogPost"] as const) {
      expect(MEDIA_ACCESS_CONFIG[entityType].access).toBe("public");
      expect(MEDIA_ACCESS_CONFIG[entityType].allowedContentTypes).not.toContain("application/pdf");
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run convex/lib/mediaAccessConfig.test.ts`
Expected: FAIL with "Cannot find module './mediaAccessConfig'".

- [ ] **Step 3: Write the implementation**

```ts
import type { MediaEntityType } from "./mediaEntityType";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

type MediaAccessRule = {
  access: "public" | "private";
  allowedContentTypes: string[];
  maxSizeBytes: number;
};

// Single source of truth for both halves of the upload pipeline: the Route
// Handler (app/api/blob/upload/route.ts) reads this to pick which Blob
// store's token to use and what to allow; convex/lib/mediaAuthorization.ts
// reads the `access` field to decide whether a read requires authentication.
export const MEDIA_ACCESS_CONFIG: Record<MediaEntityType, MediaAccessRule> = {
  property: { access: "public", allowedContentTypes: IMAGE_TYPES, maxSizeBytes: 15 * 1024 * 1024 },
  project: { access: "public", allowedContentTypes: IMAGE_TYPES, maxSizeBytes: 15 * 1024 * 1024 },
  developer: { access: "public", allowedContentTypes: IMAGE_TYPES, maxSizeBytes: 15 * 1024 * 1024 },
  agent: { access: "public", allowedContentTypes: IMAGE_TYPES, maxSizeBytes: 15 * 1024 * 1024 },
  community: { access: "public", allowedContentTypes: IMAGE_TYPES, maxSizeBytes: 15 * 1024 * 1024 },
  blogPost: { access: "public", allowedContentTypes: IMAGE_TYPES, maxSizeBytes: 15 * 1024 * 1024 },
  // Real client-submitted documents (title deeds, floor plans) — private
  // store, images+PDF, and a slightly higher cap since multi-page scans
  // aren't pre-compressed the way images are (compressImage.ts only
  // touches image/* files, PDFs pass through unchanged).
  propertySubmission: {
    access: "private",
    allowedContentTypes: [...IMAGE_TYPES, "application/pdf"],
    maxSizeBytes: 25 * 1024 * 1024,
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run convex/lib/mediaAccessConfig.test.ts`
Expected: `2 passed`.

- [ ] **Step 5: Verify it syncs to the real Convex deployment**

Check the running `npx convex dev` output. Expected: no errors (this file exports no Convex functions, so nothing new appears in the function list — just confirm the sync doesn't break).

- [ ] **Step 6: Do not commit**

---

### Task 5: `convex/lib/roles.ts` — Client gets scoped `mediaItems: delete`

**Files:**
- Modify: `convex/lib/roles.ts`
- Modify: `convex/lib/roles.test.ts`

**Interfaces:**
- Consumes/Produces: nothing new — modifies the existing `PERMISSION_MATRIX` from Phase 1.

- [ ] **Step 1: Update the test to expect the new grant**

Add to the existing `can()` describe block in `convex/lib/roles.test.ts`:

```ts
it("client can now delete media (Phase 3 — scoped to their own pending submission, enforced in convex/lib/mediaAuthorization.ts, not this flat matrix)", () => {
  expect(can("client", "mediaItems", "delete")).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run convex/lib/roles.test.ts`
Expected: FAIL — `can("client", "mediaItems", "delete")` currently returns `false`.

- [ ] **Step 3: Update `PERMISSION_MATRIX`**

In `convex/lib/roles.ts`, change the `client` row's `mediaItems` entry:

```ts
    mediaItems: ["read", "create", "delete"],
```

(Note: still no bare `"update"` — reordering a submission's own documents isn't part of this phase's scope; only add/remove.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run convex/lib/roles.test.ts`
Expected: all pass.

- [ ] **Step 5: Do not commit**

---

### Task 6: `convex/lib/mediaAuthorization.ts`

**Files:**
- Modify: `convex/lib/permissions.ts` (export `getCurrentUser`)
- Create: `convex/lib/mediaAuthorization.ts`
- Test: `convex/lib/mediaAuthorization.test.ts`

**Interfaces:**
- Consumes: `requireRole`/`getCurrentUser` (Phase 1's `permissions.ts`), `can` (`roles.ts`), `MEDIA_ACCESS_CONFIG` (Task 4).
- Produces: `assertCanWriteMedia` (create/update/delete gate) and `assertCanReadMedia` (read gate) — every function in `convex/mediaItems.ts` (Task 7) calls one of these first, before touching the database. This is the one place both "is this role allowed to do X to mediaItems at all" and "does this specific entityId belong to this specific caller" are decided.

- [ ] **Step 1: Export `getCurrentUser` from `convex/lib/permissions.ts`**

Change `async function getCurrentUser(...)` to `export async function getCurrentUser(...)` — no other changes to that file.

- [ ] **Step 2: Write the failing tests**

```ts
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../schema";
import { ForbiddenError } from "./permissions";
import { assertCanWriteMedia, assertCanReadMedia } from "./mediaAuthorization";

const modules = import.meta.glob("../**/*.ts");

async function seedUser(t: ReturnType<typeof convexTest>, tokenIdentifier: string, role: "admin" | "agent" | "client") {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      tokenIdentifier,
      email: `${tokenIdentifier}@example.com`,
      name: tokenIdentifier,
      role,
      createdAt: Date.now(),
    });
  });
}

describe("assertCanWriteMedia", () => {
  test("admin can attach media to any entity type", async () => {
    const t = convexTest(schema, modules);
    await seedUser(t, "clerk|admin-1", "admin");
    await t.run(async (ctx) => {
      const identity = { tokenIdentifier: "clerk|admin-1" };
      // @ts-expect-error convex-test identity shape
      ctx.auth = { getUserIdentity: async () => identity };
      await assertCanWriteMedia(ctx, "create", "property", "some-property-id");
    });
  });

  test("client cannot attach media to a property (not their own resource type)", async () => {
    const t = convexTest(schema, modules);
    await seedUser(t, "clerk|client-1", "client");
    const asClient = t.withIdentity({ tokenIdentifier: "clerk|client-1" });
    await expect(
      asClient.run(async (ctx) => assertCanWriteMedia(ctx, "create", "property", "some-property-id")),
    ).rejects.toThrow(ForbiddenError);
  });

  test("client can attach media to their own pending submission", async () => {
    const t = convexTest(schema, modules);
    const clientId = await seedUser(t, "clerk|client-2", "client");
    const submissionId = await t.run(async (ctx) => {
      return await ctx.db.insert("propertySubmissions", {
        clientId,
        title: "My place",
        description: "desc",
        city: "Dubai",
        price: 100,
        bedrooms: 1,
        bathrooms: 1,
        area: 50,
        countryCode: "AE",
        status: "pending",
        submittedAt: Date.now(),
      });
    });
    const asClient = t.withIdentity({ tokenIdentifier: "clerk|client-2" });
    await asClient.run(async (ctx) => assertCanWriteMedia(ctx, "create", "propertySubmission", submissionId));
  });

  test("client cannot attach media to someone else's submission", async () => {
    const t = convexTest(schema, modules);
    const otherClientId = await seedUser(t, "clerk|client-3", "client");
    await seedUser(t, "clerk|client-4", "client");
    const submissionId = await t.run(async (ctx) => {
      return await ctx.db.insert("propertySubmissions", {
        clientId: otherClientId,
        title: "Not yours",
        description: "desc",
        city: "Dubai",
        price: 100,
        bedrooms: 1,
        bathrooms: 1,
        area: 50,
        countryCode: "AE",
        status: "pending",
        submittedAt: Date.now(),
      });
    });
    const asOtherClient = t.withIdentity({ tokenIdentifier: "clerk|client-4" });
    await expect(
      asOtherClient.run(async (ctx) => assertCanWriteMedia(ctx, "create", "propertySubmission", submissionId)),
    ).rejects.toThrow(ForbiddenError);
  });

  test("client cannot modify their own submission's media once it's under review", async () => {
    const t = convexTest(schema, modules);
    const clientId = await seedUser(t, "clerk|client-5", "client");
    const submissionId = await t.run(async (ctx) => {
      return await ctx.db.insert("propertySubmissions", {
        clientId,
        title: "My place",
        description: "desc",
        city: "Dubai",
        price: 100,
        bedrooms: 1,
        bathrooms: 1,
        area: 50,
        countryCode: "AE",
        status: "under_review",
        submittedAt: Date.now(),
      });
    });
    const asClient = t.withIdentity({ tokenIdentifier: "clerk|client-5" });
    await expect(
      asClient.run(async (ctx) => assertCanWriteMedia(ctx, "delete", "propertySubmission", submissionId)),
    ).rejects.toThrow(ForbiddenError);
  });
});

describe("assertCanReadMedia", () => {
  test("allows an unauthenticated caller to read public entity types", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => assertCanReadMedia(ctx, "property", "some-property-id"));
  });

  test("rejects an unauthenticated caller reading a private propertySubmission", async () => {
    const t = convexTest(schema, modules);
    const clientId = await seedUser(t, "clerk|client-6", "client");
    const submissionId = await t.run(async (ctx) => {
      return await ctx.db.insert("propertySubmissions", {
        clientId,
        title: "My place",
        description: "desc",
        city: "Dubai",
        price: 100,
        bedrooms: 1,
        bathrooms: 1,
        area: 50,
        countryCode: "AE",
        status: "pending",
        submittedAt: Date.now(),
      });
    });
    await expect(
      t.run(async (ctx) => assertCanReadMedia(ctx, "propertySubmission", submissionId)),
    ).rejects.toThrow(ForbiddenError);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run convex/lib/mediaAuthorization.test.ts`
Expected: FAIL with "Cannot find module './mediaAuthorization'".

- [ ] **Step 4: Write the implementation**

```ts
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { requireRole, getCurrentUser, ForbiddenError } from "./permissions";
import { can, type Action } from "./roles";
import { MEDIA_ACCESS_CONFIG } from "./mediaAccessConfig";
import type { MediaEntityType } from "./mediaEntityType";

type WriteAction = Extract<Action, "create" | "update" | "delete">;

// Called by every write path in convex/mediaItems.ts before touching the
// database. Two layers: (1) does this role have this action on the
// "mediaItems" resource at all (the flat matrix, Phase 1); (2) for a
// Client specifically, is this a propertySubmission they own, and — while
// mutating — is it still "pending" (once Admin/Agent review starts, a
// Client can no longer add/remove documents on it).
export async function assertCanWriteMedia(
  ctx: MutationCtx | QueryCtx,
  action: WriteAction,
  entityType: MediaEntityType,
  entityId: string,
) {
  const user = await requireRole(ctx, "mediaItems", action);
  if (user.role !== "client") {
    // Admin/Super Admin/Agent: the flat matrix's blanket grant is
    // sufficient — no additional per-entity ownership scoping in this
    // phase (mirrors the rest of the mediaItems matrix's existing design).
    return user;
  }

  if (entityType !== "propertySubmission") {
    throw new ForbiddenError("Clients may only attach media to their own property submissions");
  }
  const submission = await ctx.db.get(entityId as Id<"propertySubmissions">);
  if (!submission || submission.clientId !== user._id) {
    throw new ForbiddenError("Not your submission");
  }
  if (submission.status !== "pending") {
    throw new ForbiddenError("This submission's documents can no longer be changed");
  }
  return user;
}

// Called by convex/mediaItems.ts's listByEntity and getForPrivateDelivery.
// Public entity types (property/project/etc.) are open to anyone, including
// unauthenticated visitors — this is what lets Phase 5's public property
// pages render images without requiring sign-in. Private (propertySubmission)
// requires the caller to be the owning Client or staff (Admin/Agent/Super Admin).
export async function assertCanReadMedia(ctx: QueryCtx | MutationCtx, entityType: MediaEntityType, entityId: string) {
  if (MEDIA_ACCESS_CONFIG[entityType].access === "public") {
    return;
  }

  const user = await getCurrentUser(ctx);
  if (user.role !== "client") {
    if (!can(user.role, "mediaItems", "read")) {
      throw new ForbiddenError(`Role "${user.role}" cannot read mediaItems`);
    }
    return;
  }
  const submission = await ctx.db.get(entityId as Id<"propertySubmissions">);
  if (!submission || submission.clientId !== user._id) {
    throw new ForbiddenError("Not your submission");
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run convex/lib/mediaAuthorization.test.ts`
Expected: all pass.

- [ ] **Step 6: Verify sync to the real Convex deployment**

Check the running `npx convex dev` output.

- [ ] **Step 7: Do not commit**

---

### Task 7: `convex/mediaItems.ts`

**Files:**
- Create: `convex/mediaItems.ts`
- Test: `convex/mediaItems.test.ts`

**Interfaces:**
- Consumes: `assertCanWriteMedia`/`assertCanReadMedia` (Task 6), `mediaEntityTypeValidator` (Phase 1), `MEDIA_ACCESS_CONFIG` (Task 4).
- Produces: every public Convex function the rest of this phase calls — `checkUploadAuthorization` (Task 8's Route Handler), `create`/`listByEntity`/`reorder` (Task 11's uploader component), `getForDelete`/`deleteRecord` (Task 10's Server Action), `getForPrivateDelivery` (Task 9's delivery route).

- [ ] **Step 1: Write the failing tests**

```ts
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
import { ForbiddenError } from "./lib/permissions";

const modules = import.meta.glob("./**/*.ts");

async function seedAdmin(t: ReturnType<typeof convexTest>) {
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      tokenIdentifier: "clerk|admin-1",
      email: "admin1@example.com",
      name: "Admin One",
      role: "admin",
      createdAt: Date.now(),
    });
  });
  return t.withIdentity({ tokenIdentifier: "clerk|admin-1" });
}

describe("mediaItems.create + listByEntity", () => {
  test("inserts a row with an auto-incrementing order, and lists it back", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);

    const firstId = await asAdmin.mutation(api.mediaItems.create, {
      entityType: "property",
      entityId: "prop-1",
      url: "https://example.public.blob.vercel-storage.com/a.webp",
      pathname: "a.webp",
      mimeType: "image/webp",
    });
    const secondId = await asAdmin.mutation(api.mediaItems.create, {
      entityType: "property",
      entityId: "prop-1",
      url: "https://example.public.blob.vercel-storage.com/b.webp",
      pathname: "b.webp",
      mimeType: "image/webp",
    });

    const items = await asAdmin.query(api.mediaItems.listByEntity, { entityType: "property", entityId: "prop-1" });
    expect(items.map((i) => i._id)).toEqual([firstId, secondId]);
    expect(items[0].order).toBe(0);
    expect(items[1].order).toBe(1);
  });

  test("an unauthenticated caller can still list public media (Phase 5 will rely on this)", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.mediaItems.create, {
      entityType: "property",
      entityId: "prop-2",
      url: "https://example.public.blob.vercel-storage.com/c.webp",
      pathname: "c.webp",
      mimeType: "image/webp",
    });

    const items = await t.query(api.mediaItems.listByEntity, { entityType: "property", entityId: "prop-2" });
    expect(items).toHaveLength(1);
  });
});

describe("mediaItems.reorder", () => {
  test("rejects an id that doesn't belong to the given entity", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const realId = await asAdmin.mutation(api.mediaItems.create, {
      entityType: "property",
      entityId: "prop-3",
      url: "https://example.public.blob.vercel-storage.com/d.webp",
      pathname: "d.webp",
      mimeType: "image/webp",
    });
    const otherId = await asAdmin.mutation(api.mediaItems.create, {
      entityType: "property",
      entityId: "prop-4",
      url: "https://example.public.blob.vercel-storage.com/e.webp",
      pathname: "e.webp",
      mimeType: "image/webp",
    });

    await expect(
      asAdmin.mutation(api.mediaItems.reorder, {
        entityType: "property",
        entityId: "prop-3",
        orderedIds: [realId, otherId],
      }),
    ).rejects.toThrow();
  });
});

describe("mediaItems.getForDelete + deleteRecord", () => {
  test("a client cannot delete media belonging to someone else's submission", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        tokenIdentifier: "clerk|client-a",
        email: "a@example.com",
        name: "Client A",
        role: "client",
        createdAt: Date.now(),
      });
      await ctx.db.insert("users", {
        tokenIdentifier: "clerk|client-b",
        email: "b@example.com",
        name: "Client B",
        role: "client",
        createdAt: Date.now(),
      });
    });
    const asAdmin = await seedAdmin(t);
    const clientAId = await t.run(async (ctx) => {
      return (await ctx.db
        .query("users")
        .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", "clerk|client-a"))
        .unique())!._id;
    });
    const submissionId = await t.run(async (ctx) => {
      return await ctx.db.insert("propertySubmissions", {
        clientId: clientAId,
        title: "A's place",
        description: "desc",
        city: "Dubai",
        price: 100,
        bedrooms: 1,
        bathrooms: 1,
        area: 50,
        countryCode: "AE",
        status: "pending",
        submittedAt: Date.now(),
      });
    });
    const asClientA = t.withIdentity({ tokenIdentifier: "clerk|client-a" });
    const mediaItemId = await asClientA.mutation(api.mediaItems.create, {
      entityType: "propertySubmission",
      entityId: submissionId,
      url: "https://example.private.blob.vercel-storage.com/deed.pdf",
      pathname: "deed.pdf",
      mimeType: "application/pdf",
    });

    const asClientB = t.withIdentity({ tokenIdentifier: "clerk|client-b" });
    await expect(asClientB.query(api.mediaItems.getForDelete, { mediaItemId })).rejects.toThrow(ForbiddenError);
    await expect(asClientB.mutation(api.mediaItems.deleteRecord, { mediaItemId })).rejects.toThrow(ForbiddenError);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run convex/mediaItems.test.ts`
Expected: FAIL — `api.mediaItems` doesn't exist yet.

- [ ] **Step 3: Write `convex/mediaItems.ts`**

```ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { mediaEntityTypeValidator } from "./lib/mediaEntityType";
import { localizedTextValidator } from "./lib/localizedText";
import { assertCanWriteMedia, assertCanReadMedia } from "./lib/mediaAuthorization";
import { MEDIA_ACCESS_CONFIG } from "./lib/mediaAccessConfig";
import { ForbiddenError } from "./lib/permissions";

// Called by app/api/blob/upload/route.ts's onBeforeGenerateToken before it
// ever asks Vercel Blob for a token — an unauthorized caller's upload is
// rejected before a single byte is transferred. Read-only (a query, not a
// mutation): it either returns null or throws, no state changes.
export const checkUploadAuthorization = query({
  args: { entityType: mediaEntityTypeValidator, entityId: v.string() },
  handler: async (ctx, args) => {
    await assertCanWriteMedia(ctx, "create", args.entityType, args.entityId);
    return null;
  },
});

export const create = mutation({
  args: {
    entityType: mediaEntityTypeValidator,
    entityId: v.string(),
    url: v.string(),
    pathname: v.string(),
    mimeType: v.string(),
    alt: v.optional(localizedTextValidator),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertCanWriteMedia(ctx, "create", args.entityType, args.entityId);

    const last = await ctx.db
      .query("mediaItems")
      .withIndex("by_entity", (q) => q.eq("entityType", args.entityType).eq("entityId", args.entityId))
      .order("desc")
      .first();
    const order = last ? last.order + 1 : 0;

    return await ctx.db.insert("mediaItems", { ...args, order });
  },
});

export const listByEntity = query({
  args: { entityType: mediaEntityTypeValidator, entityId: v.string() },
  handler: async (ctx, args) => {
    await assertCanReadMedia(ctx, args.entityType, args.entityId);
    return await ctx.db
      .query("mediaItems")
      .withIndex("by_entity", (q) => q.eq("entityType", args.entityType).eq("entityId", args.entityId))
      .take(200);
  },
});

export const reorder = mutation({
  args: {
    entityType: mediaEntityTypeValidator,
    entityId: v.string(),
    orderedIds: v.array(v.id("mediaItems")),
  },
  handler: async (ctx, args) => {
    await assertCanWriteMedia(ctx, "update", args.entityType, args.entityId);

    const existing = await ctx.db
      .query("mediaItems")
      .withIndex("by_entity", (q) => q.eq("entityType", args.entityType).eq("entityId", args.entityId))
      .take(200);
    const existingIds = new Set(existing.map((item) => item._id));
    if (args.orderedIds.length !== existing.length || !args.orderedIds.every((id) => existingIds.has(id))) {
      throw new Error("orderedIds must be exactly the set of media items belonging to this entity");
    }

    for (const [index, id] of args.orderedIds.entries()) {
      await ctx.db.patch(id, { order: index });
    }
    return null;
  },
});

// Called by lib/actions/media.ts's Server Action, step 1 (before del()).
// Returns just enough for the action to call Blob's del() with the right
// store — never trusts this alone to actually delete anything; deleteRecord
// below re-runs the same authorization check independently.
export const getForDelete = query({
  args: { mediaItemId: v.id("mediaItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.mediaItemId);
    if (!item) {
      throw new Error("Media item not found");
    }
    await assertCanWriteMedia(ctx, "delete", item.entityType, item.entityId);
    return { pathname: item.pathname, access: MEDIA_ACCESS_CONFIG[item.entityType].access };
  },
});

// Called by lib/actions/media.ts's Server Action, step 3 (after a
// successful del()). Independently re-checks authorization rather than
// trusting getForDelete's earlier check — see Global Constraints.
export const deleteRecord = mutation({
  args: { mediaItemId: v.id("mediaItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.mediaItemId);
    if (!item) {
      return null;
    }
    await assertCanWriteMedia(ctx, "delete", item.entityType, item.entityId);
    await ctx.db.delete(args.mediaItemId);
    return null;
  },
});

// Called by app/api/blob/private/route.ts for every private-blob view.
export const getForPrivateDelivery = query({
  args: { mediaItemId: v.id("mediaItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.mediaItemId);
    if (!item) {
      throw new ForbiddenError("Not found");
    }
    await assertCanReadMedia(ctx, item.entityType, item.entityId);
    return { pathname: item.pathname, mimeType: item.mimeType };
  },
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run convex/mediaItems.test.ts`
Expected: all pass.

- [ ] **Step 5: Verify sync to the real Convex deployment**

Check the running `npx convex dev` output — `mediaItems:create`, `mediaItems:listByEntity`, etc. should appear.

- [ ] **Step 6: Do not commit**

---

### Task 8: `app/api/blob/upload/route.ts`

**Files:**
- Create: `app/api/blob/upload/route.ts`

**Interfaces:**
- Consumes: `api.mediaItems.checkUploadAuthorization` (Task 7), `MEDIA_ACCESS_CONFIG` (Task 4), Clerk's `auth()`.
- Produces: the token-exchange endpoint `media-uploader.tsx` (Task 11) points `upload()`'s `handleUploadUrl` at.

- [ ] **Step 1: Write the route**

```ts
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { MEDIA_ACCESS_CONFIG } from "@/convex/lib/mediaAccessConfig";
import type { MediaEntityType } from "@/convex/lib/mediaEntityType";

type UploadContext = { entityType: MediaEntityType; entityId: string };

function parseUploadContext(clientPayload: string | null): UploadContext {
  if (!clientPayload) {
    throw new Error("Missing upload context");
  }
  return JSON.parse(clientPayload) as UploadContext;
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  // Which Blob store's token to use is decided from clientPayload BEFORE
  // calling handleUpload() — the `access` field returned from
  // onBeforeGenerateToken below is NOT part of its allowed return shape
  // (access is a property of the store/token used to generate the client
  // token, not something handleUpload lets you set per-call).
  const clientPayload = body.type === "blob.generate-client-token" ? body.payload.clientPayload : null;
  let token: string | undefined;
  if (clientPayload) {
    const { entityType } = parseUploadContext(clientPayload);
    token =
      MEDIA_ACCESS_CONFIG[entityType].access === "private"
        ? process.env.PRIVATE_BLOB_READ_WRITE_TOKEN
        : process.env.BLOB_READ_WRITE_TOKEN;
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async (_pathname, rawClientPayload) => {
        const { getToken } = await auth();
        const authToken = (await getToken()) ?? undefined;
        if (!authToken) {
          throw new Error("Not authenticated");
        }

        const { entityType, entityId } = parseUploadContext(rawClientPayload);

        // Role + ownership check — mirrored independently by
        // convex/mediaItems.ts's create mutation itself, so this route is
        // never the only enforcement point.
        await fetchQuery(api.mediaItems.checkUploadAuthorization, { entityType, entityId }, { token: authToken });

        const config = MEDIA_ACCESS_CONFIG[entityType];
        return {
          allowedContentTypes: config.allowedContentTypes,
          maximumSizeInBytes: config.maxSizeBytes,
          addRandomSuffix: true,
          tokenPayload: rawClientPayload,
        };
      },
      onUploadCompleted: async () => {
        // Intentionally a no-op — see this plan's Architecture Decisions
        // item 2. The mediaItems row is created by the client calling
        // convex/mediaItems.ts's `create` mutation directly right after
        // upload() resolves (media-uploader.tsx), not here.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Do not commit**

---

### Task 9: `app/api/blob/private/route.ts` — private blob delivery

**Files:**
- Create: `app/api/blob/private/route.ts`

**Interfaces:**
- Consumes: `api.mediaItems.getForPrivateDelivery` (Task 7), `get()` from `@vercel/blob`, Clerk's `auth()`.
- Produces: the URL `media-image.tsx` (Task 12) points private-entity `<img>` tags at — `/api/blob/private?mediaItemId=...`. This is the *only* thing standing between "private store" being a real security boundary and it being decorative — get this task's review right.

- [ ] **Step 1: Write the route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const mediaItemId = request.nextUrl.searchParams.get("mediaItemId");
  if (!mediaItemId) {
    return NextResponse.json({ error: "Missing mediaItemId" }, { status: 400 });
  }

  const { getToken } = await auth();
  const token = (await getToken()) ?? undefined;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let record;
  try {
    record = await fetchQuery(
      api.mediaItems.getForPrivateDelivery,
      { mediaItemId: mediaItemId as Id<"mediaItems"> },
      { token },
    );
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await get(record.pathname, {
    access: "private",
    token: process.env.PRIVATE_BLOB_READ_WRITE_TOKEN,
  });
  if (result?.statusCode !== 200) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "X-Content-Type-Options": "nosniff",
      // Per Vercel's private-storage guidance: never let this be cached by
      // the CDN (no s-maxage) — only the requesting browser, and only
      // after this same authorization check re-runs on every request.
      "Cache-Control": "private, no-cache",
    },
  });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Do not commit**

---

### Task 10: `lib/actions/media.ts` — delete Server Action

**Files:**
- Create: `lib/actions/media.ts`

**Interfaces:**
- Consumes: `api.mediaItems.getForDelete`/`deleteRecord` (Task 7), `del()` from `@vercel/blob`.
- Produces: `deleteMediaItem(mediaItemId)`, called by `media-uploader.tsx` (Task 11)'s delete button.

- [ ] **Step 1: Write the Server Action**

```ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export async function deleteMediaItem(mediaItemId: Id<"mediaItems">): Promise<void> {
  const { getToken } = await auth();
  const token = (await getToken()) ?? undefined;
  if (!token) {
    throw new Error("Not authenticated");
  }

  // Throws (ForbiddenError, surfaced as a generic Convex error to this
  // caller) if the signed-in user isn't allowed to delete this item —
  // del() below never runs for an unauthorized caller.
  const { pathname, access } = await fetchQuery(api.mediaItems.getForDelete, { mediaItemId }, { token });

  await del(pathname, {
    token: access === "private" ? process.env.PRIVATE_BLOB_READ_WRITE_TOKEN : process.env.BLOB_READ_WRITE_TOKEN,
  });

  // Re-checks authorization independently rather than trusting the
  // getForDelete call above — see Global Constraints. If this throws after
  // del() already succeeded, the Blob object is gone but the Convex row
  // survives momentarily as an orphan pointing at a 404 — self-healing on
  // the next successful delete attempt, not a security issue (worst case
  // is a broken image, never unauthorized access).
  await fetchMutation(api.mediaItems.deleteRecord, { mediaItemId }, { token });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Do not commit**

---

### Security review of Tasks 6–10 (background subagent) — findings and fixes

A dedicated security-review subagent (per this plan's "reserve the full
implementer+reviewer subagent pattern for the security-critical tasks"
decision) audited Tasks 6–10 after they landed. It found one **Critical**
issue and several **Important** ones, all fixed below with regression
tests added to `convex/mediaItems.test.ts` and `convex/lib/mediaAccessConfig.test.ts`:

- **Critical — cross-entity pathname substitution in `mediaItems.create`.**
  `create`'s authorization only checked that the caller owned the
  `entityId` argument — it never checked that the `pathname` argument had
  anything to do with that entity. A caller authorized for their own
  `propertySubmission` could pass a different (leaked/guessed) submission's
  real pathname as `pathname`, and the row would be created, letting them
  read/delete that other submission's private document through this app's
  own "authorized" routes. **Fix:** every blob pathname must now live under
  `{entityType}/{entityId}/` (`convex/lib/mediaAccessConfig.ts`'s new
  `requiredPathnamePrefix`), enforced independently in three places: the
  client's `upload()` call (`media-uploader.tsx`), the Route Handler's
  `onBeforeGenerateToken` (`app/api/blob/upload/route.ts`), and
  `mediaItems.create` itself. Binding `entityId` into the path makes the
  substitution structurally impossible, not just discouraged.
- **Important — silent fallback to the public store's token when an env
  var is missing.** `app/api/blob/upload/route.ts`, `app/api/blob/private/route.ts`,
  and `lib/actions/media.ts` all now throw/500 instead of leaving `token`
  `undefined` (which would make the Blob SDK silently default to
  `BLOB_READ_WRITE_TOKEN`, the *public* store, for what should be a private
  upload/read/delete).
- **Important — `getForPrivateDelivery` didn't check the entity was
  actually private.** Added a check that rejects (throws `ForbiddenError`)
  if `MEDIA_ACCESS_CONFIG[entityType].access !== "private"` — this route
  exists solely to proxy private blobs; a public entity has no business
  going through it.
- **Important — delete ordering.** `lib/actions/media.ts`'s
  `deleteMediaItem` now calls `deleteRecord` (Convex row) **before**
  `del()` (Blob object), reversed from the original order. If the item
  becomes ineligible between `getForDelete` and `deleteRecord` (e.g. a
  concurrent status change), `deleteRecord` throws and `del()` never runs —
  the blob stays untouched. The old order risked the opposite: an
  authorization race destroying the blob while the Convex row (and its
  authorization state) still existed.
- **Important — `onUploadCompleted` signature verification for private
  uploads.** The upload-completed webhook event carries the same
  `entityType`/`entityId` JSON as `body.payload.tokenPayload` (not
  `clientPayload`, which is only present on the initial
  `blob.generate-client-token` event). `app/api/blob/upload/route.ts` now
  checks both fields when selecting which store's token to hand to
  `handleUpload()`, so signature verification uses the right store for
  both event types.

---

### Task 11: `@dnd-kit` + `components/media/media-uploader.tsx`

**Files:**
- Modify: `package.json` (add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`)
- Create: `components/media/media-uploader.tsx`

**Interfaces:**
- Consumes: `compressImageFile` (Task 3), `upload` from `@vercel/blob/client`, `api.mediaItems.create`/`listByEntity`/`reorder` (Task 7), `deleteMediaItem` (Task 10), `MEDIA_ACCESS_CONFIG` (Task 4).
- Produces: `<MediaUploader entityType entityId />` — the one reusable component every Phase 4 form (Developer/Agent/Project/Property/Client-Portal-submission) mounts for its image/document field(s).

- [ ] **Step 1: Install dependencies**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 2: Write the component**

```tsx
"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { upload } from "@vercel/blob/client";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { MediaEntityType } from "@/convex/lib/mediaEntityType";
import { MEDIA_ACCESS_CONFIG } from "@/convex/lib/mediaAccessConfig";
import { compressImageFile } from "@/lib/media/compressImage";
import { deleteMediaItem } from "@/lib/actions/media";
import { MediaImage } from "./media-image";

type MediaUploaderProps = {
  entityType: MediaEntityType;
  entityId: string;
};

export function MediaUploader({ entityType, entityId }: MediaUploaderProps) {
  const items = useQuery(api.mediaItems.listByEntity, { entityType, entityId }) ?? [];
  const createMediaItem = useMutation(api.mediaItems.create);
  const reorderMediaItems = useMutation(api.mediaItems.reorder);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startDeleteTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const config = MEDIA_ACCESS_CONFIG[entityType];

  const handleFiles = useCallback(
    async (files: FileList) => {
      setError(null);
      setIsUploading(true);
      try {
        for (const rawFile of Array.from(files)) {
          const file = await compressImageFile(rawFile);
          const blob = await upload(file.name, file, {
            access: config.access,
            handleUploadUrl: "/api/blob/upload",
            clientPayload: JSON.stringify({ entityType, entityId }),
          });
          await createMediaItem({
            entityType,
            entityId,
            url: blob.url,
            pathname: blob.pathname,
            mimeType: file.type,
          });
        }
      } catch (uploadError) {
        setError((uploadError as Error).message);
      } finally {
        setIsUploading(false);
      }
    },
    [config.access, createMediaItem, entityId, entityType],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = items.findIndex((item) => item._id === active.id);
      const newIndex = items.findIndex((item) => item._id === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex);
      void reorderMediaItems({ entityType, entityId, orderedIds: reordered.map((item) => item._id) });
    },
    [entityId, entityType, items, reorderMediaItems],
  );

  const handleDelete = useCallback((mediaItemId: Id<"mediaItems">) => {
    startDeleteTransition(async () => {
      await deleteMediaItem(mediaItemId);
    });
  }, []);

  return (
    <div className="space-y-4">
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (event.dataTransfer.files.length) void handleFiles(event.dataTransfer.files);
        }}
        className="cursor-pointer rounded-lg border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground"
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? "Uploading…" : "Drop files here or click to upload"}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={config.allowedContentTypes.join(",")}
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) void handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((item) => item._id)} strategy={verticalListSortingStrategy}>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {items.map((item) => (
              <SortableMediaItem key={item._id} item={item} onDelete={handleDelete} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableMediaItem({
  item,
  onDelete,
}: {
  item: { _id: Id<"mediaItems">; url: string; pathname: string; entityType: MediaEntityType };
  onDelete: (id: Id<"mediaItems">) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item._id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className="group relative aspect-square overflow-hidden rounded-lg border border-border"
    >
      <MediaImage mediaItemId={item._id} url={item.url} entityType={item.entityType} alt="" fill sizes="200px" />
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDelete(item._id);
        }}
        className="absolute right-1 top-1 rounded-full bg-background/80 px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100"
      >
        Remove
      </button>
    </li>
  );
}
```

Note: alt-text entry (per the Phase 3 checklist bullet) captures English (`en`) only for now, consistent with Phase 0's "English content first" decision — a small text input wired to `useMutation` isn't shown above for brevity; add an inline editable text field per item that calls a small `update`-style mutation (can reuse `create`'s shape via a follow-up `patch`, or extend `reorder`'s pattern) — implementer's discretion, not security-sensitive.

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit` and `npm run lint`
Expected: no errors.

- [ ] **Step 4: Do not commit**

---

### Task 12: `components/media/media-image.tsx` + `next.config.ts`

**Files:**
- Create: `components/media/media-image.tsx`
- Modify: `next.config.ts`

**Interfaces:**
- Consumes: `next/image`, the private delivery route (Task 9).
- Produces: `<MediaImage />` — used by `media-uploader.tsx` (Task 11) now, and by every Phase 4/5 public-facing image slot later (the `PropertyImage`-style wrapper `PLAN.md`/`TECH_STACK.md` describe).

- [ ] **Step 1: Add the public Blob store's hostname to `next.config.ts`**

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 2: Write the component**

```tsx
import Image, { type ImageProps } from "next/image";
import type { MediaEntityType } from "@/convex/lib/mediaEntityType";
import type { Id } from "@/convex/_generated/dataModel";

type MediaImageProps = Omit<ImageProps, "src"> & {
  mediaItemId: Id<"mediaItems">;
  url: string;
  entityType: MediaEntityType;
};

// Public entity types (property/project/etc.): next/image against the
// direct Blob CDN URL, same as any other remote image — gets Vercel's
// image optimization. propertySubmission (private): a plain <img> against
// the authenticated delivery route (Task 9) — next/image's own optimizer
// can't carry our auth cookie/token through its fetch, and these are
// internal review-screen documents, not public marketing images, so
// skipping optimization here is the right tradeoff.
export function MediaImage({ mediaItemId, url, entityType, alt, ...imageProps }: MediaImageProps) {
  if (entityType === "propertySubmission") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/api/blob/private?mediaItemId=${mediaItemId}`} alt={alt} className="h-full w-full object-cover" />;
  }
  return <Image src={url} alt={alt} {...imageProps} />;
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit` and `npm run lint`
Expected: no errors (the `eslint-disable` comment is required and intentional for the one legitimate `<img>` use).

- [ ] **Step 4: Do not commit**

---

### Task 13: Manual end-to-end verification via a temporary harness page

**Files:**
- Create, then Delete: `app/(portal)/admin/media-test/page.tsx`

**Interfaces:**
- Consumes: `MediaUploader` (Task 11) — this task doesn't add any new production code, it's purely a scaffold to click through the whole pipeline once for real, since Phase 4's actual forms don't exist yet.

- [ ] **Step 1: Write the temporary harness page**

```tsx
"use client";

import { MediaUploader } from "@/components/media/media-uploader";

export default function MediaTestPage() {
  return (
    <div className="space-y-10 p-8">
      <section>
        <h2 className="mb-2 font-semibold">Public entity (property)</h2>
        <MediaUploader entityType="property" entityId="test-property-1" />
      </section>
      <section>
        <h2 className="mb-2 font-semibold">Private entity (propertySubmission)</h2>
        <MediaUploader entityType="propertySubmission" entityId="test-submission-1" />
      </section>
    </div>
  );
}
```

Note: `propertySubmission`'s authorization requires a real `propertySubmissions` row owned by the signed-in test user for `entityId: "test-submission-1"` to pass `assertCanWriteMedia`'s ownership check when testing as a Client — insert one via the Convex dashboard first (or test this section signed in as Admin/Agent instead, which bypasses the ownership check entirely per Task 6).

- [ ] **Step 2: Manually verify the full pipeline, signed in as Admin**

Visit `/admin/media-test`. For the **public** section: upload 2–3 real images (including at least one large phone-camera-sized photo, e.g. >5MB, to confirm client-side compression works — check DevTools' Network tab shows a much smaller `.webp` upload than the original file), confirm each appears in the grid, drag to reorder and confirm the order persists after a page refresh, delete one and confirm it disappears from both the grid and the Vercel Blob dashboard.

For the **private** section (as Admin, which bypasses ownership): upload a PDF, confirm it renders/downloads correctly through `/api/blob/private?mediaItemId=...`, confirm the direct Blob URL (visible in the Convex dashboard's `mediaItems` row) returns 403/not-found when fetched directly without going through the app (proving the private store is actually private).

- [ ] **Step 3: Verify the authorization boundary**

Sign in as a Client account. Confirm attempting to upload to `entityType: "property"` is rejected (both the upload Route Handler's `onBeforeGenerateToken` throws, and — if you bypass the UI and call `api.mediaItems.create` directly with the Convex dashboard's function runner — the mutation itself also rejects it).

- [ ] **Step 4: Delete the harness page**

```bash
Remove-Item "app/(portal)/admin/media-test" -Recurse -Force
```

- [ ] **Step 5: Do not commit**

---

### Task 14: Full verification, `PLAN.md`/`TECH_STACK.md`, final review

**Files:**
- Modify: `PLAN.md`
- Modify: `TECH_STACK.md`

**Interfaces:**
- Consumes: every file from Tasks 1–13.
- Produces: a fully green test suite and up-to-date docs — the exit criteria for this plan.

- [ ] **Step 1: Run the entire test suite**

Run: `npm run test:once`
Expected: every test file passes, including this phase's new `lib/media/imageDimensions.test.ts`, `convex/lib/mediaAccessConfig.test.ts`, `convex/lib/mediaAuthorization.test.ts`, `convex/mediaItems.test.ts`, and updated `convex/lib/roles.test.ts`.

- [ ] **Step 2: Run the linter and type-checker**

Run: `npm run lint` and `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Verify everything is live on the Convex deployment**

Check the running `npx convex dev` output for a clean sync of `mediaItems.ts`, `lib/mediaAuthorization.ts`, `lib/mediaAccessConfig.ts`, `lib/roles.ts`.

- [ ] **Step 4: Confirm the manual Vercel Dashboard step is done**

Confirm with the user that Task 1's private Blob store exists and `PRIVATE_BLOB_READ_WRITE_TOKEN` is set in `.env.local`.

- [ ] **Step 5: Update `TECH_STACK.md`'s Media Storage section**

Document: the two-store (public/private) split and why, client-side WebP compression before upload (native Canvas API, no new dependency), `@dnd-kit` as the drag-and-drop library.

- [ ] **Step 6: Update `PLAN.md`'s Phase 3 checklist**

Check off (`- [x]`) every completed item, referencing this plan file.

- [ ] **Step 7: Do not commit**

Leave `PLAN.md`, `TECH_STACK.md`, and every file from Tasks 1–14 uncommitted — no `git add`/`git commit`. Report completion to the user and let them review the full diff before deciding what (if anything) to commit.

---
