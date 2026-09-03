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
  name: "Jane Doe",
  email: "jane@example.com",
  slug: "jane-doe",
  status: "draft" as const,
};

describe("agents.list", () => {
  test("rejects an unauthenticated caller", async () => {
    const t = convexTest(schema, modules);
    await expect(t.query(api.agents.list, {})).rejects.toThrow(ForbiddenError);
  });

  test("rejects a client (no agents:read permission)", async () => {
    const t = convexTest(schema, modules);
    const asClient = await seedUser(t, "clerk|client-1", "client");
    await expect(asClient.query(api.agents.list, {})).rejects.toThrow(ForbiddenError);
  });

  test("an admin can list agents", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    await asAdmin.mutation(api.agents.create, baseArgs);
    const agents = await asAdmin.query(api.agents.list, {});
    expect(agents).toHaveLength(1);
  });
});

describe("agents.create", () => {
  test("rejects a caller without agents:create (agent role)", async () => {
    const t = convexTest(schema, modules);
    const asAgent = await seedUser(t, "clerk|agent-1", "agent");
    await expect(asAgent.mutation(api.agents.create, baseArgs)).rejects.toThrow(ForbiddenError);
  });

  test("sets publishing.updatedAt server-side and leaves publishedAt unset for a draft", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.agents.create, baseArgs);
    const doc = await asAdmin.query(api.agents.get, { id });
    expect(doc?.publishing.updatedAt).toBeTypeOf("number");
    expect(doc?.publishing.publishedAt).toBeUndefined();
  });

  test("sets publishedAt when created directly as published", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.agents.create, { ...baseArgs, status: "published" });
    const doc = await asAdmin.query(api.agents.get, { id });
    expect(doc?.publishing.publishedAt).toBeTypeOf("number");
  });

  test("rejects a duplicate slug", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    await asAdmin.mutation(api.agents.create, baseArgs);
    await expect(asAdmin.mutation(api.agents.create, { ...baseArgs, name: "Another Agent" })).rejects.toThrow();
  });

  test("stores an optional position and clears it on update", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.agents.create, { ...baseArgs, position: "Sales Manager" });
    const created = await asAdmin.query(api.agents.get, { id });
    expect(created?.position).toBe("Sales Manager");

    await asAdmin.mutation(api.agents.update, { id, ...baseArgs, name: "Jane Updated" });
    const cleared = await asAdmin.query(api.agents.get, { id });
    expect(cleared?.position).toBeUndefined();
  });

  test("accepts an optional userId linking to a users row", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const linkedUserId = await t.run(async (ctx) =>
      ctx.db.insert("users", {
        tokenIdentifier: "clerk|linked-1",
        email: "linked@example.com",
        name: "Linked User",
        role: "agent",
        createdAt: Date.now(),
      }),
    );
    const id = await asAdmin.mutation(api.agents.create, { ...baseArgs, userId: linkedUserId });
    const doc = await asAdmin.query(api.agents.get, { id });
    expect(doc?.userId).toBe(linkedUserId);
  });
});

describe("agents.update", () => {
  test("preserves publishedAt once set, across subsequent updates", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.agents.create, { ...baseArgs, status: "published" });
    const original = await asAdmin.query(api.agents.get, { id });
    const originalPublishedAt = original?.publishing.publishedAt;

    await asAdmin.mutation(api.agents.update, { id, ...baseArgs, status: "published", name: "Jane Updated" });
    const updated = await asAdmin.query(api.agents.get, { id });
    expect(updated?.publishing.publishedAt).toBe(originalPublishedAt);
  });

  test("rejects a duplicate slug from a different document, but allows keeping its own slug", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const firstId = await asAdmin.mutation(api.agents.create, baseArgs);
    const secondId = await asAdmin.mutation(api.agents.create, { ...baseArgs, slug: "john-doe", name: "John Doe" });

    await expect(asAdmin.mutation(api.agents.update, { id: secondId, ...baseArgs, slug: "jane-doe" })).rejects.toThrow();

    await expect(
      asAdmin.mutation(api.agents.update, { id: firstId, ...baseArgs, name: "Jane Renamed" }),
    ).resolves.toBeNull();
  });
});

describe("agents.remove", () => {
  test("rejects a caller without agents:delete (agent role)", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.agents.create, baseArgs);

    const asAgent = await seedUser(t, "clerk|agent-1", "agent");
    await expect(asAgent.mutation(api.agents.remove, { id })).rejects.toThrow(ForbiddenError);
  });

  test("deletes the row and writes an audit log entry", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.agents.create, baseArgs);

    await asAdmin.mutation(api.agents.remove, { id });
    const doc = await asAdmin.query(api.agents.get, { id });
    expect(doc).toBeNull();

    const auditLogs = await t.run(async (ctx) => await ctx.db.query("auditLogs").collect());
    expect(auditLogs.some((log) => log.resource === "agents" && log.action === "delete")).toBe(true);
  });
});

describe("agents.setPublishingStatus", () => {
  test("publishes a draft, keeps the slug, and sets publishedAt", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.agents.create, baseArgs);

    await asAdmin.mutation(api.agents.setPublishingStatus, { id, status: "published" });
    const doc = await asAdmin.query(api.agents.get, { id });
    expect(doc?.publishing.status).toBe("published");
    expect(doc?.publishing.slug).toBe("jane-doe");
    expect(doc?.publishing.publishedAt).toEqual(expect.any(Number));
  });

  test("moves a published agent to draft without clearing publishedAt or slug", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.agents.create, { ...baseArgs, status: "published" });
    const published = await asAdmin.query(api.agents.get, { id });

    await asAdmin.mutation(api.agents.setPublishingStatus, { id, status: "draft" });
    const doc = await asAdmin.query(api.agents.get, { id });
    expect(doc?.publishing.status).toBe("draft");
    expect(doc?.publishing.slug).toBe("jane-doe");
    expect(doc?.publishing.publishedAt).toBe(published?.publishing.publishedAt);
  });

  test("rejects an agent toggling publishing status", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.agents.create, baseArgs);
    const asAgent = await seedUser(t, "clerk|agent-1", "agent");

    await expect(asAgent.mutation(api.agents.setPublishingStatus, { id, status: "published" })).rejects.toThrow(
      ForbiddenError,
    );
  });
});
