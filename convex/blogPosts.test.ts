/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
import { ForbiddenError } from "./lib/permissions";

const modules = import.meta.glob("./**/*.ts");

async function seedUser(t: ReturnType<typeof convexTest>, tokenIdentifier: string, role: "super_admin" | "admin" | "agent" | "client") {
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      tokenIdentifier,
      email: `${tokenIdentifier}@example.com`,
      name: tokenIdentifier,
      role,
      createdAt: Date.now(),
    });
  });
  return t.withIdentity({ tokenIdentifier });
}

const baseArgs = {
  title: { en: "Market Update" },
  body: { en: "Dubai prices rose this quarter." },
  slug: "market-update",
  status: "draft" as const,
};

describe("blogPosts.list", () => {
  test("rejects an unauthenticated caller", async () => {
    const t = convexTest(schema, modules);
    await expect(t.query(api.blogPosts.list, {})).rejects.toThrow(ForbiddenError);
  });

  test("rejects an agent (no blogPosts:read permission)", async () => {
    const t = convexTest(schema, modules);
    const asAgent = await seedUser(t, "clerk|agent-1", "agent");
    await expect(asAgent.query(api.blogPosts.list, {})).rejects.toThrow(ForbiddenError);
  });

  test("an admin can list blog posts", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    await asAdmin.mutation(api.blogPosts.create, baseArgs);
    const posts = await asAdmin.query(api.blogPosts.list, {});
    expect(posts).toHaveLength(1);
  });

  test("an admin only sees blog posts they authored, not another admin's", async () => {
    const t = convexTest(schema, modules);
    const asAdmin1 = await seedUser(t, "clerk|admin-1", "admin");
    const asAdmin2 = await seedUser(t, "clerk|admin-2", "admin");
    await asAdmin1.mutation(api.blogPosts.create, baseArgs);
    await asAdmin2.mutation(api.blogPosts.create, { ...baseArgs, slug: "rental-tips", title: { en: "Rental Tips" } });

    expect(await asAdmin1.query(api.blogPosts.list, {})).toHaveLength(1);
    expect(await asAdmin2.query(api.blogPosts.list, {})).toHaveLength(1);
  });

  test("a super_admin sees blog posts authored by every admin", async () => {
    const t = convexTest(schema, modules);
    const asAdmin1 = await seedUser(t, "clerk|admin-1", "admin");
    const asAdmin2 = await seedUser(t, "clerk|admin-2", "admin");
    const asSuperAdmin = await seedUser(t, "clerk|super-1", "super_admin");
    await asAdmin1.mutation(api.blogPosts.create, baseArgs);
    await asAdmin2.mutation(api.blogPosts.create, { ...baseArgs, slug: "rental-tips", title: { en: "Rental Tips" } });

    expect(await asSuperAdmin.query(api.blogPosts.list, {})).toHaveLength(2);
  });
});

describe("blogPosts.get", () => {
  test("returns null for an admin viewing a blog post another admin authored", async () => {
    const t = convexTest(schema, modules);
    const asAdmin1 = await seedUser(t, "clerk|admin-1", "admin");
    const asAdmin2 = await seedUser(t, "clerk|admin-2", "admin");
    const id = await asAdmin1.mutation(api.blogPosts.create, baseArgs);

    expect(await asAdmin2.query(api.blogPosts.get, { id })).toBeNull();
  });
});

describe("blogPosts.create", () => {
  test("rejects a caller without blogPosts:create (agent)", async () => {
    const t = convexTest(schema, modules);
    const asAgent = await seedUser(t, "clerk|agent-1", "agent");
    await expect(asAgent.mutation(api.blogPosts.create, baseArgs)).rejects.toThrow(ForbiddenError);
  });

  test("sets publishing.updatedAt server-side and leaves publishedAt unset for a draft", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.blogPosts.create, baseArgs);
    const doc = await asAdmin.query(api.blogPosts.get, { id });
    expect(doc?.publishing.updatedAt).toBeTypeOf("number");
    expect(doc?.publishing.publishedAt).toBeUndefined();
  });

  test("sets publishedAt when created directly as published", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.blogPosts.create, { ...baseArgs, status: "published" });
    const doc = await asAdmin.query(api.blogPosts.get, { id });
    expect(doc?.publishing.publishedAt).toBeTypeOf("number");
  });

  test("rejects a duplicate slug", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    await asAdmin.mutation(api.blogPosts.create, baseArgs);
    await expect(
      asAdmin.mutation(api.blogPosts.create, { ...baseArgs, title: { en: "Another" } }),
    ).rejects.toThrow();
  });

  test("sets authorUserId to the creating admin's own user id", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.blogPosts.create, baseArgs);

    const adminUserId = await t.run(async (ctx) => {
      const user = await ctx.db
        .query("users")
        .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", "clerk|admin-1"))
        .unique();
      return user!._id;
    });

    const doc = await asAdmin.query(api.blogPosts.get, { id });
    expect(doc?.authorUserId).toBe(adminUserId);
  });
});

describe("blogPosts.update", () => {
  test("preserves publishedAt once set, across subsequent updates", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.blogPosts.create, { ...baseArgs, status: "published" });
    const original = await asAdmin.query(api.blogPosts.get, { id });
    const originalPublishedAt = original?.publishing.publishedAt;

    await asAdmin.mutation(api.blogPosts.update, {
      id,
      ...baseArgs,
      status: "published",
      title: { en: "Market Update Revised" },
    });
    const updated = await asAdmin.query(api.blogPosts.get, { id });
    expect(updated?.publishing.publishedAt).toBe(originalPublishedAt);
  });

  test("rejects a duplicate slug from a different document, but allows keeping its own slug", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const firstId = await asAdmin.mutation(api.blogPosts.create, baseArgs);
    const secondId = await asAdmin.mutation(api.blogPosts.create, {
      ...baseArgs,
      slug: "rental-tips",
      title: { en: "Rental Tips" },
    });

    await expect(
      asAdmin.mutation(api.blogPosts.update, { id: secondId, ...baseArgs, slug: "market-update" }),
    ).rejects.toThrow();

    // Updating the first document while keeping its own slug must succeed.
    // (Convex serializes a handler's implicit `undefined` return as `null`.)
    await expect(
      asAdmin.mutation(api.blogPosts.update, {
        id: firstId,
        ...baseArgs,
        title: { en: "Market Update Renamed" },
      }),
    ).resolves.toBeNull();
  });

  test("does not change authorUserId when its own author updates it", async () => {
    const t = convexTest(schema, modules);
    const asAdmin1 = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin1.mutation(api.blogPosts.create, baseArgs);
    const original = await asAdmin1.query(api.blogPosts.get, { id });
    const originalAuthorId = original?.authorUserId;

    await asAdmin1.mutation(api.blogPosts.update, {
      id,
      ...baseArgs,
      title: { en: "Updated by its own author" },
    });

    const updated = await asAdmin1.query(api.blogPosts.get, { id });
    expect(updated?.authorUserId).toBe(originalAuthorId);
  });

  test("rejects an admin updating a blog post another admin authored", async () => {
    const t = convexTest(schema, modules);
    const asAdmin1 = await seedUser(t, "clerk|admin-1", "admin");
    const asAdmin2 = await seedUser(t, "clerk|admin-2", "admin");
    const id = await asAdmin1.mutation(api.blogPosts.create, baseArgs);

    await expect(
      asAdmin2.mutation(api.blogPosts.update, { id, ...baseArgs, title: { en: "Hijacked" } }),
    ).rejects.toThrow(ForbiddenError);
  });

  test("a super_admin can update a blog post authored by any admin", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const asSuperAdmin = await seedUser(t, "clerk|super-1", "super_admin");
    const id = await asAdmin.mutation(api.blogPosts.create, baseArgs);

    await expect(
      asSuperAdmin.mutation(api.blogPosts.update, { id, ...baseArgs, title: { en: "Super Admin Edited" } }),
    ).resolves.toBeNull();
  });
});

describe("blogPosts.remove", () => {
  test("rejects a caller without blogPosts:delete (agent)", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.blogPosts.create, baseArgs);

    const asAgent = await seedUser(t, "clerk|agent-1", "agent");
    await expect(asAgent.mutation(api.blogPosts.remove, { id })).rejects.toThrow(ForbiddenError);
  });

  test("deletes the row and writes an audit log entry", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.blogPosts.create, baseArgs);

    await asAdmin.mutation(api.blogPosts.remove, { id });
    const doc = await asAdmin.query(api.blogPosts.get, { id });
    expect(doc).toBeNull();

    const auditLogs = await t.run(async (ctx) => await ctx.db.query("auditLogs").collect());
    expect(auditLogs.some((log) => log.resource === "blogPosts" && log.action === "delete")).toBe(true);
  });

  test("rejects an admin deleting a blog post another admin authored", async () => {
    const t = convexTest(schema, modules);
    const asAdmin1 = await seedUser(t, "clerk|admin-1", "admin");
    const asAdmin2 = await seedUser(t, "clerk|admin-2", "admin");
    const id = await asAdmin1.mutation(api.blogPosts.create, baseArgs);

    await expect(asAdmin2.mutation(api.blogPosts.remove, { id })).rejects.toThrow(ForbiddenError);
  });

  test("a super_admin can delete a blog post authored by any admin", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const asSuperAdmin = await seedUser(t, "clerk|super-1", "super_admin");
    const id = await asAdmin.mutation(api.blogPosts.create, baseArgs);

    await expect(asSuperAdmin.mutation(api.blogPosts.remove, { id })).resolves.toBeNull();
  });
});
