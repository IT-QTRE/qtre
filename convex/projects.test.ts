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

async function seedDeveloper(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) =>
    ctx.db.insert("developers", {
      name: { en: "Emaar" },
      publishing: { slug: "emaar", status: "draft", updatedAt: Date.now() },
    }),
  );
}

function baseArgs(developerId: Awaited<ReturnType<typeof seedDeveloper>>) {
  return {
    title: { en: "Marina Heights" },
    description: { en: "A tall tower" },
    developerId,
    countryCode: "AE",
    city: { en: "Dubai" },
    status: "upcoming" as const,
    slug: "marina-heights",
    publishingStatus: "draft" as const,
  };
}

describe("projects.list", () => {
  test("rejects an unauthenticated caller", async () => {
    const t = convexTest(schema, modules);
    await expect(t.query(api.projects.list, {})).rejects.toThrow(ForbiddenError);
  });

  test("rejects a client (no projects:read permission)", async () => {
    const t = convexTest(schema, modules);
    const asClient = await seedUser(t, "clerk|client-1", "client");
    await expect(asClient.query(api.projects.list, {})).rejects.toThrow(ForbiddenError);
  });

  test("an admin can list projects", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const developerId = await seedDeveloper(t);
    await asAdmin.mutation(api.projects.create, baseArgs(developerId));
    const projects = await asAdmin.query(api.projects.list, {});
    expect(projects).toHaveLength(1);
  });

  test("an admin only sees projects they created, not another admin's", async () => {
    const t = convexTest(schema, modules);
    const asAdmin1 = await seedUser(t, "clerk|admin-1", "admin");
    const asAdmin2 = await seedUser(t, "clerk|admin-2", "admin");
    const developerId = await seedDeveloper(t);
    await asAdmin1.mutation(api.projects.create, baseArgs(developerId));
    await asAdmin2.mutation(api.projects.create, { ...baseArgs(developerId), slug: "other-tower", title: { en: "Other Tower" } });

    expect(await asAdmin1.query(api.projects.list, {})).toHaveLength(1);
    expect(await asAdmin2.query(api.projects.list, {})).toHaveLength(1);
  });

  test("a super_admin sees projects created by every admin", async () => {
    const t = convexTest(schema, modules);
    const asAdmin1 = await seedUser(t, "clerk|admin-1", "admin");
    const asAdmin2 = await seedUser(t, "clerk|admin-2", "admin");
    const asSuperAdmin = await seedUser(t, "clerk|super-1", "super_admin");
    const developerId = await seedDeveloper(t);
    await asAdmin1.mutation(api.projects.create, baseArgs(developerId));
    await asAdmin2.mutation(api.projects.create, { ...baseArgs(developerId), slug: "other-tower", title: { en: "Other Tower" } });

    expect(await asSuperAdmin.query(api.projects.list, {})).toHaveLength(2);
  });
});

describe("projects.get", () => {
  test("returns null for an admin viewing a project another admin created", async () => {
    const t = convexTest(schema, modules);
    const asAdmin1 = await seedUser(t, "clerk|admin-1", "admin");
    const asAdmin2 = await seedUser(t, "clerk|admin-2", "admin");
    const developerId = await seedDeveloper(t);
    const id = await asAdmin1.mutation(api.projects.create, baseArgs(developerId));

    expect(await asAdmin2.query(api.projects.get, { id })).toBeNull();
  });
});

describe("projects.listNames / getName", () => {
  test("resolves a project's name regardless of which admin created it", async () => {
    const t = convexTest(schema, modules);
    const asAdmin1 = await seedUser(t, "clerk|admin-1", "admin");
    const asAdmin2 = await seedUser(t, "clerk|admin-2", "admin");
    const developerId = await seedDeveloper(t);
    const id = await asAdmin1.mutation(api.projects.create, baseArgs(developerId));

    const names = await asAdmin2.query(api.projects.listNames, {});
    expect(names).toEqual([{ _id: id, title: "Marina Heights" }]);

    const name = await asAdmin2.query(api.projects.getName, { id });
    expect(name).toEqual({ _id: id, title: "Marina Heights" });
  });
});

describe("projects.create", () => {
  test("rejects a caller without projects:create (agent only has read/update)", async () => {
    const t = convexTest(schema, modules);
    const asAgent = await seedUser(t, "clerk|agent-1", "agent");
    const developerId = await seedDeveloper(t);
    await expect(asAgent.mutation(api.projects.create, baseArgs(developerId))).rejects.toThrow(ForbiddenError);
  });

  test("sets publishing.updatedAt server-side and leaves publishedAt unset for a draft", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const developerId = await seedDeveloper(t);
    const id = await asAdmin.mutation(api.projects.create, baseArgs(developerId));
    const doc = await asAdmin.query(api.projects.get, { id });
    expect(doc?.publishing.updatedAt).toBeTypeOf("number");
    expect(doc?.publishing.publishedAt).toBeUndefined();
  });

  test("sets publishedAt when created directly as published", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const developerId = await seedDeveloper(t);
    const id = await asAdmin.mutation(api.projects.create, { ...baseArgs(developerId), publishingStatus: "published" });
    const doc = await asAdmin.query(api.projects.get, { id });
    expect(doc?.publishing.publishedAt).toBeTypeOf("number");
  });

  test("rejects a duplicate slug", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const developerId = await seedDeveloper(t);
    await asAdmin.mutation(api.projects.create, baseArgs(developerId));
    await expect(
      asAdmin.mutation(api.projects.create, { ...baseArgs(developerId), title: { en: "Another" } }),
    ).rejects.toThrow();
  });

  test("stores an optional portal-style completion date", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const developerId = await seedDeveloper(t);
    const id = await asAdmin.mutation(api.projects.create, {
      ...baseArgs(developerId),
      completionDate: { quarter: 4, year: 2027 },
    });
    const doc = await asAdmin.query(api.projects.get, { id });
    expect(doc?.completionDate).toEqual({ quarter: 4, year: 2027 });
  });
});

describe("projects.update", () => {
  test("preserves publishedAt once set, across subsequent updates", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const developerId = await seedDeveloper(t);
    const id = await asAdmin.mutation(api.projects.create, { ...baseArgs(developerId), publishingStatus: "published" });
    const original = await asAdmin.query(api.projects.get, { id });
    const originalPublishedAt = original?.publishing.publishedAt;

    await asAdmin.mutation(api.projects.update, {
      id,
      ...baseArgs(developerId),
      publishingStatus: "published",
      title: { en: "Marina Heights Updated" },
    });
    const updated = await asAdmin.query(api.projects.get, { id });
    expect(updated?.publishing.publishedAt).toBe(originalPublishedAt);
  });

  test("rejects a duplicate slug from a different document, but allows keeping its own slug", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const developerId = await seedDeveloper(t);
    const firstId = await asAdmin.mutation(api.projects.create, baseArgs(developerId));
    const secondId = await asAdmin.mutation(api.projects.create, {
      ...baseArgs(developerId),
      slug: "other-tower",
      title: { en: "Other Tower" },
    });

    await expect(
      asAdmin.mutation(api.projects.update, { id: secondId, ...baseArgs(developerId), slug: "marina-heights" }),
    ).rejects.toThrow();

    await expect(
      asAdmin.mutation(api.projects.update, { id: firstId, ...baseArgs(developerId), title: { en: "Renamed" } }),
    ).resolves.toBeNull();
  });

  test("rejects an admin updating a project another admin created", async () => {
    const t = convexTest(schema, modules);
    const asAdmin1 = await seedUser(t, "clerk|admin-1", "admin");
    const asAdmin2 = await seedUser(t, "clerk|admin-2", "admin");
    const developerId = await seedDeveloper(t);
    const id = await asAdmin1.mutation(api.projects.create, baseArgs(developerId));

    await expect(
      asAdmin2.mutation(api.projects.update, { id, ...baseArgs(developerId), title: { en: "Hijacked" } }),
    ).rejects.toThrow(ForbiddenError);
  });

  test("a super_admin can update a project created by any admin", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const asSuperAdmin = await seedUser(t, "clerk|super-1", "super_admin");
    const developerId = await seedDeveloper(t);
    const id = await asAdmin.mutation(api.projects.create, baseArgs(developerId));

    await expect(
      asSuperAdmin.mutation(api.projects.update, { id, ...baseArgs(developerId), title: { en: "Super Admin Edited" } }),
    ).resolves.toBeNull();
  });

  test("clears completionDate when the update omits it", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const developerId = await seedDeveloper(t);
    const id = await asAdmin.mutation(api.projects.create, {
      ...baseArgs(developerId),
      completionDate: { quarter: 4, year: 2027 },
    });

    await asAdmin.mutation(api.projects.update, { id, ...baseArgs(developerId) });
    const updated = await asAdmin.query(api.projects.get, { id });
    expect(updated?.completionDate).toBeUndefined();
  });
});

describe("projects.remove", () => {
  test("rejects a caller without projects:delete (agent role)", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const developerId = await seedDeveloper(t);
    const id = await asAdmin.mutation(api.projects.create, baseArgs(developerId));

    const asAgent = await seedUser(t, "clerk|agent-1", "agent");
    await expect(asAgent.mutation(api.projects.remove, { id })).rejects.toThrow(ForbiddenError);
  });

  test("deletes the row and writes an audit log entry", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const developerId = await seedDeveloper(t);
    const id = await asAdmin.mutation(api.projects.create, baseArgs(developerId));

    await asAdmin.mutation(api.projects.remove, { id });
    const doc = await asAdmin.query(api.projects.get, { id });
    expect(doc).toBeNull();

    const auditLogs = await t.run(async (ctx) => await ctx.db.query("auditLogs").collect());
    expect(auditLogs.some((log) => log.resource === "projects" && log.action === "delete")).toBe(true);
  });

  test("blocks deleting a project that still has properties referencing it", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const developerId = await seedDeveloper(t);
    const id = await asAdmin.mutation(api.projects.create, baseArgs(developerId));

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
        projectId: id,
        createdBy: admin!._id,
        publishing: { slug: "unit-101", status: "draft", updatedAt: Date.now() },
      });
    });

    await expect(asAdmin.mutation(api.projects.remove, { id })).rejects.toThrow();
  });

  test("rejects an admin deleting a project another admin created", async () => {
    const t = convexTest(schema, modules);
    const asAdmin1 = await seedUser(t, "clerk|admin-1", "admin");
    const asAdmin2 = await seedUser(t, "clerk|admin-2", "admin");
    const developerId = await seedDeveloper(t);
    const id = await asAdmin1.mutation(api.projects.create, baseArgs(developerId));

    await expect(asAdmin2.mutation(api.projects.remove, { id })).rejects.toThrow(ForbiddenError);
  });

  test("a super_admin can delete a project created by any admin", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const asSuperAdmin = await seedUser(t, "clerk|super-1", "super_admin");
    const developerId = await seedDeveloper(t);
    const id = await asAdmin.mutation(api.projects.create, baseArgs(developerId));

    await expect(asSuperAdmin.mutation(api.projects.remove, { id })).resolves.toBeNull();
  });
});

describe("projects.setPublishingStatus", () => {
  test("publishes a draft, keeps the slug, and sets publishedAt", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const developerId = await seedDeveloper(t);
    const id = await asAdmin.mutation(api.projects.create, baseArgs(developerId));

    await asAdmin.mutation(api.projects.setPublishingStatus, { id, status: "published" });
    const doc = await asAdmin.query(api.projects.get, { id });
    expect(doc?.publishing.status).toBe("published");
    expect(doc?.publishing.slug).toBe("marina-heights");
    expect(doc?.publishing.publishedAt).toEqual(expect.any(Number));
  });

  test("moves a published project to draft without clearing publishedAt or slug", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const developerId = await seedDeveloper(t);
    const id = await asAdmin.mutation(api.projects.create, { ...baseArgs(developerId), publishingStatus: "published" });
    const published = await asAdmin.query(api.projects.get, { id });

    await asAdmin.mutation(api.projects.setPublishingStatus, { id, status: "draft" });
    const doc = await asAdmin.query(api.projects.get, { id });
    expect(doc?.publishing.status).toBe("draft");
    expect(doc?.publishing.slug).toBe("marina-heights");
    expect(doc?.publishing.publishedAt).toBe(published?.publishing.publishedAt);
  });

  test("rejects an admin toggling a project another admin created", async () => {
    const t = convexTest(schema, modules);
    const asAdmin1 = await seedUser(t, "clerk|admin-1", "admin");
    const asAdmin2 = await seedUser(t, "clerk|admin-2", "admin");
    const developerId = await seedDeveloper(t);
    const id = await asAdmin1.mutation(api.projects.create, baseArgs(developerId));

    await expect(asAdmin2.mutation(api.projects.setPublishingStatus, { id, status: "published" })).rejects.toThrow(
      ForbiddenError,
    );
  });
});
