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

describe("websiteSettings.publicGet", () => {
  test("is callable without auth and omits admin-only fields", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    await asAdmin.mutation(api.websiteSettings.upsert, {
      siteName: "Qtre Homes",
      contactEmail: "hello@qtre.test",
      defaultSeo: { seoTitle: { en: "secret-default" } },
    });

    const publicSettings = await t.query(api.websiteSettings.publicGet, {});
    expect(publicSettings?.siteName).toBe("Qtre Homes");
    expect(publicSettings?.contactEmail).toBe("hello@qtre.test");
    expect(publicSettings).not.toHaveProperty("defaultSeo");
  });
});

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
    expect(settings?.contactFormUrl).toBeUndefined();
    expect(settings?.chatWidgetId).toBeUndefined();
    expect(settings?.contactWhatsapp).toBeUndefined();
  });

  test("stores an allowlisted contact form URL", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    await asAdmin.mutation(api.websiteSettings.upsert, {
      siteName: "Qtre",
      contactFormUrl: "https://api.leadconnectorhq.com/widget/form/abc123",
    });
    const settings = await asAdmin.query(api.websiteSettings.get, {});
    expect(settings?.contactFormUrl).toBe("https://api.leadconnectorhq.com/widget/form/abc123");
    const publicSettings = await t.query(api.websiteSettings.publicGet, {});
    expect(publicSettings?.contactFormUrl).toBe("https://api.leadconnectorhq.com/widget/form/abc123");
  });

  test("rejects a contact form URL that is not GoHighLevel", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    await expect(
      asAdmin.mutation(api.websiteSettings.upsert, {
        siteName: "Qtre",
        contactFormUrl: "https://evil.example/form",
      }),
    ).rejects.toThrow("Paste the form iframe src, not the embed script.");
  });

  test("publicGet omits a stored form URL that is not allowlisted", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("websiteSettings", {
        siteName: "Qtre",
        contactFormUrl: "https://evil.example/form",
        updatedAt: Date.now(),
      });
    });
    const publicSettings = await t.query(api.websiteSettings.publicGet, {});
    expect(publicSettings?.contactFormUrl).toBeUndefined();
  });

  test("stores a WhatsApp number and rejects a short value", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    await asAdmin.mutation(api.websiteSettings.upsert, {
      siteName: "Qtre",
      contactWhatsapp: "+971 50 123 4567",
    });
    const settings = await asAdmin.query(api.websiteSettings.get, {});
    expect(settings?.contactWhatsapp).toBe("+971 50 123 4567");
    const publicSettings = await t.query(api.websiteSettings.publicGet, {});
    expect(publicSettings?.contactWhatsapp).toBe("+971 50 123 4567");
    await expect(
      asAdmin.mutation(api.websiteSettings.upsert, { siteName: "Qtre", contactWhatsapp: "123" }),
    ).rejects.toThrow("Enter a WhatsApp number or wa.me link");
  });

  test("stores a chat widget ID extracted from the loader script", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    await asAdmin.mutation(api.websiteSettings.upsert, {
      siteName: "Qtre",
      chatWidgetId:
        '<script src="https://widgets.leadconnectorhq.com/loader.js" data-widget-id="6a9fad037e179c4b66ba50e7"></script>',
    });
    const settings = await asAdmin.query(api.websiteSettings.get, {});
    expect(settings?.chatWidgetId).toBe("6a9fad037e179c4b66ba50e7");
    const publicSettings = await t.query(api.websiteSettings.publicGet, {});
    expect(publicSettings?.chatWidgetId).toBe("6a9fad037e179c4b66ba50e7");
  });

  test("rejects a chat widget value that is not an ID", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    await expect(
      asAdmin.mutation(api.websiteSettings.upsert, {
        siteName: "Qtre",
        chatWidgetId: "https://evil.example/loader.js",
      }),
    ).rejects.toThrow("Paste the chat widget ID or the loader script.");
  });

  test("publicGet omits a stored chat widget ID that is not valid", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("websiteSettings", {
        siteName: "Qtre",
        chatWidgetId: "https://evil.example/loader.js",
        updatedAt: Date.now(),
      });
    });
    const publicSettings = await t.query(api.websiteSettings.publicGet, {});
    expect(publicSettings?.chatWidgetId).toBeUndefined();
  });
});

// Per-admin-account access restrictions (disabledResources) now live on
// convex/users.ts `updateResourceAccess` — see convex/users.test.ts.
