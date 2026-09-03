/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
import { ForbiddenError } from "./lib/permissions";
import type { Id } from "./_generated/dataModel";

const modules = import.meta.glob("./**/*.ts");

async function seedUser(
  t: ReturnType<typeof convexTest>,
  tokenIdentifier: string,
  role: "super_admin" | "admin" | "agent" | "client",
  disabledResources?: Array<"properties" | "projects" | "leads" | "auditLogs">,
) {
  const userId = await t.run(async (ctx) =>
    ctx.db.insert("users", {
      tokenIdentifier,
      email: `${tokenIdentifier}@example.com`,
      name: tokenIdentifier,
      role,
      createdAt: Date.now(),
      disabledResources,
    }),
  );
  return { client: t.withIdentity({ tokenIdentifier }), userId };
}

const propertyArgs = {
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
  status: "published" as const,
};

async function seedDeveloper(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) =>
    ctx.db.insert("developers", {
      name: { en: "Emaar" },
      publishing: { slug: "emaar", status: "published", updatedAt: Date.now() },
    }),
  );
}

async function seedLead(
  t: ReturnType<typeof convexTest>,
  overrides: {
    name?: string;
    status?: "new" | "contacted" | "qualified" | "closed";
    propertyId?: Id<"properties">;
    projectId?: Id<"projects">;
    createdAt?: number;
  } = {},
) {
  return await t.run(async (ctx) =>
    ctx.db.insert("leads", {
      name: overrides.name ?? "John Smith",
      email: "john@example.com",
      status: overrides.status ?? "new",
      propertyId: overrides.propertyId,
      projectId: overrides.projectId,
      createdAt: overrides.createdAt ?? Date.now(),
    }),
  );
}

function kpiValue(data: { kpis: { label: string; value: string }[] }, label: string) {
  return data.kpis.find((kpi) => kpi.label === label)?.value;
}

describe("overview.dashboard", () => {
  test("rejects an unauthenticated caller", async () => {
    const t = convexTest(schema, modules);
    await expect(t.query(api.overview.dashboard, {})).rejects.toThrow(ForbiddenError);
  });

  test("rejects a client", async () => {
    const t = convexTest(schema, modules);
    const { client: asClient } = await seedUser(t, "clerk|client-1", "client");
    await expect(asClient.query(api.overview.dashboard, {})).rejects.toThrow(ForbiddenError);
  });

  test("rejects an agent", async () => {
    const t = convexTest(schema, modules);
    const { client: asAgent } = await seedUser(t, "clerk|agent-1", "agent");
    await expect(asAgent.query(api.overview.dashboard, {})).rejects.toThrow(ForbiddenError);
  });

  test("an empty catalog returns zeroed KPIs and a 30-day trend", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const data = await asAdmin.query(api.overview.dashboard, {});
    expect(kpiValue(data, "Live listings")).toBe("0");
    expect(kpiValue(data, "Open leads")).toBe("0");
    expect(kpiValue(data, "Drafts")).toBe("0");
    expect(kpiValue(data, "Off-plan")).toBe("0");
    expect(data.trend).toHaveLength(30);
    expect(data.inventory).toEqual([
      { name: "Sale", value: 0 },
      { name: "Rent", value: 0 },
      { name: "Off-plan", value: 0 },
    ]);
    expect(data.activities).toEqual([]);
  });

  test("counts published sale/rent, drafts, open leads, and published projects", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin } = await seedUser(t, "clerk|admin-1", "admin");
    const developerId = await seedDeveloper(t);

    await asAdmin.mutation(api.properties.create, propertyArgs);
    await asAdmin.mutation(api.properties.create, {
      ...propertyArgs,
      slug: "jbr-rent",
      title: { en: "JBR rent" },
      listingStatus: "for_rent",
    });
    await asAdmin.mutation(api.properties.create, {
      ...propertyArgs,
      slug: "draft-unit",
      title: { en: "Draft unit" },
      status: "draft",
    });
    await asAdmin.mutation(api.properties.create, {
      ...propertyArgs,
      slug: "sold-unit",
      title: { en: "Sold unit" },
      listingStatus: "sold",
    });
    await asAdmin.mutation(api.projects.create, {
      title: { en: "Beachfront" },
      description: { en: "Tower" },
      developerId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "under_construction",
      slug: "beachfront",
      publishingStatus: "published",
    });
    await asAdmin.mutation(api.projects.create, {
      title: { en: "Draft tower" },
      description: { en: "Soon" },
      developerId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "upcoming",
      slug: "draft-tower",
      publishingStatus: "draft",
    });

    const propertyId = (await asAdmin.query(api.properties.list, {}))[0]!._id;
    const projectId = (await asAdmin.query(api.projects.list, {})).find((row) => row.publishing.status === "published")!._id;
    await seedLead(t, { propertyId, status: "new" });
    await seedLead(t, { projectId, status: "contacted", name: "Off-plan buyer" });
    await seedLead(t, { status: "closed", name: "General closed" });

    const data = await asAdmin.query(api.overview.dashboard, {});
    expect(kpiValue(data, "Live listings")).toBe("2");
    expect(kpiValue(data, "Open leads")).toBe("2");
    expect(kpiValue(data, "Drafts")).toBe("2");
    expect(kpiValue(data, "Off-plan")).toBe("1");
    expect(data.inventory).toEqual([
      { name: "Sale", value: 1 },
      { name: "Rent", value: 1 },
      { name: "Off-plan", value: 1 },
    ]);
    expect(data.applications).toEqual([
      { name: "Property", value: 1, color: "#6A1017" },
      { name: "Off-plan", value: 1, color: "#C8A15B" },
      { name: "General", value: 1, color: "#A9A29A" },
    ]);
    const today = data.trend[data.trend.length - 1]!;
    expect(today.listings).toBeGreaterThanOrEqual(2);
    expect(today.leads).toBeGreaterThanOrEqual(2);
    expect(data.activities.some((row) => row.title === "Created Marina Unit 101")).toBe(true);
    expect(data.activities.some((row) => row.title.startsWith("Inquiry from"))).toBe(false);
  });

  test("an admin does not count another admin's inventory", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin1 } = await seedUser(t, "clerk|admin-1", "admin");
    const { client: asAdmin2 } = await seedUser(t, "clerk|admin-2", "admin");
    await asAdmin1.mutation(api.properties.create, propertyArgs);
    await asAdmin2.mutation(api.properties.create, {
      ...propertyArgs,
      slug: "other-unit",
      title: { en: "Other Unit" },
    });

    const mine = await asAdmin1.query(api.overview.dashboard, {});
    const theirs = await asAdmin2.query(api.overview.dashboard, {});
    expect(kpiValue(mine, "Live listings")).toBe("1");
    expect(kpiValue(theirs, "Live listings")).toBe("1");
  });

  test("a super_admin counts inventory from every admin", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin1 } = await seedUser(t, "clerk|admin-1", "admin");
    const { client: asAdmin2 } = await seedUser(t, "clerk|admin-2", "admin");
    const { client: asSuper } = await seedUser(t, "clerk|super-1", "super_admin");
    await asAdmin1.mutation(api.properties.create, propertyArgs);
    await asAdmin2.mutation(api.properties.create, {
      ...propertyArgs,
      slug: "other-unit",
      title: { en: "Other Unit" },
    });

    const data = await asSuper.query(api.overview.dashboard, {});
    expect(kpiValue(data, "Live listings")).toBe("2");
  });

  test("disabled properties access zeros listing KPIs but still counts leads", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin, userId } = await seedUser(t, "clerk|admin-1", "admin", ["properties"]);
    await t.run(async (ctx) => {
      await ctx.db.insert("properties", {
        price: 500000,
        bedrooms: 2,
        bathrooms: 2,
        areaSqft: 1200,
        countryCode: "AE",
        title: { en: "Hidden unit" },
        description: { en: "Should not count" },
        city: { en: "Dubai" },
        listingStatus: "for_sale",
        createdBy: userId,
        publishing: { slug: "hidden-unit", status: "published", updatedAt: Date.now(), publishedAt: Date.now() },
      });
    });
    await seedLead(t, { status: "new" });

    const data = await asAdmin.query(api.overview.dashboard, {});
    expect(kpiValue(data, "Live listings")).toBe("0");
    expect(kpiValue(data, "Open leads")).toBe("1");
  });

  test("an admin's recent activity is only their own actions", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin1 } = await seedUser(t, "clerk|admin-1", "admin");
    const { client: asAdmin2 } = await seedUser(t, "clerk|admin-2", "admin");
    await asAdmin1.mutation(api.properties.create, propertyArgs);
    await asAdmin2.mutation(api.properties.create, {
      ...propertyArgs,
      slug: "other-unit",
      title: { en: "Other Unit" },
    });
    await seedLead(t, { name: "Shared inbox" });

    const mine = await asAdmin1.query(api.overview.dashboard, {});
    expect(mine.activities.some((row) => row.title === "Created Marina Unit 101")).toBe(true);
    expect(mine.activities.some((row) => row.title === "Created Other Unit")).toBe(false);
    expect(mine.activities.some((row) => row.title.startsWith("Inquiry from"))).toBe(false);
  });

  test("a super_admin's recent activity includes every admin and inbound inquiries", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin1 } = await seedUser(t, "clerk|admin-1", "admin");
    const { client: asAdmin2 } = await seedUser(t, "clerk|admin-2", "admin");
    const { client: asSuper } = await seedUser(t, "clerk|super-1", "super_admin");
    await asAdmin1.mutation(api.properties.create, propertyArgs);
    await asAdmin2.mutation(api.properties.create, {
      ...propertyArgs,
      slug: "other-unit",
      title: { en: "Other Unit" },
    });
    await seedLead(t, { name: "Shared inbox" });

    const data = await asSuper.query(api.overview.dashboard, {});
    expect(data.activities.some((row) => row.title === "Created Marina Unit 101")).toBe(true);
    expect(data.activities.some((row) => row.title === "Created Other Unit")).toBe(true);
    expect(data.activities.some((row) => row.title === "Inquiry from Shared inbox")).toBe(true);
  });

  test("recent activity uses readable catalog titles and skips staff-role audit rows", async () => {
    const t = convexTest(schema, modules);
    const { client: asAdmin, userId } = await seedUser(t, "clerk|admin-1", "admin");
    const { client: asSuper, userId: superId } = await seedUser(t, "clerk|super-1", "super_admin");
    await asAdmin.mutation(api.properties.create, propertyArgs);

    await t.run(async (ctx) => {
      await ctx.db.insert("auditLogs", {
        actorUserId: superId,
        resource: "users",
        action: "update_role",
        targetId: userId,
        createdAt: Date.now() + 1,
      });
      await ctx.db.insert("auditLogs", {
        actorUserId: superId,
        resource: "users",
        action: "update_resource_access",
        targetId: userId,
        createdAt: Date.now() + 2,
      });
    });

    const data = await asSuper.query(api.overview.dashboard, {});
    expect(data.activities.some((row) => /update_role|update_resource_access/.test(row.title))).toBe(false);
    expect(data.activities.some((row) => row.kind === "User")).toBe(false);
    expect(data.activities.some((row) => row.title === "Created Marina Unit 101")).toBe(true);
  });
});
