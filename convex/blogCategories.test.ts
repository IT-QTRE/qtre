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

describe("blogCategories.ensure", () => {
  test("rejects an agent", async () => {
    const t = convexTest(schema, modules);
    const asAgent = await seedUser(t, "clerk|agent-1", "agent");
    await expect(asAgent.mutation(api.blogCategories.ensure, { nameEn: "Visa" })).rejects.toThrow(ForbiddenError);
  });

  test("reuses a row for the same slug and keeps the original name", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const first = await asAdmin.mutation(api.blogCategories.ensure, { nameEn: "Visa" });
    const second = await asAdmin.mutation(api.blogCategories.ensure, { nameEn: "visa" });
    expect(second._id).toBe(first._id);
    expect(second.slug).toBe("visa");
    expect(second.name.en).toBe("Visa");
  });

  test("creates a new row for a distinct slug", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    const visa = await asAdmin.mutation(api.blogCategories.ensure, { nameEn: "Visa" });
    const property = await asAdmin.mutation(api.blogCategories.ensure, { nameEn: "Property" });
    expect(property._id).not.toBe(visa._id);
    expect(property.slug).toBe("property");
  });

  test("rejects a name that slugifies to empty", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    await expect(asAdmin.mutation(api.blogCategories.ensure, { nameEn: "!!!" })).rejects.toThrow(
      "Topic needs a letter or number",
    );
  });
});

describe("blogCategories.list", () => {
  test("returns existing topics for an admin, including unused ones", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedUser(t, "clerk|admin-1", "admin");
    await asAdmin.mutation(api.blogCategories.ensure, { nameEn: "Market" });
    const listed = await asAdmin.query(api.blogCategories.list, {});
    expect(listed.map((row) => row.name.en)).toEqual(["Market"]);
  });
});
