import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

const modules = import.meta.glob("./**/*.ts");

async function seedAdmin(t: ReturnType<typeof convexTest>) {
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      tokenIdentifier: "clerk|admin-1",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
      createdAt: Date.now(),
    });
  });
  return t.withIdentity({ tokenIdentifier: "clerk|admin-1" });
}

const propertyArgs = {
  price: 2_100_000,
  bedrooms: 2,
  bathrooms: 2,
  areaSqft: 1200,
  countryCode: "AE",
  title: { en: "Marina Unit 101" },
  description: { en: "A published unit" },
  city: { en: "Dubai" },
  listingStatus: "for_sale" as const,
  slug: "marina-unit-101",
  status: "published" as const,
};

describe("publicLeads.createListingInquiry", () => {
  test("an anonymous visitor can inquire on a published listing", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const agentId = await asAdmin.mutation(api.agents.create, {
      name: "Sara Ahmed",
      email: "sara@example.com",
      slug: "sara-ahmed",
      status: "published",
    });
    const propertyId = await asAdmin.mutation(api.properties.create, { ...propertyArgs, agentId });

    const result = await t.mutation(api.publicLeads.createListingInquiry, {
      propertyId,
      name: "Jordan Lee",
      email: "jordan@example.com",
      phone: "0500000000",
      message: "Can we view this week?",
    });
    expect(result).toEqual({ ok: true });

    const leads = await asAdmin.query(api.leads.list, {});
    expect(leads).toHaveLength(1);
    expect(leads[0]?.name).toBe("Jordan Lee");
    expect(leads[0]?.propertyId).toBe(propertyId);
    expect(leads[0]?.assignedAgentId).toBe(agentId);
    expect(leads[0]?.status).toBe("new");
  });

  test("does not create a lead for a draft listing", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const propertyId = await asAdmin.mutation(api.properties.create, { ...propertyArgs, status: "draft" });

    await expect(
      t.mutation(api.publicLeads.createListingInquiry, {
        propertyId,
        name: "Jordan Lee",
        email: "jordan@example.com",
      }),
    ).rejects.toThrow("Couldn't send this inquiry.");

    const leads = await asAdmin.query(api.leads.list, {});
    expect(leads).toHaveLength(0);
  });

  test("honeypot looks successful and writes nothing", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const propertyId = await asAdmin.mutation(api.properties.create, propertyArgs);

    const result = await t.mutation(api.publicLeads.createListingInquiry, {
      propertyId,
      name: "Bot",
      email: "bot@example.com",
      companyUrl: "https://spam.example",
    });
    expect(result).toEqual({ ok: true });

    const leads = await asAdmin.query(api.leads.list, {});
    expect(leads).toHaveLength(0);
  });
});

describe("publicLeads.createProjectInquiry", () => {
  test("an anonymous visitor can inquire on a published project", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const developerId = await asAdmin.mutation(api.developers.create, {
      name: { en: "Emaar" },
      slug: "emaar",
      status: "published",
    });
    const projectId = await asAdmin.mutation(api.projects.create, {
      title: { en: "Marina Heights" },
      description: { en: "A tower" },
      developerId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "upcoming",
      slug: "marina-heights",
      publishingStatus: "published",
    });

    const result = await t.mutation(api.publicLeads.createProjectInquiry, {
      projectId,
      name: "Jordan Lee",
      email: "jordan@example.com",
      phone: "0500000000",
      message: "Payment plan details?",
    });
    expect(result).toEqual({ ok: true });

    const leads = await asAdmin.query(api.leads.list, {});
    expect(leads).toHaveLength(1);
    expect(leads[0]?.name).toBe("Jordan Lee");
    expect(leads[0]?.projectId).toBe(projectId);
    expect(leads[0]?.propertyId).toBeUndefined();
    expect(leads[0]?.assignedAgentId).toBeUndefined();
    expect(leads[0]?.status).toBe("new");
  });

  test("does not create a lead for a draft project", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const developerId = await asAdmin.mutation(api.developers.create, {
      name: { en: "Emaar" },
      slug: "emaar",
      status: "published",
    });
    const projectId = await asAdmin.mutation(api.projects.create, {
      title: { en: "Marina Heights" },
      description: { en: "A tower" },
      developerId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "upcoming",
      slug: "marina-heights",
      publishingStatus: "draft",
    });

    await expect(
      t.mutation(api.publicLeads.createProjectInquiry, {
        projectId,
        name: "Jordan Lee",
        email: "jordan@example.com",
      }),
    ).rejects.toThrow("Couldn't send this inquiry.");

    const leads = await asAdmin.query(api.leads.list, {});
    expect(leads).toHaveLength(0);
  });

  test("honeypot looks successful and writes nothing", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const developerId = await asAdmin.mutation(api.developers.create, {
      name: { en: "Emaar" },
      slug: "emaar",
      status: "published",
    });
    const projectId = await asAdmin.mutation(api.projects.create, {
      title: { en: "Marina Heights" },
      description: { en: "A tower" },
      developerId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "upcoming",
      slug: "marina-heights",
      publishingStatus: "published",
    });

    const result = await t.mutation(api.publicLeads.createProjectInquiry, {
      projectId,
      name: "Bot",
      email: "bot@example.com",
      companyUrl: "https://spam.example",
    });
    expect(result).toEqual({ ok: true });

    const leads = await asAdmin.query(api.leads.list, {});
    expect(leads).toHaveLength(0);
  });
});
