import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

const modules = import.meta.glob("./**/*.ts");

async function seedUser(
  t: ReturnType<typeof convexTest>,
  tokenIdentifier: string,
  role: "super_admin" | "admin" | "agent" | "client",
) {
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

describe("publicServiceLeads.create", () => {
  test("an anonymous visitor can send a visa inquiry", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");

    const result = await t.mutation(api.publicServiceLeads.create, {
      name: "Jordan Lee",
      email: "jordan@example.com",
      phone: "0500000000",
      message: "Golden Visa via property",
      group: "visa",
      desk: "golden",
    });
    expect(result).toEqual({ ok: true });

    const leads = await asAdmin.query(api.serviceLeads.list, {});
    expect(leads).toHaveLength(1);
    expect(leads[0]?.name).toBe("Jordan Lee");
    expect(leads[0]?.group).toBe("visa");
    expect(leads[0]?.desk).toBe("golden");
    expect(leads[0]?.phone).toBe("0500000000");
    expect(leads[0]?.status).toBe("new");
    expect(leads[0]?.assignedUserId).toBeUndefined();
  });

  test("rejects a desk that does not belong to the group", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");

    await expect(
      t.mutation(api.publicServiceLeads.create, {
        name: "Jordan Lee",
        email: "jordan@example.com",
        phone: "0500000000",
        group: "visa",
        desk: "renewal",
      }),
    ).rejects.toThrow("Couldn't send this inquiry.");

    const leads = await asAdmin.query(api.serviceLeads.list, {});
    expect(leads).toHaveLength(0);
  });

  test("rejects an invalid email", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");

    await expect(
      t.mutation(api.publicServiceLeads.create, {
        name: "Jordan Lee",
        email: "not-an-email",
        phone: "0500000000",
        group: "license",
        desk: "renewal",
      }),
    ).rejects.toThrow("Couldn't send this inquiry.");

    expect(await asAdmin.query(api.serviceLeads.list, {})).toHaveLength(0);
  });

  test("rejects a blank phone", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");

    await expect(
      t.mutation(api.publicServiceLeads.create, {
        name: "Jordan Lee",
        email: "jordan@example.com",
        phone: "  ",
        group: "visa",
        desk: "golden",
      }),
    ).rejects.toThrow("Couldn't send this inquiry.");

    expect(await asAdmin.query(api.serviceLeads.list, {})).toHaveLength(0);
  });

  test("honeypot looks successful and writes nothing", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");

    const result = await t.mutation(api.publicServiceLeads.create, {
      name: "Bot",
      email: "bot@example.com",
      phone: "0500000000",
      group: "visa",
      desk: "residence",
      companyUrl: "https://spam.example",
    });
    expect(result).toEqual({ ok: true });
    expect(await asAdmin.query(api.serviceLeads.list, {})).toHaveLength(0);
  });
});
