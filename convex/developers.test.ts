/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
import { ForbiddenError } from "./lib/permissions";

const modules = import.meta.glob("./**/*.ts");

async function seedUser(t: ReturnType<typeof convexTest>, tokenIdentifier: string, role: "admin" | "agent" | "client") {
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
  name: { en: "Emaar" },
  slug: "emaar",
  status: "draft" as const,
};

describe("developers.list", () => {
  test("rejects an unauthenticated caller", async () => {
    const t = convexTest(schema, modules);
    await expect(t.query(api.developers.list, {})).rejects.toThrow(ForbiddenError);
  });

  test("rejects a client (no developers:read permission)", async () => {
    const t = convexTest(schema, modules);
    const asClient = await seedUser(t, "clerk|client-1", "client");
    await expect(asClient.query(api.developers.list, {})).rejects.toThrow(ForbiddenError);
  });

  test("an admin can list developers", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    await asAdmin.mutation(api.developers.create, baseArgs);
    const developers = await asAdmin.query(api.developers.list, {});
    expect(developers).toHaveLength(1);
  });
});

describe("developers.create", () => {
  test("rejects a caller without developers:create (agent)", async () => {
    const t = convexTest(schema, modules);
    const asAgent = await seedUser(t, "clerk|agent-1", "agent");
    await expect(asAgent.mutation(api.developers.create, baseArgs)).rejects.toThrow(ForbiddenError);
  });

  test("sets publishing.updatedAt server-side and leaves publishedAt unset for a draft", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.developers.create, baseArgs);
    const doc = await asAdmin.query(api.developers.get, { id });
    expect(doc?.publishing.updatedAt).toBeTypeOf("number");
    expect(doc?.publishing.publishedAt).toBeUndefined();
  });

  test("sets publishedAt when created directly as published", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.developers.create, { ...baseArgs, status: "published" });
    const doc = await asAdmin.query(api.developers.get, { id });
    expect(doc?.publishing.publishedAt).toBeTypeOf("number");
  });

  test("rejects a duplicate slug", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    await asAdmin.mutation(api.developers.create, baseArgs);
    await expect(asAdmin.mutation(api.developers.create, { ...baseArgs, name: { en: "Another" } })).rejects.toThrow();
  });
});

describe("developers.update", () => {
  test("preserves publishedAt once set, across subsequent updates", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.developers.create, { ...baseArgs, status: "published" });
    const original = await asAdmin.query(api.developers.get, { id });
    const originalPublishedAt = original?.publishing.publishedAt;

    await asAdmin.mutation(api.developers.update, { id, ...baseArgs, status: "published", name: { en: "Emaar Updated" } });
    const updated = await asAdmin.query(api.developers.get, { id });
    expect(updated?.publishing.publishedAt).toBe(originalPublishedAt);
  });

  test("rejects a duplicate slug from a different document, but allows keeping its own slug", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const firstId = await asAdmin.mutation(api.developers.create, baseArgs);
    const secondId = await asAdmin.mutation(api.developers.create, { ...baseArgs, slug: "damac", name: { en: "Damac" } });

    await expect(asAdmin.mutation(api.developers.update, { id: secondId, ...baseArgs, slug: "emaar" })).rejects.toThrow();

    // Updating the first document while keeping its own slug must succeed.
    // (Convex serializes a handler's implicit `undefined` return as `null`.)
    await expect(
      asAdmin.mutation(api.developers.update, { id: firstId, ...baseArgs, name: { en: "Emaar Renamed" } }),
    ).resolves.toBeNull();
  });
});

describe("developers.remove", () => {
  test("rejects a caller without developers:delete (agent)", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.developers.create, baseArgs);

    const asAgent = await seedUser(t, "clerk|agent-1", "agent");
    await expect(asAgent.mutation(api.developers.remove, { id })).rejects.toThrow(ForbiddenError);
  });

  test("deletes the row and writes an audit log entry", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.developers.create, baseArgs);

    await asAdmin.mutation(api.developers.remove, { id });
    const doc = await asAdmin.query(api.developers.get, { id });
    expect(doc).toBeNull();

    const auditLogs = await t.run(async (ctx) => await ctx.db.query("auditLogs").collect());
    expect(auditLogs.some((log) => log.resource === "developers" && log.action === "delete")).toBe(true);
  });

  test("blocks deleting a developer that still has a project referencing it", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.developers.create, baseArgs);

    await t.run(async (ctx) => {
      const admin = await ctx.db
        .query("users")
        .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", "clerk|admin-1"))
        .unique();
      await ctx.db.insert("projects", {
        title: { en: "Marina Heights" },
        description: { en: "A tall tower" },
        developerId: id,
        countryCode: "AE",
        city: { en: "Dubai" },
        status: "upcoming",
        createdBy: admin!._id,
        publishing: { slug: "marina-heights", status: "draft", updatedAt: Date.now() },
      });
    });

    await expect(asAdmin.mutation(api.developers.remove, { id })).rejects.toThrow();
  });

  test("blocks deleting a developer that still has a property referencing it", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.developers.create, baseArgs);

    await t.run(async (ctx) => {
      const admin = await ctx.db
        .query("users")
        .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", "clerk|admin-1"))
        .unique();
      await ctx.db.insert("properties", {
        price: 500000,
        bedrooms: 2,
        bathrooms: 2,
        areaSqft: 1200,
        countryCode: "AE",
        title: { en: "Unit 101" },
        description: { en: "A unit" },
        city: { en: "Dubai" },
        listingStatus: "for_sale",
        developerId: id,
        createdBy: admin!._id,
        publishing: { slug: "unit-101", status: "draft", updatedAt: Date.now() },
      });
    });

    await expect(asAdmin.mutation(api.developers.remove, { id })).rejects.toThrow();
  });
});
