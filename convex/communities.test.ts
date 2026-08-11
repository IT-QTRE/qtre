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
  name: { en: "Downtown" },
  city: { en: "Dubai" },
  countryCode: "AE",
  slug: "downtown",
  status: "draft" as const,
};

describe("communities.list", () => {
  test("rejects an unauthenticated caller", async () => {
    const t = convexTest(schema, modules);
    await expect(t.query(api.communities.list, {})).rejects.toThrow(ForbiddenError);
  });

  test("an admin can list communities", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    await asAdmin.mutation(api.communities.create, baseArgs);
    const communities = await asAdmin.query(api.communities.list, {});
    expect(communities).toHaveLength(1);
  });
});

describe("communities.create", () => {
  test("rejects a caller without communities:create (agent)", async () => {
    const t = convexTest(schema, modules);
    const asAgent = await seedUser(t, "clerk|agent-1", "agent");
    await expect(asAgent.mutation(api.communities.create, baseArgs)).rejects.toThrow(ForbiddenError);
  });

  test("sets publishing.updatedAt server-side and leaves publishedAt unset for a draft", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.communities.create, baseArgs);
    const doc = await asAdmin.query(api.communities.get, { id });
    expect(doc?.publishing.updatedAt).toBeTypeOf("number");
    expect(doc?.publishing.publishedAt).toBeUndefined();
  });

  test("sets publishedAt when created directly as published", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.communities.create, { ...baseArgs, status: "published" });
    const doc = await asAdmin.query(api.communities.get, { id });
    expect(doc?.publishing.publishedAt).toBeTypeOf("number");
  });

  test("rejects a duplicate slug within the same country", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    await asAdmin.mutation(api.communities.create, baseArgs);
    await expect(
      asAdmin.mutation(api.communities.create, { ...baseArgs, name: { en: "Another Downtown" } }),
    ).rejects.toThrow();
  });

  test("allows the same slug in a different country", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    await asAdmin.mutation(api.communities.create, baseArgs);
    const secondId = await asAdmin.mutation(api.communities.create, {
      ...baseArgs,
      countryCode: "TR",
      name: { en: "Downtown Istanbul" },
      city: { en: "Istanbul" },
    });
    const doc = await asAdmin.query(api.communities.get, { id: secondId });
    expect(doc?.publishing.slug).toBe("downtown");
    expect(doc?.countryCode).toBe("TR");
  });
});

describe("communities.update", () => {
  test("preserves publishedAt once set, across subsequent updates", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.communities.create, { ...baseArgs, status: "published" });
    const original = await asAdmin.query(api.communities.get, { id });
    const originalPublishedAt = original?.publishing.publishedAt;

    await asAdmin.mutation(api.communities.update, {
      id,
      ...baseArgs,
      status: "published",
      name: { en: "Downtown Updated" },
    });
    const updated = await asAdmin.query(api.communities.get, { id });
    expect(updated?.publishing.publishedAt).toBe(originalPublishedAt);
  });

  test("rejects a duplicate slug from a different document in the same country, but allows keeping its own slug", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const firstId = await asAdmin.mutation(api.communities.create, baseArgs);
    const secondId = await asAdmin.mutation(api.communities.create, {
      ...baseArgs,
      slug: "marina",
      name: { en: "Marina" },
    });

    await expect(
      asAdmin.mutation(api.communities.update, { id: secondId, ...baseArgs, slug: "downtown" }),
    ).rejects.toThrow();

    await expect(
      asAdmin.mutation(api.communities.update, { id: firstId, ...baseArgs, name: { en: "Downtown Renamed" } }),
    ).resolves.toBeNull();
  });
});

describe("communities.remove", () => {
  test("rejects a caller without communities:delete (agent)", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.communities.create, baseArgs);

    const asAgent = await seedUser(t, "clerk|agent-1", "agent");
    await expect(asAgent.mutation(api.communities.remove, { id })).rejects.toThrow(ForbiddenError);
  });

  test("deletes the row and writes an audit log entry", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.communities.create, baseArgs);

    await asAdmin.mutation(api.communities.remove, { id });
    const doc = await asAdmin.query(api.communities.get, { id });
    expect(doc).toBeNull();

    const auditLogs = await t.run(async (ctx) => await ctx.db.query("auditLogs").collect());
    expect(auditLogs.some((log) => log.resource === "communities" && log.action === "delete")).toBe(true);
  });

  test("blocks deleting a community that still has a project referencing it", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.communities.create, baseArgs);

    await t.run(async (ctx) => {
      const admin = await ctx.db
        .query("users")
        .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", "clerk|admin-1"))
        .unique();
      const developerId = await ctx.db.insert("developers", {
        name: { en: "Emaar" },
        publishing: { slug: "emaar", status: "draft", updatedAt: Date.now() },
      });
      await ctx.db.insert("projects", {
        title: { en: "Marina Heights" },
        description: { en: "A tall tower" },
        developerId,
        communityId: id,
        countryCode: "AE",
        city: { en: "Dubai" },
        status: "upcoming",
        createdBy: admin!._id,
        publishing: { slug: "marina-heights", status: "draft", updatedAt: Date.now() },
      });
    });

    await expect(asAdmin.mutation(api.communities.remove, { id })).rejects.toThrow();
  });

  test("blocks deleting a community that still has a property referencing it", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.communities.create, baseArgs);

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
        communityId: id,
        createdBy: admin!._id,
        publishing: { slug: "unit-101", status: "draft", updatedAt: Date.now() },
      });
    });

    await expect(asAdmin.mutation(api.communities.remove, { id })).rejects.toThrow();
  });
});
