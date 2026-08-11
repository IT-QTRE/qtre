/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
import { ForbiddenError } from "./lib/permissions";

const modules = import.meta.glob("./**/*.ts");

async function seedUser(
  t: ReturnType<typeof convexTest>,
  tokenIdentifier: string,
  role: "admin" | "agent" | "client" | "super_admin",
) {
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
  siteName: "Qtre",
};

describe("websiteSettings.get", () => {
  test("rejects an unauthenticated caller", async () => {
    const t = convexTest(schema, modules);
    await expect(t.query(api.websiteSettings.get, {})).rejects.toThrow(ForbiddenError);
  });

  test("rejects an agent (no websiteSettings:read)", async () => {
    const t = convexTest(schema, modules);
    const asAgent = await seedUser(t, "clerk|agent-1", "agent");
    await expect(asAgent.query(api.websiteSettings.get, {})).rejects.toThrow(ForbiddenError);
  });

  test("returns null when no settings row exists yet", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const settings = await asAdmin.query(api.websiteSettings.get, {});
    expect(settings).toBeNull();
  });

  test("returns the saved row once one exists", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    await asAdmin.mutation(api.websiteSettings.upsert, {
      siteName: "Qtre Homes",
      contactEmail: "hello@qtre.test",
    });
    const settings = await asAdmin.query(api.websiteSettings.get, {});
    expect(settings).not.toBeNull();
    expect(settings?.siteName).toBe("Qtre Homes");
    expect(settings?.contactEmail).toBe("hello@qtre.test");
  });
});

describe("websiteSettings.upsert", () => {
  test("rejects an agent (no websiteSettings:update)", async () => {
    const t = convexTest(schema, modules);
    const asAgent = await seedUser(t, "clerk|agent-1", "agent");
    await expect(asAgent.mutation(api.websiteSettings.upsert, baseArgs)).rejects.toThrow(ForbiddenError);
  });

  test("inserts a new row on first call", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.websiteSettings.upsert, {
      siteName: "Qtre",
      contactPhone: "+971500000000",
    });

    const rows = await t.run(async (ctx) => await ctx.db.query("websiteSettings").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0]._id).toBe(id);
    expect(rows[0].siteName).toBe("Qtre");
    expect(rows[0].contactPhone).toBe("+971500000000");
  });

  test("patches the existing row on a second call rather than creating a second one", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    await asAdmin.mutation(api.websiteSettings.upsert, { siteName: "First Name" });
    await asAdmin.mutation(api.websiteSettings.upsert, { siteName: "Second Name" });

    const rows = await t.run(async (ctx) => await ctx.db.query("websiteSettings").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0].siteName).toBe("Second Name");
  });

  test("sets updatedAt to a fresh timestamp on every call", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    await asAdmin.mutation(api.websiteSettings.upsert, { siteName: "First" });
    const first = await asAdmin.query(api.websiteSettings.get, {});
    expect(first?.updatedAt).toBeTypeOf("number");

    await asAdmin.mutation(api.websiteSettings.upsert, { siteName: "Second" });
    const second = await asAdmin.query(api.websiteSettings.get, {});
    expect(second?.updatedAt).toBeTypeOf("number");
    expect(second!.updatedAt).toBeGreaterThanOrEqual(first!.updatedAt);
  });

  test("writes an audit log entry under resource websiteSettings action upsert", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const id = await asAdmin.mutation(api.websiteSettings.upsert, baseArgs);

    const auditLogs = await t.run(async (ctx) => await ctx.db.query("auditLogs").collect());
    expect(
      auditLogs.some(
        (log) => log.resource === "websiteSettings" && log.action === "upsert" && log.targetId === id,
      ),
    ).toBe(true);
  });

  test("an admin can upsert successfully despite lacking create permission", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    // admin has update but not create on websiteSettings — first upsert must still insert
    await expect(asAdmin.mutation(api.websiteSettings.upsert, baseArgs)).resolves.toBeTypeOf("string");
    const rows = await t.run(async (ctx) => await ctx.db.query("websiteSettings").collect());
    expect(rows).toHaveLength(1);
  });

  test("allows omitting all optional fields", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    await expect(asAdmin.mutation(api.websiteSettings.upsert, { siteName: "Minimal" })).resolves.toBeTypeOf("string");
    const settings = await asAdmin.query(api.websiteSettings.get, {});
    expect(settings?.siteName).toBe("Minimal");
    expect(settings?.contactEmail).toBeUndefined();
    expect(settings?.contactPhone).toBeUndefined();
    expect(settings?.socialLinks).toBeUndefined();
    expect(settings?.defaultSeo).toBeUndefined();
  });
});

// Per-admin-account access restrictions (disabledResources) now live on
// convex/users.ts `updateResourceAccess` — see convex/users.test.ts.
