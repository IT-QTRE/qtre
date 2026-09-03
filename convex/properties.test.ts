import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
import { ForbiddenError } from "./lib/permissions";

const modules = import.meta.glob("./**/*.ts");

async function seedUser(t: ReturnType<typeof convexTest>, tokenIdentifier: string, role: "super_admin" | "admin" | "agent" | "client") {
  const userId = await t.run(async (ctx) =>
    ctx.db.insert("users", {
      tokenIdentifier,
      email: `${tokenIdentifier}@example.com`,
      name: tokenIdentifier,
      role,
      createdAt: Date.now(),
    }),
  );
  return { client: t.withIdentity({ tokenIdentifier }), userId };
}

async function seedAgentProfile(t: ReturnType<typeof convexTest>, userId?: Awaited<ReturnType<typeof seedUser>>["userId"]) {
  return await t.run(async (ctx) =>
    ctx.db.insert("agents", {
      name: "Jane Doe",
      email: "jane@example.com",
      userId,
      publishing: { slug: "jane-doe", status: "draft", updatedAt: Date.now() },
    }),
  );
}

const baseArgs = {
  price: 500000,
  bedrooms: 2,
  bathrooms: 2,
  areaSqft: 1200,
  countryCode: "AE",
  title: { en: "Marina Unit 101" },
  description: { en: "A lovely unit" },
  city: { en: "Dubai" },
  listingStatus: "for_sale" as const,
  slug: "marina-unit-101",
  status: "draft" as const,
};

describe("properties.list", () => {
  test("rejects an unauthenticated caller", async () => {
    const t = convexTest(schema, modules);
    await expect(t.query(api.properties.list, {})).rejects.toThrow(ForbiddenError);
  });

  test("rejects a client (no properties:read permission)", async () => {
    const t = convexTest(schema, modules);
    const { client: asClient } = await seedUser(t, "clerk|client-1", "client");
    await expect(asClient.query(api.properties.list, {})).rejects.toThrow(ForbiddenError);
  });

  test("an admin can list properties", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    await asAdmin.mutation(api.properties.create, baseArgs);
    const properties = await asAdmin.query(api.properties.list, {});
    expect(properties).toHaveLength(1);
  });

  test("an agent can list properties (read-only)", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    await asAdmin.mutation(api.properties.create, baseArgs);
    const { client: asAgent } = await seedUser(t, "clerk|agent-1", "agent");
    const properties = await asAgent.query(api.properties.list, {});
    expect(properties).toHaveLength(1);
  });

  test("an admin only sees properties they created, not another admin's", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin1 } = await seedUser(t, "clerk|admin-1", "admin");
    const { client: asAdmin2 } = await seedUser(t, "clerk|admin-2", "admin");
    await asAdmin1.mutation(api.properties.create, baseArgs);
    await asAdmin2.mutation(api.properties.create, { ...baseArgs, slug: "other-unit", title: { en: "Other Unit" } });

    expect(await asAdmin1.query(api.properties.list, {})).toHaveLength(1);
    expect(await asAdmin2.query(api.properties.list, {})).toHaveLength(1);
  });

  test("a super_admin sees properties created by every admin", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin1 } = await seedUser(t, "clerk|admin-1", "admin");
    const { client: asAdmin2 } = await seedUser(t, "clerk|admin-2", "admin");
    const { client: asSuperAdmin } = await seedUser(t, "clerk|super-1", "super_admin");
    await asAdmin1.mutation(api.properties.create, baseArgs);
    await asAdmin2.mutation(api.properties.create, { ...baseArgs, slug: "other-unit", title: { en: "Other Unit" } });

    expect(await asSuperAdmin.query(api.properties.list, {})).toHaveLength(2);
  });
});

describe("properties.get", () => {
  test("returns null for an admin viewing a property another admin created", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin1 } = await seedUser(t, "clerk|admin-1", "admin");
    const { client: asAdmin2 } = await seedUser(t, "clerk|admin-2", "admin");
    const id = await asAdmin1.mutation(api.properties.create, baseArgs);

    expect(await asAdmin2.query(api.properties.get, { id })).toBeNull();
  });

  test("a super_admin can view a property created by any admin", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const { client: asSuperAdmin } = await seedUser(t, "clerk|super-1", "super_admin");
    const id = await asAdmin.mutation(api.properties.create, baseArgs);

    const doc = await asSuperAdmin.query(api.properties.get, { id });
    expect(doc?._id).toBe(id);
  });
});

describe("properties.listNames / getName", () => {
  test("resolves a property's name regardless of which admin created it", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin1 } = await seedUser(t, "clerk|admin-1", "admin");
    const { client: asAdmin2 } = await seedUser(t, "clerk|admin-2", "admin");
    const id = await asAdmin1.mutation(api.properties.create, baseArgs);

    const names = await asAdmin2.query(api.properties.listNames, {});
    expect(names).toEqual([{ _id: id, title: "Marina Unit 101" }]);

    const name = await asAdmin2.query(api.properties.getName, { id });
    expect(name).toEqual({ _id: id, title: "Marina Unit 101" });
  });
});

describe("properties.create", () => {
  test("rejects a caller without properties:create (agent only has read/update)", async () => {
    const t = convexTest(schema, modules);
    const { client: asAgent } = await seedUser(t, "clerk|agent-1", "agent");
    await expect(asAgent.mutation(api.properties.create, baseArgs)).rejects.toThrow(ForbiddenError);
  });

  test("sets publishing.updatedAt server-side and leaves publishedAt unset for a draft", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.properties.create, baseArgs);
    const doc = await asAdmin.query(api.properties.get, { id });
    expect(doc?.publishing.updatedAt).toBeTypeOf("number");
    expect(doc?.publishing.publishedAt).toBeUndefined();
  });

  test("sets publishedAt when created directly as published", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.properties.create, { ...baseArgs, status: "published" });
    const doc = await asAdmin.query(api.properties.get, { id });
    expect(doc?.publishing.publishedAt).toBeTypeOf("number");
  });

  test("rejects a duplicate slug", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    await asAdmin.mutation(api.properties.create, baseArgs);
    await expect(
      asAdmin.mutation(api.properties.create, { ...baseArgs, title: { en: "Another Unit" } }),
    ).rejects.toThrow();
  });
});

describe("properties.update", () => {
  test("preserves publishedAt once set, across subsequent updates", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.properties.create, { ...baseArgs, status: "published" });
    const original = await asAdmin.query(api.properties.get, { id });
    const originalPublishedAt = original?.publishing.publishedAt;

    await asAdmin.mutation(api.properties.update, { id, ...baseArgs, status: "published", title: { en: "Updated Unit" } });
    const updated = await asAdmin.query(api.properties.get, { id });
    expect(updated?.publishing.publishedAt).toBe(originalPublishedAt);
  });

  test("rejects a duplicate slug from a different document, but allows keeping its own slug", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const firstId = await asAdmin.mutation(api.properties.create, baseArgs);
    const secondId = await asAdmin.mutation(api.properties.create, { ...baseArgs, slug: "other-unit", title: { en: "Other Unit" } });

    await expect(
      asAdmin.mutation(api.properties.update, { id: secondId, ...baseArgs, slug: "marina-unit-101" }),
    ).rejects.toThrow();

    await expect(
      asAdmin.mutation(api.properties.update, { id: firstId, ...baseArgs, title: { en: "Renamed Unit" } }),
    ).resolves.toBeNull();
  });

  test("an admin can update any property regardless of its assigned agent", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const { userId: otherAgentUserId } = await seedUser(t, "clerk|agent-2", "agent");
    const otherAgentProfileId = await seedAgentProfile(t, otherAgentUserId);
    const id = await asAdmin.mutation(api.properties.create, { ...baseArgs, agentId: otherAgentProfileId });

    await expect(
      asAdmin.mutation(api.properties.update, { id, ...baseArgs, agentId: otherAgentProfileId, title: { en: "Admin Edited" } }),
    ).resolves.toBeNull();
  });

  test("an agent can update a property assigned to their own agent profile", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const { client: asAgent, userId: agentUserId } = await seedUser(t, "clerk|agent-1", "agent");
    const agentProfileId = await seedAgentProfile(t, agentUserId);
    const id = await asAdmin.mutation(api.properties.create, { ...baseArgs, agentId: agentProfileId });

    await expect(
      asAgent.mutation(api.properties.update, { id, ...baseArgs, agentId: agentProfileId, title: { en: "Agent Edited" } }),
    ).resolves.toBeNull();
  });

  test("rejects an agent updating a property assigned to a different agent", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const { userId: ownerAgentUserId } = await seedUser(t, "clerk|agent-owner", "agent");
    const ownerAgentProfileId = await seedAgentProfile(t, ownerAgentUserId);
    const id = await asAdmin.mutation(api.properties.create, { ...baseArgs, agentId: ownerAgentProfileId });

    const { client: asOtherAgent, userId: otherAgentUserId } = await seedUser(t, "clerk|agent-other", "agent");
    await seedAgentProfile(t, otherAgentUserId);

    await expect(
      asOtherAgent.mutation(api.properties.update, { id, ...baseArgs, agentId: ownerAgentProfileId, title: { en: "Hijacked" } }),
    ).rejects.toThrow(ForbiddenError);
  });

  test("rejects an agent with no agent profile at all from updating any property", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.properties.create, baseArgs);

    const { client: asAgent } = await seedUser(t, "clerk|agent-no-profile", "agent");
    await expect(asAgent.mutation(api.properties.update, { id, ...baseArgs, title: { en: "Should fail" } })).rejects.toThrow(
      ForbiddenError,
    );
  });

  test("rejects an admin updating a property another admin created", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin1 } = await seedUser(t, "clerk|admin-1", "admin");
    const { client: asAdmin2 } = await seedUser(t, "clerk|admin-2", "admin");
    const id = await asAdmin1.mutation(api.properties.create, baseArgs);

    await expect(
      asAdmin2.mutation(api.properties.update, { id, ...baseArgs, title: { en: "Hijacked" } }),
    ).rejects.toThrow(ForbiddenError);
  });

  test("clears an optional community relation when omitted on update", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const communityId = await t.run(async (ctx) =>
      ctx.db.insert("communities", {
        name: { en: "Marina" },
        city: { en: "Dubai" },
        countryCode: "AE",
        publishing: { slug: "marina", status: "published", updatedAt: Date.now() },
      }),
    );
    const id = await asAdmin.mutation(api.properties.create, { ...baseArgs, communityId });
    expect((await asAdmin.query(api.properties.get, { id }))?.communityId).toBe(communityId);

    await asAdmin.mutation(api.properties.update, { id, ...baseArgs });
    expect((await asAdmin.query(api.properties.get, { id }))?.communityId).toBeUndefined();
  });

  test("clears optional location fields when omitted on update", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.properties.create, {
      ...baseArgs,
      address: "Marina Heights, Dubai Marina",
      placeId: "ChIJtest",
      coordinates: { lat: 25.077, lng: 55.139 },
    });
    expect((await asAdmin.query(api.properties.get, { id }))?.coordinates).toEqual({ lat: 25.077, lng: 55.139 });

    await asAdmin.mutation(api.properties.update, { id, ...baseArgs });
    const updated = await asAdmin.query(api.properties.get, { id });
    expect(updated?.address).toBeUndefined();
    expect(updated?.placeId).toBeUndefined();
    expect(updated?.coordinates).toBeUndefined();
  });

  test("stores optional type, furnishing, and rental period, and drops them when omitted", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.properties.create, {
      ...baseArgs,
      listingStatus: "for_rent",
      propertyType: "apartment",
      furnishing: "unfurnished",
      rentalPeriod: "yearly",
    });
    const created = await asAdmin.query(api.properties.get, { id });
    expect(created?.propertyType).toBe("apartment");
    expect(created?.furnishing).toBe("unfurnished");
    expect(created?.rentalPeriod).toBe("yearly");

    await asAdmin.mutation(api.properties.update, { id, ...baseArgs, listingStatus: "for_sale" });
    const updated = await asAdmin.query(api.properties.get, { id });
    expect(updated?.propertyType).toBeUndefined();
    expect(updated?.furnishing).toBeUndefined();
    expect(updated?.rentalPeriod).toBeUndefined();
  });

  test("does not persist rental period on a sale listing", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.properties.create, {
      ...baseArgs,
      listingStatus: "for_sale",
      rentalPeriod: "yearly",
    });
    expect((await asAdmin.query(api.properties.get, { id }))?.rentalPeriod).toBeUndefined();
  });

  test("a super_admin can update a property created by any admin", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const { client: asSuperAdmin } = await seedUser(t, "clerk|super-1", "super_admin");
    const id = await asAdmin.mutation(api.properties.create, baseArgs);

    await expect(
      asSuperAdmin.mutation(api.properties.update, { id, ...baseArgs, title: { en: "Super Admin Edited" } }),
    ).resolves.toBeNull();
  });
});

describe("properties.remove", () => {
  test("rejects a caller without properties:delete (agent role)", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.properties.create, baseArgs);

    const { client: asAgent } = await seedUser(t, "clerk|agent-1", "agent");
    await expect(asAgent.mutation(api.properties.remove, { id })).rejects.toThrow(ForbiddenError);
  });

  test("deletes the row and writes an audit log entry", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.properties.create, baseArgs);

    await asAdmin.mutation(api.properties.remove, { id });
    const doc = await asAdmin.query(api.properties.get, { id });
    expect(doc).toBeNull();

    const auditLogs = await t.run(async (ctx) => await ctx.db.query("auditLogs").collect());
    expect(auditLogs.some((log) => log.resource === "properties" && log.action === "delete")).toBe(true);
  });

  test("rejects an admin deleting a property another admin created", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin1 } = await seedUser(t, "clerk|admin-1", "admin");
    const { client: asAdmin2 } = await seedUser(t, "clerk|admin-2", "admin");
    const id = await asAdmin1.mutation(api.properties.create, baseArgs);

    await expect(asAdmin2.mutation(api.properties.remove, { id })).rejects.toThrow(ForbiddenError);
  });

  test("a super_admin can delete a property created by any admin", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const { client: asSuperAdmin } = await seedUser(t, "clerk|super-1", "super_admin");
    const id = await asAdmin.mutation(api.properties.create, baseArgs);

    await expect(asSuperAdmin.mutation(api.properties.remove, { id })).resolves.toBeNull();
  });
});

describe("properties.setPublishingStatus", () => {
  test("publishes a draft, keeps the slug, and sets publishedAt", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.properties.create, baseArgs);

    await asAdmin.mutation(api.properties.setPublishingStatus, { id, status: "published" });
    const doc = await asAdmin.query(api.properties.get, { id });
    expect(doc?.publishing.status).toBe("published");
    expect(doc?.publishing.slug).toBe("marina-unit-101");
    expect(doc?.publishing.publishedAt).toEqual(expect.any(Number));
  });

  test("moves a published listing to draft without clearing publishedAt or slug", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.properties.create, { ...baseArgs, status: "published" });
    const published = await asAdmin.query(api.properties.get, { id });

    await asAdmin.mutation(api.properties.setPublishingStatus, { id, status: "draft" });
    const doc = await asAdmin.query(api.properties.get, { id });
    expect(doc?.publishing.status).toBe("draft");
    expect(doc?.publishing.slug).toBe("marina-unit-101");
    expect(doc?.publishing.publishedAt).toBe(published?.publishing.publishedAt);
  });

  test("rejects an admin toggling a property another admin created", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin1 } = await seedUser(t, "clerk|admin-1", "admin");
    const { client: asAdmin2 } = await seedUser(t, "clerk|admin-2", "admin");
    const id = await asAdmin1.mutation(api.properties.create, baseArgs);

    await expect(asAdmin2.mutation(api.properties.setPublishingStatus, { id, status: "published" })).rejects.toThrow(
      ForbiddenError,
    );
  });

  test("an agent can publish a property assigned to their own agent profile", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const { client: asAgent, userId: agentUserId } = await seedUser(t, "clerk|agent-1", "agent");
    const agentProfileId = await seedAgentProfile(t, agentUserId);
    const id = await asAdmin.mutation(api.properties.create, { ...baseArgs, agentId: agentProfileId });

    await expect(asAgent.mutation(api.properties.setPublishingStatus, { id, status: "published" })).resolves.toBeNull();
  });

  test("rejects an agent publishing a property assigned to a different agent", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const { userId: ownerAgentUserId } = await seedUser(t, "clerk|agent-owner", "agent");
    const ownerAgentProfileId = await seedAgentProfile(t, ownerAgentUserId);
    const id = await asAdmin.mutation(api.properties.create, { ...baseArgs, agentId: ownerAgentProfileId });

    const { client: asOtherAgent, userId: otherAgentUserId } = await seedUser(t, "clerk|agent-other", "agent");
    await seedAgentProfile(t, otherAgentUserId);

    await expect(asOtherAgent.mutation(api.properties.setPublishingStatus, { id, status: "published" })).rejects.toThrow(
      ForbiddenError,
    );
  });
});
