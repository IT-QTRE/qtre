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

describe("publicCatalog.featuredProperties", () => {
  test("is callable without auth and omits drafts", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.properties.create, propertyArgs);
    await asAdmin.mutation(api.properties.create, {
      ...propertyArgs,
      slug: "draft-unit",
      title: { en: "Draft Unit" },
      status: "draft",
    });

    const featured = await t.query(api.publicCatalog.featuredProperties, {});
    expect(featured).toHaveLength(1);
    expect(featured[0]?.slug).toBe("marina-unit-101");
    expect(featured[0]?.description).toEqual({ en: "A published unit" });
  });

  test("omits sold listings", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.properties.create, {
      ...propertyArgs,
      listingStatus: "sold",
      slug: "sold-unit",
      title: { en: "Sold Unit" },
    });

    const featured = await t.query(api.publicCatalog.featuredProperties, {});
    expect(featured).toHaveLength(0);
  });

  test("caps at six listings", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    for (let i = 0; i < 7; i += 1) {
      await asAdmin.mutation(api.properties.create, {
        ...propertyArgs,
        slug: `unit-${i}`,
        title: { en: `Unit ${i}` },
      });
    }

    const featured = await t.query(api.publicCatalog.featuredProperties, {});
    expect(featured).toHaveLength(6);
  });
});

describe("publicCatalog.listPublishedProperties", () => {
  test("filters by location substring across title and city", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.properties.create, propertyArgs);
    await asAdmin.mutation(api.properties.create, {
      ...propertyArgs,
      slug: "hills-unit",
      title: { en: "Hills Unit" },
      city: { en: "Dubai Hills Estate" },
    });

    const marina = await t.query(api.publicCatalog.listPublishedProperties, {
      listingStatus: "for_sale",
      q: "marina",
    });
    expect(marina.map((row) => row.slug)).toEqual(["marina-unit-101"]);
  });

  test("pages filtered results", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    for (let i = 0; i < 13; i += 1) {
      await asAdmin.mutation(api.properties.create, {
        ...propertyArgs,
        slug: `unit-${i}`,
        title: { en: `Unit ${i}` },
      });
    }

    const first = await t.query(api.publicCatalog.listPublishedPropertiesPage, {
      listingStatus: "for_sale",
      page: 1,
      pageSize: 12,
    });
    expect(first.total).toBe(13);
    expect(first.pageCount).toBe(2);
    expect(first.items).toHaveLength(12);

    const second = await t.query(api.publicCatalog.listPublishedPropertiesPage, {
      listingStatus: "for_sale",
      page: 2,
      pageSize: 12,
    });
    expect(second.items).toHaveLength(1);
  });
});

describe("publicCatalog.getPublishedPropertyBySlug", () => {
  test("returns null for a draft slug", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.properties.create, { ...propertyArgs, status: "draft" });

    const found = await t.query(api.publicCatalog.getPublishedPropertyBySlug, { slug: "marina-unit-101" });
    expect(found).toBeNull();
  });

  test("returns null location fields when the published listing has no pin", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.properties.create, propertyArgs);

    const found = await t.query(api.publicCatalog.getPublishedPropertyBySlug, { slug: "marina-unit-101" });
    expect(found?.coordinates).toBeNull();
    expect(found?.address).toBeNull();
    expect(found?.placeId).toBeNull();
  });

  test("includes location when the published listing has a pin", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.properties.create, {
      ...propertyArgs,
      address: "Marina Heights, Dubai Marina",
      placeId: "ChIJtest",
      coordinates: { lat: 25.077, lng: 55.139 },
    });

    const found = await t.query(api.publicCatalog.getPublishedPropertyBySlug, { slug: "marina-unit-101" });
    expect(found?.coordinates).toEqual({ lat: 25.077, lng: 55.139 });
    expect(found?.address).toBe("Marina Heights, Dubai Marina");
    expect(found?.placeId).toBe("ChIJtest");
  });

  test("returns empty gallery and omitted relations when none are published", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.properties.create, { ...propertyArgs, amenities: ["Pool"] });

    const found = await t.query(api.publicCatalog.getPublishedPropertyBySlug, { slug: "marina-unit-101" });
    expect(found?.images).toEqual([]);
    expect(found?.amenities).toEqual(["Pool"]);
    expect(found?.agent).toBeNull();
    expect(found?.project).toBeNull();
    expect(found?.developerName).toBeNull();
    expect(found?.developerSlug).toBeNull();
    expect(found?.propertyType).toBeNull();
    expect(found?.furnishing).toBeNull();
    expect(found?.rentalPeriod).toBeNull();
  });

  test("returns type, furnishing, and rental period when set on a rent listing", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.properties.create, {
      ...propertyArgs,
      listingStatus: "for_rent",
      propertyType: "villa",
      furnishing: "furnished",
      rentalPeriod: "monthly",
    });

    const found = await t.query(api.publicCatalog.getPublishedPropertyBySlug, { slug: "marina-unit-101" });
    expect(found?.propertyType).toBe("villa");
    expect(found?.furnishing).toBe("furnished");
    expect(found?.rentalPeriod).toBe("monthly");
  });

  test("includes gallery in order and published relations only", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const developerId = await asAdmin.mutation(api.developers.create, {
      name: { en: "Emaar" },
      slug: "emaar",
      status: "published",
    });
    const draftDeveloperId = await asAdmin.mutation(api.developers.create, {
      name: { en: "Draft Dev" },
      slug: "draft-dev",
      status: "draft",
    });
    const projectId = await asAdmin.mutation(api.projects.create, {
      title: { en: "Marina Heights" },
      description: { en: "Tower" },
      developerId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "completed",
      slug: "marina-heights",
      publishingStatus: "published",
    });
    const agentId = await asAdmin.mutation(api.agents.create, {
      name: "Sara Ahmed",
      email: "sara@example.com",
      slug: "sara-ahmed",
      status: "published",
    });
    const draftAgentId = await asAdmin.mutation(api.agents.create, {
      name: "Hidden",
      email: "hidden@example.com",
      slug: "hidden-agent",
      status: "draft",
    });
    const propertyId = await asAdmin.mutation(api.properties.create, {
      ...propertyArgs,
      developerId,
      projectId,
      agentId,
    });
    await asAdmin.mutation(api.properties.create, {
      ...propertyArgs,
      slug: "draft-relations",
      title: { en: "Draft relations" },
      developerId: draftDeveloperId,
      agentId: draftAgentId,
    });
    await t.run(async (ctx) => {
      await ctx.db.insert("mediaItems", {
        entityType: "property",
        entityId: propertyId,
        url: "https://cdn.example/two.jpg",
        pathname: `property/${propertyId}/two.jpg`,
        mimeType: "image/jpeg",
        order: 1,
        alt: { en: "Second" },
      });
      await ctx.db.insert("mediaItems", {
        entityType: "property",
        entityId: propertyId,
        url: "https://cdn.example/one.jpg",
        pathname: `property/${propertyId}/one.jpg`,
        mimeType: "image/jpeg",
        order: 0,
        alt: { en: "First" },
      });
      await ctx.db.insert("mediaItems", {
        entityType: "property",
        entityId: propertyId,
        url: "https://cdn.example/plan.pdf",
        pathname: `property/${propertyId}/plan.pdf`,
        mimeType: "application/pdf",
        order: 2,
      });
    });

    const found = await t.query(api.publicCatalog.getPublishedPropertyBySlug, { slug: "marina-unit-101" });
    expect(found?.images.map((image) => image.url)).toEqual([
      "https://cdn.example/one.jpg",
      "https://cdn.example/two.jpg",
    ]);
    expect(found?.agent).toEqual({
      name: "Sara Ahmed",
      position: null,
      slug: "sara-ahmed",
      imageUrl: null,
      imageAlt: null,
    });
    expect(found?.project).toEqual({ title: { en: "Marina Heights" }, slug: "marina-heights" });
    expect(found?.developerName).toEqual({ en: "Emaar" });
    expect(found?.developerSlug).toBe("emaar");

    const draftRelations = await t.query(api.publicCatalog.getPublishedPropertyBySlug, { slug: "draft-relations" });
    expect(draftRelations?.agent).toBeNull();
    expect(draftRelations?.developerName).toBeNull();
  });
});

describe("publicCatalog.getPublishedProjectBySlug", () => {
  test("returns null for a draft slug", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const developerId = await asAdmin.mutation(api.developers.create, {
      name: { en: "Emaar" },
      slug: "emaar",
      status: "published",
    });
    await asAdmin.mutation(api.projects.create, {
      title: { en: "Marina Heights" },
      description: { en: "A tower" },
      developerId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "upcoming",
      slug: "marina-heights",
      publishingStatus: "draft",
    });

    const found = await t.query(api.publicCatalog.getPublishedProjectBySlug, { slug: "marina-heights" });
    expect(found).toBeNull();
  });

  test("returns empty gallery and omitted relations when none are published", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const draftDeveloperId = await asAdmin.mutation(api.developers.create, {
      name: { en: "Draft House" },
      slug: "draft-house",
      status: "draft",
    });
    await asAdmin.mutation(api.projects.create, {
      title: { en: "Quiet Tower" },
      description: { en: "A published project" },
      developerId: draftDeveloperId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "under_construction",
      slug: "quiet-tower",
      publishingStatus: "published",
    });

    const found = await t.query(api.publicCatalog.getPublishedProjectBySlug, { slug: "quiet-tower" });
    expect(found?.images).toEqual([]);
    expect(found?.amenities).toEqual([]);
    expect(found?.paymentPlan).toEqual([]);
    expect(found?.developerName).toBeNull();
    expect(found?.developerSlug).toBeNull();
    expect(found?.constructionStatus).toBe("under_construction");
    expect(found?.completionDate).toBeNull();
    expect(found?.startingPrice).toBeNull();
    expect(found?.coordinates).toBeNull();
    expect(found?.bedroomTypes).toEqual([]);
    expect(found?.units).toEqual([]);
  });

  test("includes gallery in order, amenities, payment plan, and published developer only", async () => {
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
      status: "completed",
      completionDate: { quarter: 4, year: 2027 },
      startingPrice: 1_800_000,
      amenities: ["Pool", "Gym"],
      paymentPlan: [
        { label: "Down payment", percentage: 20, note: "On booking" },
        { label: "During construction", percentage: 80 },
      ],
      coordinates: { lat: 25.077, lng: 55.139 },
      address: "Marina Heights, Dubai Marina",
      placeId: "ChIJproject",
      slug: "marina-heights",
      publishingStatus: "published",
    });
    await t.run(async (ctx) => {
      await ctx.db.insert("mediaItems", {
        entityType: "project",
        entityId: projectId,
        url: "https://cdn.example/two.jpg",
        pathname: `project/${projectId}/two.jpg`,
        mimeType: "image/jpeg",
        order: 1,
        alt: { en: "Second" },
      });
      await ctx.db.insert("mediaItems", {
        entityType: "project",
        entityId: projectId,
        url: "https://cdn.example/one.jpg",
        pathname: `project/${projectId}/one.jpg`,
        mimeType: "image/jpeg",
        order: 0,
        alt: { en: "First" },
      });
      await ctx.db.insert("mediaItems", {
        entityType: "project",
        entityId: projectId,
        url: "https://cdn.example/plan.pdf",
        pathname: `project/${projectId}/plan.pdf`,
        mimeType: "application/pdf",
        order: 2,
      });
    });

    const found = await t.query(api.publicCatalog.getPublishedProjectBySlug, { slug: "marina-heights" });
    expect(found?.images.map((image) => image.url)).toEqual([
      "https://cdn.example/one.jpg",
      "https://cdn.example/two.jpg",
    ]);
    expect(found?.amenities).toEqual(["Pool", "Gym"]);
    expect(found?.paymentPlan).toEqual([
      { label: "Down payment", percentage: 20, note: "On booking" },
      { label: "During construction", percentage: 80, note: null },
    ]);
    expect(found?.developerName).toEqual({ en: "Emaar" });
    expect(found?.developerSlug).toBe("emaar");
    expect(found?.completionDate).toEqual({ quarter: 4, year: 2027 });
    expect(found?.startingPrice).toBe(1_800_000);
    expect(found?.coordinates).toEqual({ lat: 25.077, lng: 55.139 });
    expect(found?.address).toBe("Marina Heights, Dubai Marina");
    expect(found?.placeId).toBe("ChIJproject");
  });

  test("uses the project bedroom mix when no published units are linked", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const developerId = await asAdmin.mutation(api.developers.create, {
      name: { en: "Emaar" },
      slug: "emaar",
      status: "published",
    });
    await asAdmin.mutation(api.projects.create, {
      title: { en: "Marina Heights" },
      description: { en: "A tower" },
      developerId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "upcoming",
      bedroomTypes: [0, 1, 3, 4],
      slug: "marina-heights",
      publishingStatus: "published",
    });

    const found = await t.query(api.publicCatalog.getPublishedProjectBySlug, { slug: "marina-heights" });
    expect(found?.bedroomTypes).toEqual([0, 1, 3, 4]);
    expect(found?.unitTypes).toEqual([
      { bedrooms: 0, minAreaSqm: null, maxAreaSqm: null, minPrice: null, maxPrice: null },
      { bedrooms: 1, minAreaSqm: null, maxAreaSqm: null, minPrice: null, maxPrice: null },
      { bedrooms: 3, minAreaSqm: null, maxAreaSqm: null, minPrice: null, maxPrice: null },
      { bedrooms: 4, minAreaSqm: null, maxAreaSqm: null, minPrice: null, maxPrice: null },
    ]);
    expect(found?.units).toEqual([]);

    const listed = await t.query(api.publicCatalog.listPublishedProjects, {});
    expect(listed[0]?.bedroomTypes).toEqual([0, 1, 3, 4]);
  });

  test("keeps the project bedroom mix when published units are linked, and omits draft units", async () => {
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
      bedroomTypes: [2],
      slug: "marina-heights",
      publishingStatus: "published",
    });
    await asAdmin.mutation(api.properties.create, {
      ...propertyArgs,
      projectId,
      bedrooms: 1,
      slug: "marina-1br",
      title: { en: "Marina 1BR" },
    });
    await asAdmin.mutation(api.properties.create, {
      ...propertyArgs,
      projectId,
      bedrooms: 3,
      slug: "marina-3br",
      title: { en: "Marina 3BR" },
    });
    await asAdmin.mutation(api.properties.create, {
      ...propertyArgs,
      projectId,
      bedrooms: 0,
      slug: "marina-studio-draft",
      title: { en: "Draft studio" },
      status: "draft",
    });

    const found = await t.query(api.publicCatalog.getPublishedProjectBySlug, { slug: "marina-heights" });
    expect(found?.bedroomTypes).toEqual([2]);
    expect(found?.units.map((unit) => unit.slug).toSorted()).toEqual(["marina-1br", "marina-3br"]);

    const listed = await t.query(api.publicCatalog.listPublishedProjects, {});
    expect(listed[0]?.bedroomTypes).toEqual([2]);
  });

  test("falls back to published unit bedrooms when the project has no mix", async () => {
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
    await asAdmin.mutation(api.properties.create, {
      ...propertyArgs,
      projectId,
      bedrooms: 1,
      slug: "marina-1br",
      title: { en: "Marina 1BR" },
    });
    await asAdmin.mutation(api.properties.create, {
      ...propertyArgs,
      projectId,
      bedrooms: 3,
      slug: "marina-3br",
      title: { en: "Marina 3BR" },
    });

    const found = await t.query(api.publicCatalog.getPublishedProjectBySlug, { slug: "marina-heights" });
    expect(found?.bedroomTypes).toEqual([1, 3]);
  });

  test("returns admin-entered size and price ranges for unit types", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const developerId = await asAdmin.mutation(api.developers.create, {
      name: { en: "Emaar" },
      slug: "emaar",
      status: "published",
    });
    await asAdmin.mutation(api.projects.create, {
      title: { en: "Marina Heights" },
      description: { en: "A tower" },
      developerId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "upcoming",
      unitTypes: [
        { bedrooms: 1, minAreaSqm: 70, maxAreaSqm: 88, minPrice: 1_200_000, maxPrice: 1_450_000 },
        { bedrooms: 2, minAreaSqm: 102, minPrice: 1_800_000 },
      ],
      slug: "marina-heights",
      publishingStatus: "published",
    });

    const found = await t.query(api.publicCatalog.getPublishedProjectBySlug, { slug: "marina-heights" });
    expect(found?.bedroomTypes).toEqual([1, 2]);
    expect(found?.unitTypes).toEqual([
      { bedrooms: 1, minAreaSqm: 70, maxAreaSqm: 88, minPrice: 1_200_000, maxPrice: 1_450_000 },
      { bedrooms: 2, minAreaSqm: 102, maxAreaSqm: null, minPrice: 1_800_000, maxPrice: null },
    ]);
  });
});

describe("publicCatalog.listPublishedProjects", () => {
  test("returns published projects to an unauthenticated caller", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const developerId = await asAdmin.mutation(api.developers.create, {
      name: { en: "Emaar" },
      slug: "emaar",
      status: "published",
    });
    await asAdmin.mutation(api.projects.create, {
      title: { en: "Marina Heights" },
      description: { en: "A tower" },
      developerId,
      countryCode: "AE",
      city: { en: "Dubai Marina" },
      status: "upcoming",
      slug: "marina-heights",
      publishingStatus: "published",
    });

    const projects = await t.query(api.publicCatalog.listPublishedProjects, { q: "marina" });
    expect(projects).toHaveLength(1);
    expect(projects[0]?.slug).toBe("marina-heights");
  });

  test("omits drafts and pages filtered results", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const developerId = await asAdmin.mutation(api.developers.create, {
      name: { en: "Emaar" },
      slug: "emaar",
      status: "published",
    });
    for (let i = 0; i < 13; i += 1) {
      await asAdmin.mutation(api.projects.create, {
        title: { en: `Tower ${i}` },
        description: { en: "A tower" },
        developerId,
        countryCode: "AE",
        city: { en: "Dubai" },
        status: "under_construction",
        startingPrice: 2_000_000 + i,
        slug: `tower-${i}`,
        publishingStatus: "published",
      });
    }
    await asAdmin.mutation(api.projects.create, {
      title: { en: "Draft Tower" },
      description: { en: "Draft" },
      developerId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "upcoming",
      slug: "draft-tower",
      publishingStatus: "draft",
    });

    const first = await t.query(api.publicCatalog.listPublishedProjectsPage, { page: 1, pageSize: 12 });
    expect(first.total).toBe(13);
    expect(first.pageCount).toBe(2);
    expect(first.items).toHaveLength(12);

    const second = await t.query(api.publicCatalog.listPublishedProjectsPage, { page: 2, pageSize: 12 });
    expect(second.items).toHaveLength(1);
  });

  test("filters by construction status and starting price, skipping unpriced rows when a bound is set", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const developerId = await asAdmin.mutation(api.developers.create, {
      name: { en: "Emaar" },
      slug: "emaar",
      status: "published",
    });
    await asAdmin.mutation(api.projects.create, {
      title: { en: "Upcoming Villa" },
      description: { en: "A villa" },
      developerId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "upcoming",
      startingPrice: 4_000_000,
      slug: "upcoming-villa",
      publishingStatus: "published",
    });
    await asAdmin.mutation(api.projects.create, {
      title: { en: "Priced Tower" },
      description: { en: "A tower" },
      developerId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "under_construction",
      startingPrice: 1_500_000,
      slug: "priced-tower",
      publishingStatus: "published",
    });
    await asAdmin.mutation(api.projects.create, {
      title: { en: "Unpriced Tower" },
      description: { en: "A tower" },
      developerId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "under_construction",
      slug: "unpriced-tower",
      publishingStatus: "published",
    });

    const construction = await t.query(api.publicCatalog.listPublishedProjects, {
      construction: "upcoming",
    });
    expect(construction.map((row) => row.slug)).toEqual(["upcoming-villa"]);

    const priced = await t.query(api.publicCatalog.listPublishedProjects, {
      maxPrice: 2_000_000,
    });
    expect(priced.map((row) => row.slug)).toEqual(["priced-tower"]);
  });

  test("filters by unit-type mix so a beds value matches projects that include that type", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const developerId = await asAdmin.mutation(api.developers.create, {
      name: { en: "Emaar" },
      slug: "emaar",
      status: "published",
    });
    await asAdmin.mutation(api.projects.create, {
      title: { en: "Studio Mix" },
      description: { en: "A tower" },
      developerId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "under_construction",
      bedroomTypes: [0, 1, 2],
      slug: "studio-mix",
      publishingStatus: "published",
    });
    await asAdmin.mutation(api.projects.create, {
      title: { en: "Family Tower" },
      description: { en: "A tower" },
      developerId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "under_construction",
      bedroomTypes: [3, 4],
      slug: "family-tower",
      publishingStatus: "published",
    });
    await asAdmin.mutation(api.projects.create, {
      title: { en: "No Mix" },
      description: { en: "A tower" },
      developerId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "under_construction",
      slug: "no-mix",
      publishingStatus: "published",
    });

    const studios = await t.query(api.publicCatalog.listPublishedProjects, { beds: 0 });
    expect(studios.map((row) => row.slug)).toEqual(["studio-mix"]);

    const oneBeds = await t.query(api.publicCatalog.listPublishedProjects, { beds: 1 });
    expect(oneBeds.map((row) => row.slug)).toEqual(["studio-mix"]);

    const fourPlus = await t.query(api.publicCatalog.listPublishedProjects, { beds: 4 });
    expect(fourPlus.map((row) => row.slug)).toEqual(["family-tower"]);
  });

  test("filters by published developer slug and omits unpublished names from cards", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const emaarId = await asAdmin.mutation(api.developers.create, {
      name: { en: "Emaar" },
      slug: "emaar",
      status: "published",
    });
    const nakheelId = await asAdmin.mutation(api.developers.create, {
      name: { en: "Nakheel" },
      slug: "nakheel",
      status: "published",
    });
    const draftDeveloperId = await asAdmin.mutation(api.developers.create, {
      name: { en: "Hidden House" },
      slug: "hidden-house",
      status: "draft",
    });
    await asAdmin.mutation(api.projects.create, {
      title: { en: "Emaar Tower" },
      description: { en: "A tower" },
      developerId: emaarId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "upcoming",
      slug: "emaar-tower",
      publishingStatus: "published",
    });
    await asAdmin.mutation(api.projects.create, {
      title: { en: "Nakheel Tower" },
      description: { en: "A tower" },
      developerId: nakheelId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "upcoming",
      slug: "nakheel-tower",
      publishingStatus: "published",
    });
    await asAdmin.mutation(api.projects.create, {
      title: { en: "Quiet Tower" },
      description: { en: "A tower" },
      developerId: draftDeveloperId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "upcoming",
      slug: "quiet-tower",
      publishingStatus: "published",
    });

    const emaar = await t.query(api.publicCatalog.listPublishedProjects, { developer: "emaar" });
    expect(emaar.map((row) => row.slug)).toEqual(["emaar-tower"]);
    expect(emaar[0]?.developerName).toEqual({ en: "Emaar" });

    const unknown = await t.query(api.publicCatalog.listPublishedProjects, { developer: "ghost" });
    expect(unknown).toEqual([]);

    const draftSlug = await t.query(api.publicCatalog.listPublishedProjects, { developer: "hidden-house" });
    expect(draftSlug).toEqual([]);

    const quiet = await t.query(api.publicCatalog.listPublishedProjects, { q: "quiet" });
    expect(quiet[0]?.developerName).toBeNull();

    const options = await t.query(api.publicCatalog.listPublishedProjectDevelopers, {});
    expect(options.map((row) => row.slug).toSorted()).toEqual(["emaar", "nakheel"]);
  });
});

describe("publicCatalog.featuredProjects", () => {
  test("returns published projects and omits drafts", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const developerId = await asAdmin.mutation(api.developers.create, {
      name: { en: "Emaar" },
      slug: "emaar",
      status: "published",
    });
    await asAdmin.mutation(api.projects.create, {
      title: { en: "Marina Heights" },
      description: { en: "A tower" },
      developerId,
      countryCode: "AE",
      city: { en: "Dubai Marina" },
      status: "upcoming",
      slug: "marina-heights",
      publishingStatus: "published",
    });
    await asAdmin.mutation(api.projects.create, {
      title: { en: "Draft Tower" },
      description: { en: "Draft" },
      developerId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "upcoming",
      slug: "draft-tower",
      publishingStatus: "draft",
    });

    const featured = await t.query(api.publicCatalog.featuredProjects, {});
    expect(featured).toHaveLength(1);
    expect(featured[0]?.slug).toBe("marina-heights");
  });
});

describe("publicCatalog.featuredBlogPosts", () => {
  test("returns published posts and omits drafts", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.blogPosts.create, {
      title: { en: "Market note" },
      body: { en: "A published note" },
      slug: "market-note",
      status: "published",
    });
    await asAdmin.mutation(api.blogPosts.create, {
      title: { en: "Draft note" },
      body: { en: "Draft" },
      slug: "draft-note",
      status: "draft",
    });

    const featured = await t.query(api.publicCatalog.featuredBlogPosts, {});
    expect(featured).toHaveLength(1);
    expect(featured[0]?.slug).toBe("market-note");
    expect(featured[0]?.title.en).toBe("Market note");
    expect(featured[0]?.publishedAt).toEqual(expect.any(Number));
    expect(featured[0]?.imageUrl).toBeNull();
    expect(featured[0] && "category" in featured[0]).toBe(false);
  });

  test("caps at five posts", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    for (let i = 0; i < 6; i += 1) {
      await asAdmin.mutation(api.blogPosts.create, {
        title: { en: `Note ${i}` },
        body: { en: "Body" },
        slug: `note-${i}`,
        status: "published",
      });
    }

    const featured = await t.query(api.publicCatalog.featuredBlogPosts, {});
    expect(featured).toHaveLength(5);
  });
});

describe("publicCatalog.listPublishedBlogPosts", () => {
  test("omits drafts and sorts newest first", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.blogPosts.create, {
      title: { en: "Older post" },
      body: { en: "<p>Older</p>" },
      slug: "older-post",
      status: "published",
    });
    await asAdmin.mutation(api.blogPosts.create, {
      title: { en: "Newer post" },
      body: { en: "<p>Newer</p>" },
      slug: "newer-post",
      status: "published",
    });
    await asAdmin.mutation(api.blogPosts.create, {
      title: { en: "Draft post" },
      body: { en: "<p>Draft</p>" },
      slug: "draft-post",
      status: "draft",
    });

    const listed = await t.query(api.publicCatalog.listPublishedBlogPosts, {});
    expect(listed.map((row) => row.slug)).toEqual(["newer-post", "older-post"]);
    expect(listed[0]?.publishedAt).toBeGreaterThanOrEqual(listed[1]?.publishedAt ?? 0);
    expect(listed[0]?.category).toBeNull();
  });

  test("filters by title keyword and topic slug", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.blogPosts.create, {
      title: { en: "Golden Visa buyers" },
      body: { en: "<p>Body mentions property</p>" },
      slug: "golden-visa",
      status: "published",
      topicName: "Visa",
    });
    await asAdmin.mutation(api.blogPosts.create, {
      title: { en: "Marina project notes" },
      body: { en: "<p>Golden in the body</p>" },
      slug: "marina-project",
      status: "published",
      topicName: "Project",
    });
    await asAdmin.mutation(api.blogPosts.create, {
      title: { en: "Uncategorized visa draft" },
      body: { en: "<p>Draft</p>" },
      slug: "visa-draft",
      status: "draft",
      topicName: "Visa",
    });
    await asAdmin.mutation(api.blogPosts.create, {
      title: { en: "No topic yet" },
      body: { en: "<p>Open</p>" },
      slug: "no-topic",
      status: "published",
    });

    const byTopic = await t.query(api.publicCatalog.listPublishedBlogPosts, { topic: "visa" });
    expect(byTopic.map((row) => row.slug)).toEqual(["golden-visa"]);
    expect(byTopic[0]?.category?.name.en).toBe("Visa");

    const byTitle = await t.query(api.publicCatalog.listPublishedBlogPosts, { q: "golden" });
    expect(byTitle.map((row) => row.slug)).toEqual(["golden-visa"]);

    const combined = await t.query(api.publicCatalog.listPublishedBlogPosts, { q: "marina", topic: "visa" });
    expect(combined).toEqual([]);

    const unknown = await t.query(api.publicCatalog.listPublishedBlogPosts, { topic: "missing" });
    expect(unknown).toEqual([]);

    const topics = await t.query(api.publicCatalog.listPublishedBlogTopics, {});
    expect(topics.map((row) => row.slug)).toEqual(["project", "visa"]);
  });
});

describe("publicCatalog.getPublishedBlogPostBySlug", () => {
  test("returns null for a draft slug", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.blogPosts.create, {
      title: { en: "Draft post" },
      body: { en: "<p>Draft</p>" },
      slug: "draft-post",
      status: "draft",
    });

    const found = await t.query(api.publicCatalog.getPublishedBlogPostBySlug, { slug: "draft-post" });
    expect(found).toBeNull();
  });

  test("returns published body and never authorUserId", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.blogPosts.create, {
      title: { en: "Market note" },
      body: { en: "<p>A published note</p>" },
      slug: "market-note",
      status: "published",
    });

    const found = await t.query(api.publicCatalog.getPublishedBlogPostBySlug, { slug: "market-note" });
    expect(found?.slug).toBe("market-note");
    expect(found?.title.en).toBe("Market note");
    expect(found?.body.en).toBe("<p>A published note</p>");
    expect(found?.seoTitle).toBeNull();
    expect(found?.seoDescription).toBeNull();
    expect(found && "authorUserId" in found).toBe(false);
    expect(found?.related).toEqual([]);
    expect(found?.category).toBeNull();
  });

  test("returns published related in order and omits drafts", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const propertyId = await asAdmin.mutation(api.properties.create, propertyArgs);
    const draftPropertyId = await asAdmin.mutation(api.properties.create, {
      ...propertyArgs,
      slug: "draft-unit",
      title: { en: "Draft Unit" },
      status: "draft",
    });
    const developerId = await asAdmin.mutation(api.developers.create, {
      name: { en: "Emaar" },
      slug: "emaar",
      status: "published",
    });
    const projectId = await asAdmin.mutation(api.projects.create, {
      title: { en: "Marina Heights" },
      description: { en: "Tower" },
      developerId,
      countryCode: "AE",
      city: { en: "Dubai" },
      startingPrice: 1_500_000,
      status: "completed",
      slug: "marina-heights",
      publishingStatus: "published",
    });
    const otherPostId = await asAdmin.mutation(api.blogPosts.create, {
      title: { en: "Other note" },
      body: { en: "<p>Other</p>" },
      slug: "other-note",
      status: "published",
    });
    await asAdmin.mutation(api.blogPosts.create, {
      title: { en: "Market note" },
      body: { en: "<p>A published note</p>" },
      slug: "market-note",
      status: "published",
      related: [
        { type: "property", id: propertyId },
        { type: "property", id: draftPropertyId },
        { type: "project", id: projectId },
        { type: "blogPost", id: otherPostId },
      ],
    });

    const found = await t.query(api.publicCatalog.getPublishedBlogPostBySlug, { slug: "market-note" });
    expect(found?.related.map((row) => `${row.type}:${row.slug}`)).toEqual([
      "property:marina-unit-101",
      "project:marina-heights",
      "blogPost:other-note",
    ]);
  });

  test("returns the resolved category or null", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.blogPosts.create, {
      title: { en: "Visa note" },
      body: { en: "<p>Visa</p>" },
      slug: "visa-note",
      status: "published",
      topicName: "Visa",
    });

    const found = await t.query(api.publicCatalog.getPublishedBlogPostBySlug, { slug: "visa-note" });
    expect(found?.category).toEqual({ slug: "visa", name: { en: "Visa" } });
  });
});

describe("publicCatalog.featuredDevelopers", () => {
  test("is callable without auth and omits drafts", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.developers.create, {
      name: { en: "Published House" },
      slug: "published-house",
      status: "published",
    });
    await asAdmin.mutation(api.developers.create, {
      name: { en: "Draft House" },
      slug: "draft-house",
      status: "draft",
    });

    const featured = await t.query(api.publicCatalog.featuredDevelopers, {});
    expect(featured).toHaveLength(1);
    expect(featured[0]?.slug).toBe("published-house");
    expect(featured[0]?.name.en).toBe("Published House");
    expect(featured[0]?.imageUrl).toBeNull();
  });

  test("caps at eight developers", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    for (let i = 0; i < 9; i += 1) {
      await asAdmin.mutation(api.developers.create, {
        name: { en: `House ${i}` },
        slug: `house-${i}`,
        status: "published",
      });
    }

    const featured = await t.query(api.publicCatalog.featuredDevelopers, {});
    expect(featured).toHaveLength(8);
  });
});

async function attachCommunityPhoto(
  t: ReturnType<typeof convexTest>,
  communityId: string,
  file: string,
) {
  await t.run(async (ctx) => {
    await ctx.db.insert("mediaItems", {
      entityType: "community",
      entityId: communityId,
      url: `https://cdn.example/${file}`,
      pathname: `community/${communityId}/${file}`,
      mimeType: "image/jpeg",
      order: 0,
      alt: { en: file },
    });
  });
}

describe("publicCatalog.featuredCommunities", () => {
  test("is callable without auth, omits drafts, and omits areas without a photo", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const marina = await asAdmin.mutation(api.communities.create, {
      name: { en: "Dubai Marina" },
      city: { en: "Dubai" },
      countryCode: "AE",
      slug: "dubai-marina",
      status: "published",
    });
    await attachCommunityPhoto(t, marina, "marina.jpg");
    await asAdmin.mutation(api.communities.create, {
      name: { en: "Draft Area" },
      city: { en: "Dubai" },
      countryCode: "AE",
      slug: "draft-area",
      status: "draft",
    });
    await asAdmin.mutation(api.communities.create, {
      name: { en: "No Photo" },
      city: { en: "Dubai" },
      countryCode: "AE",
      slug: "no-photo",
      status: "published",
    });

    const featured = await t.query(api.publicCatalog.featuredCommunities, {});
    expect(featured).toHaveLength(1);
    expect(featured[0]?.slug).toBe("dubai-marina");
    expect(featured[0]?.countryCode).toBe("AE");
    expect(featured[0]?.name.en).toBe("Dubai Marina");
    expect(featured[0]?.imageUrl).toBe("https://cdn.example/marina.jpg");
  });

  test("caps at five photographed areas per country", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    for (let i = 0; i < 6; i += 1) {
      const id = await asAdmin.mutation(api.communities.create, {
        name: { en: `Area ${i}` },
        city: { en: "Dubai" },
        countryCode: "AE",
        slug: `area-${i}`,
        status: "published",
      });
      await attachCommunityPhoto(t, id, `area-${i}.jpg`);
    }
    for (let i = 0; i < 2; i += 1) {
      const id = await asAdmin.mutation(api.communities.create, {
        name: { en: `Istanbul ${i}` },
        city: { en: "Istanbul" },
        countryCode: "TR",
        slug: `istanbul-${i}`,
        status: "published",
      });
      await attachCommunityPhoto(t, id, `istanbul-${i}.jpg`);
    }

    const featured = await t.query(api.publicCatalog.featuredCommunities, {});
    expect(featured.filter((row) => row.countryCode === "AE")).toHaveLength(5);
    expect(featured.filter((row) => row.countryCode === "TR")).toHaveLength(2);
  });
});

describe("publicCatalog.listPublishedCommunities", () => {
  test("omits drafts, includes description, and sorts by English name", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.communities.create, {
      name: { en: "Palm Jumeirah" },
      city: { en: "Dubai" },
      countryCode: "AE",
      description: { en: "A published palm" },
      slug: "palm-jumeirah",
      status: "published",
    });
    await asAdmin.mutation(api.communities.create, {
      name: { en: "Dubai Marina" },
      city: { en: "Dubai" },
      countryCode: "AE",
      slug: "dubai-marina",
      status: "published",
    });
    await asAdmin.mutation(api.communities.create, {
      name: { en: "Draft Area" },
      city: { en: "Dubai" },
      countryCode: "AE",
      slug: "draft-area",
      status: "draft",
    });

    const listed = await t.query(api.publicCatalog.listPublishedCommunities, {});
    expect(listed.map((row) => row.slug)).toEqual(["dubai-marina", "palm-jumeirah"]);
    expect(listed[0]?.description).toBeNull();
    expect(listed[1]?.description).toEqual({ en: "A published palm" });
  });

  test("follows rank after reorder and omits drafts from the public order", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const palm = await asAdmin.mutation(api.communities.create, {
      name: { en: "Palm Jumeirah" },
      city: { en: "Dubai" },
      countryCode: "AE",
      slug: "palm-jumeirah",
      status: "published",
    });
    const marina = await asAdmin.mutation(api.communities.create, {
      name: { en: "Dubai Marina" },
      city: { en: "Dubai" },
      countryCode: "AE",
      slug: "dubai-marina",
      status: "published",
    });
    const draft = await asAdmin.mutation(api.communities.create, {
      name: { en: "Draft Area" },
      city: { en: "Dubai" },
      countryCode: "AE",
      slug: "draft-area",
      status: "draft",
    });

    await asAdmin.mutation(api.communities.reorder, { orderedIds: [palm, draft, marina] });
    await attachCommunityPhoto(t, palm, "palm.jpg");
    await attachCommunityPhoto(t, marina, "marina.jpg");

    const listed = await t.query(api.publicCatalog.listPublishedCommunities, {});
    expect(listed.map((row) => row.slug)).toEqual(["palm-jumeirah", "dubai-marina"]);

    const featured = await t.query(api.publicCatalog.featuredCommunities, {});
    expect(featured.map((row) => row.slug)).toEqual(["palm-jumeirah", "dubai-marina"]);
  });
});

describe("publicCatalog.getPublishedCommunityBySlug", () => {
  test("returns null for a draft slug", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.communities.create, {
      name: { en: "Dubai Marina" },
      city: { en: "Dubai" },
      countryCode: "AE",
      slug: "dubai-marina",
      status: "draft",
    });

    const found = await t.query(api.publicCatalog.getPublishedCommunityBySlug, { slug: "dubai-marina" });
    expect(found).toBeNull();
  });

  test("prefers published AE when legacy rows share a live slug", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.communities.create, {
      name: { en: "Downtown Dubai" },
      city: { en: "Dubai" },
      countryCode: "AE",
      slug: "downtown",
      status: "published",
    });
    await t.run(async (ctx) => {
      await ctx.db.insert("communities", {
        name: { en: "Downtown Istanbul" },
        city: { en: "Istanbul" },
        countryCode: "TR",
        publishing: { slug: "downtown", status: "published", updatedAt: Date.now(), publishedAt: Date.now() },
      });
    });

    const found = await t.query(api.publicCatalog.getPublishedCommunityBySlug, { slug: "downtown" });
    expect(found?.name.en).toBe("Downtown Dubai");
  });

  test("returns the sole published match when AE is unpublished", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.communities.create, {
      name: { en: "Downtown Dubai" },
      city: { en: "Dubai" },
      countryCode: "AE",
      slug: "downtown",
      status: "draft",
    });
    await asAdmin.mutation(api.communities.create, {
      name: { en: "Downtown Istanbul" },
      city: { en: "Istanbul" },
      countryCode: "TR",
      slug: "downtown",
      status: "published",
    });

    const found = await t.query(api.publicCatalog.getPublishedCommunityBySlug, { slug: "downtown" });
    expect(found?.name.en).toBe("Downtown Istanbul");
  });

  test("omits unpublished inventory and includes description, images, and linked stock", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const communityId = await asAdmin.mutation(api.communities.create, {
      name: { en: "Dubai Marina" },
      city: { en: "Dubai" },
      countryCode: "AE",
      description: { en: "A published marina" },
      slug: "dubai-marina",
      status: "published",
    });
    const developerId = await asAdmin.mutation(api.developers.create, {
      name: { en: "Emaar" },
      slug: "emaar",
      status: "published",
    });
    await asAdmin.mutation(api.projects.create, {
      title: { en: "Draft Tower" },
      description: { en: "Hidden" },
      developerId,
      communityId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "upcoming",
      slug: "draft-tower",
      publishingStatus: "draft",
    });
    await asAdmin.mutation(api.projects.create, {
      title: { en: "Marina Heights" },
      description: { en: "A tower" },
      developerId,
      communityId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "completed",
      slug: "marina-heights",
      publishingStatus: "published",
    });
    await asAdmin.mutation(api.properties.create, {
      ...propertyArgs,
      communityId,
      slug: "draft-unit",
      title: { en: "Draft Unit" },
      status: "draft",
    });
    await asAdmin.mutation(api.properties.create, {
      ...propertyArgs,
      communityId,
    });
    await t.run(async (ctx) => {
      await ctx.db.insert("mediaItems", {
        entityType: "community",
        entityId: communityId,
        url: "https://cdn.example/marina.jpg",
        pathname: `community/${communityId}/marina.jpg`,
        mimeType: "image/jpeg",
        order: 0,
        alt: { en: "Marina" },
      });
      await ctx.db.insert("mediaItems", {
        entityType: "community",
        entityId: communityId,
        url: "https://cdn.example/marina-walk.jpg",
        pathname: `community/${communityId}/marina-walk.jpg`,
        mimeType: "image/jpeg",
        order: 1,
        alt: { en: "Marina Walk" },
      });
    });

    const found = await t.query(api.publicCatalog.getPublishedCommunityBySlug, { slug: "dubai-marina" });
    expect(found?.description).toEqual({ en: "A published marina" });
    expect(found?.imageUrl).toBe("https://cdn.example/marina.jpg");
    expect(found?.images.map((image) => image.url)).toEqual([
      "https://cdn.example/marina.jpg",
      "https://cdn.example/marina-walk.jpg",
    ]);
    expect(found?.projects.map((row) => row.slug)).toEqual(["marina-heights"]);
    expect(found?.properties.map((row) => row.slug)).toEqual(["marina-unit-101"]);
  });
});

describe("publicCatalog.listPublishedDevelopers", () => {
  test("omits drafts and sorts by English name", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.developers.create, {
      name: { en: "Nakheel" },
      slug: "nakheel",
      status: "published",
    });
    await asAdmin.mutation(api.developers.create, {
      name: { en: "Emaar" },
      slug: "emaar",
      status: "published",
    });
    await asAdmin.mutation(api.developers.create, {
      name: { en: "Draft House" },
      slug: "draft-house",
      status: "draft",
    });

    const listed = await t.query(api.publicCatalog.listPublishedDevelopers, {});
    expect(listed.map((row) => row.slug)).toEqual(["emaar", "nakheel"]);
  });

  test("follows rank after reorder and omits drafts from the public order", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const nakheel = await asAdmin.mutation(api.developers.create, {
      name: { en: "Nakheel" },
      slug: "nakheel",
      status: "published",
    });
    const emaar = await asAdmin.mutation(api.developers.create, {
      name: { en: "Emaar" },
      slug: "emaar",
      status: "published",
    });
    const draft = await asAdmin.mutation(api.developers.create, {
      name: { en: "Draft House" },
      slug: "draft-house",
      status: "draft",
    });

    await asAdmin.mutation(api.developers.reorder, { orderedIds: [nakheel, draft, emaar] });

    const listed = await t.query(api.publicCatalog.listPublishedDevelopers, {});
    expect(listed.map((row) => row.slug)).toEqual(["nakheel", "emaar"]);

    const featured = await t.query(api.publicCatalog.featuredDevelopers, {});
    expect(featured.map((row) => row.slug)).toEqual(["nakheel", "emaar"]);
  });
});

describe("publicCatalog.getPublishedDeveloperBySlug", () => {
  test("returns null for a draft slug", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.developers.create, {
      name: { en: "Emaar" },
      slug: "emaar",
      status: "draft",
    });

    const found = await t.query(api.publicCatalog.getPublishedDeveloperBySlug, { slug: "emaar" });
    expect(found).toBeNull();
  });

  test("omits unpublished inventory and empty contact", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const developerId = await asAdmin.mutation(api.developers.create, {
      name: { en: "Emaar" },
      slug: "emaar",
      status: "published",
    });
    await asAdmin.mutation(api.projects.create, {
      title: { en: "Draft Tower" },
      description: { en: "Hidden" },
      developerId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "upcoming",
      slug: "draft-tower",
      publishingStatus: "draft",
    });
    await asAdmin.mutation(api.projects.create, {
      title: { en: "Marina Heights" },
      description: { en: "A tower" },
      developerId,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "completed",
      slug: "marina-heights",
      publishingStatus: "published",
    });
    await asAdmin.mutation(api.properties.create, {
      ...propertyArgs,
      developerId,
      slug: "draft-unit",
      title: { en: "Draft Unit" },
      status: "draft",
    });
    await asAdmin.mutation(api.properties.create, {
      ...propertyArgs,
      developerId,
    });

    const found = await t.query(api.publicCatalog.getPublishedDeveloperBySlug, { slug: "emaar" });
    expect(found?.website).toBeNull();
    expect(found?.email).toBeNull();
    expect(found?.phone).toBeNull();
    expect(found?.description).toBeNull();
    expect(found?.projects.map((row) => row.slug)).toEqual(["marina-heights"]);
    expect(found?.properties.map((row) => row.slug)).toEqual(["marina-unit-101"]);
  });

  test("includes contact, description, and logo when set", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const developerId = await asAdmin.mutation(api.developers.create, {
      name: { en: "Emaar" },
      description: { en: "A published house" },
      website: "https://emaar.com",
      email: "press@emaar.com",
      phone: "+971 4 000 0000",
      slug: "emaar",
      status: "published",
    });
    await t.run(async (ctx) => {
      await ctx.db.insert("mediaItems", {
        entityType: "developer",
        entityId: developerId,
        url: "https://cdn.example/logo.png",
        pathname: `developer/${developerId}/logo.png`,
        mimeType: "image/png",
        order: 0,
        alt: { en: "Emaar" },
      });
    });

    const found = await t.query(api.publicCatalog.getPublishedDeveloperBySlug, { slug: "emaar" });
    expect(found?.description).toEqual({ en: "A published house" });
    expect(found?.website).toBe("https://emaar.com");
    expect(found?.email).toBe("press@emaar.com");
    expect(found?.phone).toBe("+971 4 000 0000");
    expect(found?.imageUrl).toBe("https://cdn.example/logo.png");
    expect(found?.images).toHaveLength(1);
  });
});

describe("publicCatalog.listPublishedAgents", () => {
  test("omits drafts and sorts by name", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.agents.create, {
      name: "Zara",
      email: "zara@example.com",
      slug: "zara",
      status: "published",
    });
    await asAdmin.mutation(api.agents.create, {
      name: "Sara Ahmed",
      email: "sara@example.com",
      slug: "sara-ahmed",
      status: "published",
    });
    await asAdmin.mutation(api.agents.create, {
      name: "Hidden",
      email: "hidden@example.com",
      slug: "hidden",
      status: "draft",
    });

    const listed = await t.query(api.publicCatalog.listPublishedAgents, {});
    expect(listed.map((row) => row.slug)).toEqual(["sara-ahmed", "zara"]);
    expect(listed[0]?.email).toBe("sara@example.com");
    expect(listed[0]?.phone).toBeNull();
    expect(listed[0]?.position).toBeNull();
  });
});

describe("publicCatalog.getPublishedAgentBySlug", () => {
  test("returns null for a draft slug", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    await asAdmin.mutation(api.agents.create, {
      name: "Sara Ahmed",
      email: "sara@example.com",
      slug: "sara-ahmed",
      status: "draft",
    });

    const found = await t.query(api.publicCatalog.getPublishedAgentBySlug, { slug: "sara-ahmed" });
    expect(found).toBeNull();
  });

  test("includes published listings only and never returns userId", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const agentId = await asAdmin.mutation(api.agents.create, {
      name: "Sara Ahmed",
      position: "Sales Manager",
      bio: { en: "Advisor" },
      email: "sara@example.com",
      phone: "+971 50 000 0000",
      slug: "sara-ahmed",
      status: "published",
    });
    await asAdmin.mutation(api.properties.create, {
      ...propertyArgs,
      agentId,
    });
    await asAdmin.mutation(api.properties.create, {
      ...propertyArgs,
      slug: "draft-unit",
      title: { en: "Draft Unit" },
      agentId,
      status: "draft",
    });

    const found = await t.query(api.publicCatalog.getPublishedAgentBySlug, { slug: "sara-ahmed" });
    expect(found?.name).toBe("Sara Ahmed");
    expect(found?.position).toBe("Sales Manager");
    expect(found?.bio).toEqual({ en: "Advisor" });
    expect(found?.email).toBe("sara@example.com");
    expect(found?.phone).toBe("+971 50 000 0000");
    expect(found?.properties.map((row) => row.slug)).toEqual(["marina-unit-101"]);
    expect(found && "userId" in found).toBe(false);
  });
});

describe("publicCatalog.listSearchPlaces", () => {
  test("returns published areas that have matching stock and omits empty or draft areas", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const marina = await asAdmin.mutation(api.communities.create, {
      name: { en: "Dubai Marina" },
      city: { en: "Dubai" },
      countryCode: "AE",
      slug: "dubai-marina",
      status: "published",
    });
    const bay = await asAdmin.mutation(api.communities.create, {
      name: { en: "Business Bay" },
      city: { en: "Dubai" },
      countryCode: "AE",
      slug: "business-bay",
      status: "published",
    });
    await asAdmin.mutation(api.communities.create, {
      name: { en: "Empty Bay" },
      city: { en: "Dubai" },
      countryCode: "AE",
      slug: "empty-bay",
      status: "published",
    });
    await asAdmin.mutation(api.communities.create, {
      name: { en: "Draft Marina" },
      city: { en: "Dubai" },
      countryCode: "AE",
      slug: "draft-marina",
      status: "draft",
    });
    await asAdmin.mutation(api.properties.create, { ...propertyArgs, communityId: marina });
    await asAdmin.mutation(api.properties.create, {
      ...propertyArgs,
      slug: "bay-rent",
      title: { en: "Bay Rent" },
      listingStatus: "for_rent",
      communityId: bay,
    });

    const sale = await t.query(api.publicCatalog.listSearchPlaces, { kind: "for_sale" });
    expect(sale.map((row) => row.name.en)).toEqual(["Dubai Marina"]);
    const rent = await t.query(api.publicCatalog.listSearchPlaces, { kind: "for_rent" });
    expect(rent.map((row) => row.name.en)).toEqual(["Business Bay"]);
  });

  test("returns areas with a published off-plan project", async () => {
    const t = convexTest(schema, modules);
    const asAdmin = await seedAdmin(t);
    const marina = await asAdmin.mutation(api.communities.create, {
      name: { en: "Dubai Marina" },
      city: { en: "Dubai" },
      countryCode: "AE",
      slug: "dubai-marina",
      status: "published",
    });
    const developerId = await asAdmin.mutation(api.developers.create, {
      name: { en: "Emaar" },
      slug: "emaar",
      status: "published",
    });
    await asAdmin.mutation(api.projects.create, {
      title: { en: "Marina Heights" },
      description: { en: "A tower" },
      developerId,
      communityId: marina,
      countryCode: "AE",
      city: { en: "Dubai" },
      status: "upcoming",
      slug: "marina-heights",
      publishingStatus: "published",
    });

    const places = await t.query(api.publicCatalog.listSearchPlaces, { kind: "offplan" });
    expect(places.map((row) => row.name.en)).toEqual(["Dubai Marina"]);
  });
});
