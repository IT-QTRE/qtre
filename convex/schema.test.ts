/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("users table", () => {
  test("inserts a user and looks it up by tokenIdentifier", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        tokenIdentifier: "clerk|user-1",
        email: "user1@example.com",
        name: "User One",
        role: "admin",
        createdAt: Date.now(),
      });
    });

    const found = await t.run(async (ctx) => {
      return await ctx.db
        .query("users")
        .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", "clerk|user-1"))
        .unique();
    });

    expect(found?._id).toBe(userId);
  });
});

describe("auditLogs table", () => {
  test("records an action against an actor", async () => {
    const t = convexTest(schema, modules);
    const actorUserId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        tokenIdentifier: "clerk|admin-1",
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
        createdAt: Date.now(),
      });
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("auditLogs", {
        actorUserId,
        resource: "properties",
        action: "delete",
        createdAt: Date.now(),
      });
    });

    const logs = await t.run(async (ctx) => {
      return await ctx.db
        .query("auditLogs")
        .withIndex("by_actor", (q) => q.eq("actorUserId", actorUserId))
        .collect();
    });

    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe("delete");
  });
});

describe("developers table", () => {
  test("inserts a developer with a localized name and publishing fields", async () => {
    const t = convexTest(schema, modules);
    const developerId = await t.run(async (ctx) => {
      return await ctx.db.insert("developers", {
        name: { en: "Emaar Properties", ar: "إعمار العقارية" },
        publishing: { slug: "emaar-properties", status: "published", updatedAt: Date.now() },
      });
    });
    const found = await t.run(async (ctx) => ctx.db.get(developerId));
    expect(found?.name.en).toBe("Emaar Properties");
  });
});

describe("agents table", () => {
  test("links an agent to a users row via userId", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        tokenIdentifier: "clerk|agent-1",
        email: "agent1@example.com",
        name: "Agent One",
        role: "agent",
        createdAt: Date.now(),
      });
    });
    await t.run(async (ctx) => {
      await ctx.db.insert("agents", {
        name: "Agent One",
        email: "agent1@example.com",
        userId,
        publishing: { slug: "agent-one", status: "published", updatedAt: Date.now() },
      });
    });
    const found = await t.run(async (ctx) => {
      return await ctx.db.query("agents").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    });
    expect(found?.name).toBe("Agent One");
  });
});

describe("communities table", () => {
  test("is queryable by countryCode + slug together", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("communities", {
        name: { en: "Dubai Marina", ar: "دبي مارينا" },
        city: { en: "Dubai", ar: "دبي" },
        countryCode: "AE",
        publishing: { slug: "dubai-marina", status: "published", updatedAt: Date.now() },
      });
    });
    const found = await t.run(async (ctx) => {
      return await ctx.db
        .query("communities")
        .withIndex("by_country_and_slug", (q) => q.eq("countryCode", "AE").eq("publishing.slug", "dubai-marina"))
        .unique();
    });
    expect(found?.name.en).toBe("Dubai Marina");
  });

  test("supports a second country's communities with no schema change", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("communities", {
        name: { en: "Sukhumvit" },
        city: { en: "Bangkok" },
        countryCode: "TH",
        publishing: { slug: "sukhumvit", status: "published", updatedAt: Date.now() },
      });
    });
    const found = await t.run(async (ctx) => {
      return await ctx.db
        .query("communities")
        .withIndex("by_country_and_slug", (q) => q.eq("countryCode", "TH").eq("publishing.slug", "sukhumvit"))
        .unique();
    });
    expect(found?.city.en).toBe("Bangkok");
  });
});

describe("mediaItems table", () => {
  test("orders items for one entity via the by_entity index, independent of other entities", async () => {
    const t = convexTest(schema, modules);
    const developerId = await t.run(async (ctx) => {
      return await ctx.db.insert("developers", {
        name: { en: "Emaar Properties" },
        publishing: { slug: "emaar-properties", status: "published", updatedAt: Date.now() },
      });
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("mediaItems", {
        entityType: "developer",
        entityId: developerId,
        url: "https://example.com/logo.png",
        pathname: "developers/emaar/logo.png",
        order: 0,
        mimeType: "image/png",
      });
      // A second, unrelated entity's media must not show up in the query below.
      await ctx.db.insert("mediaItems", {
        entityType: "community",
        entityId: "some-other-id",
        url: "https://example.com/hero.png",
        pathname: "communities/dubai-marina/hero.png",
        order: 0,
        mimeType: "image/png",
      });
    });

    const developerMedia = await t.run(async (ctx) => {
      return await ctx.db
        .query("mediaItems")
        .withIndex("by_entity", (q) => q.eq("entityType", "developer").eq("entityId", developerId))
        .collect();
    });

    expect(developerMedia).toHaveLength(1);
    expect(developerMedia[0].url).toBe("https://example.com/logo.png");
  });
});

describe("projects table", () => {
  test("references a developer and an optional community", async () => {
    const t = convexTest(schema, modules);
    const developerId = await t.run(async (ctx) => {
      return await ctx.db.insert("developers", {
        name: { en: "Emaar Properties" },
        publishing: { slug: "emaar-properties", status: "published", updatedAt: Date.now() },
      });
    });
    const communityId = await t.run(async (ctx) => {
      return await ctx.db.insert("communities", {
        name: { en: "Dubai Marina" },
        city: { en: "Dubai" },
        countryCode: "AE",
        publishing: { slug: "dubai-marina", status: "published", updatedAt: Date.now() },
      });
    });
    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        title: { en: "Marina Heights" },
        description: { en: "A waterfront tower." },
        developerId,
        communityId,
        countryCode: "AE",
        city: { en: "Dubai" },
        status: "under_construction",
        publishing: { slug: "marina-heights", status: "published", updatedAt: Date.now() },
      });
    });
    const byDeveloper = await t.run(async (ctx) => {
      return await ctx.db.query("projects").withIndex("by_developer", (q) => q.eq("developerId", developerId)).collect();
    });
    expect(byDeveloper.map((p) => p._id)).toContain(projectId);
  });
});

describe("properties table", () => {
  test("stores shared facts alongside translated content and optional relationships", async () => {
    const t = convexTest(schema, modules);
    const agentId = await t.run(async (ctx) => {
      return await ctx.db.insert("agents", {
        name: "Agent One",
        email: "agent1@example.com",
        publishing: { slug: "agent-one", status: "published", updatedAt: Date.now() },
      });
    });
    const propertyId = await t.run(async (ctx) => {
      return await ctx.db.insert("properties", {
        price: 2_500_000,
        bedrooms: 3,
        bathrooms: 2,
        areaSqft: 1800,
        countryCode: "AE",
        title: { en: "Marina View Apartment" },
        description: { en: "A stunning apartment with marina views." },
        city: { en: "Dubai" },
        listingStatus: "for_sale",
        agentId,
        publishing: { slug: "marina-view-apartment", status: "published", updatedAt: Date.now() },
      });
    });
    const byAgent = await t.run(async (ctx) => {
      return await ctx.db.query("properties").withIndex("by_agent", (q) => q.eq("agentId", agentId)).collect();
    });
    expect(byAgent.map((p) => p._id)).toContain(propertyId);
    const found = await t.run(async (ctx) => ctx.db.get(propertyId));
    expect(found?.price).toBe(2_500_000);
    expect(found?.title.en).toBe("Marina View Apartment");
  });
});

describe("leads table", () => {
  test("can be filtered by status via an index, and optionally links to a property/project/agent", async () => {
    const t = convexTest(schema, modules);
    const agentId = await t.run(async (ctx) => {
      return await ctx.db.insert("agents", {
        name: "Agent One",
        email: "agent1@example.com",
        publishing: { slug: "agent-one", status: "published", updatedAt: Date.now() },
      });
    });
    const propertyId = await t.run(async (ctx) => {
      return await ctx.db.insert("properties", {
        price: 2_500_000,
        bedrooms: 3,
        bathrooms: 2,
        areaSqft: 1800,
        countryCode: "AE",
        title: { en: "Marina View Apartment" },
        description: { en: "A stunning apartment with marina views." },
        city: { en: "Dubai" },
        listingStatus: "for_sale",
        agentId,
        publishing: { slug: "marina-view-apartment", status: "published", updatedAt: Date.now() },
      });
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("leads", {
        name: "Jane Buyer",
        email: "jane@example.com",
        propertyId,
        status: "new",
        assignedAgentId: agentId,
        createdAt: Date.now(),
      });
    });

    const newLeads = await t.run(async (ctx) => {
      return await ctx.db.query("leads").withIndex("by_status", (q) => q.eq("status", "new")).collect();
    });
    expect(newLeads).toHaveLength(1);
    expect(newLeads[0].propertyId).toBe(propertyId);

    const assignedToAgent = await t.run(async (ctx) => {
      return await ctx.db
        .query("leads")
        .withIndex("by_assigned_agent", (q) => q.eq("assignedAgentId", agentId))
        .collect();
    });
    expect(assignedToAgent).toHaveLength(1);
  });
});

describe("blogPosts table", () => {
  test("requires an authorUserId referencing users", async () => {
    const t = convexTest(schema, modules);
    const authorUserId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        tokenIdentifier: "clerk|author-1",
        email: "author1@example.com",
        name: "Author One",
        role: "admin",
        createdAt: Date.now(),
      });
    });
    const postId = await t.run(async (ctx) => {
      return await ctx.db.insert("blogPosts", {
        title: { en: "Dubai Market Update" },
        body: { en: "The market is..." },
        authorUserId,
        publishing: { slug: "dubai-market-update", status: "published", updatedAt: Date.now() },
      });
    });
    const byAuthor = await t.run(async (ctx) => {
      return await ctx.db.query("blogPosts").withIndex("by_author", (q) => q.eq("authorUserId", authorUserId)).collect();
    });
    expect(byAuthor.map((p) => p._id)).toContain(postId);
  });
});

describe("websiteSettings table", () => {
  test("stores a single settings document with structured fields", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("websiteSettings", {
        siteName: "QuickTalk Real Estate",
        contactEmail: "hello@qtre.ae",
        socialLinks: { instagram: "https://instagram.com/qtre" },
        updatedAt: Date.now(),
      });
    });
    const settings = await t.run(async (ctx) => ctx.db.query("websiteSettings").first());
    expect(settings?.siteName).toBe("QuickTalk Real Estate");
    expect(settings?.socialLinks?.instagram).toBe("https://instagram.com/qtre");
  });
});

describe("propertySubmissions table", () => {
  test("supports the full pending -> approved lifecycle with a back-reference to the created property", async () => {
    const t = convexTest(schema, modules);
    const clientId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        tokenIdentifier: "clerk|client-1",
        email: "owner@example.com",
        name: "Property Owner",
        role: "client",
        createdAt: Date.now(),
      });
    });
    const reviewerId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        tokenIdentifier: "clerk|agent-2",
        email: "agent2@example.com",
        name: "Reviewing Agent",
        role: "agent",
        createdAt: Date.now(),
      });
    });

    const submissionId = await t.run(async (ctx) => {
      return await ctx.db.insert("propertySubmissions", {
        clientId,
        assignedReviewerId: reviewerId,
        price: 1_800_000,
        bedrooms: 2,
        bathrooms: 2,
        areaSqft: 1200,
        countryCode: "AE",
        title: "My apartment in JBR",
        description: "Sea view, high floor.",
        city: "Dubai",
        status: "under_review",
        submittedAt: Date.now(),
      });
    });

    const propertyId = await t.run(async (ctx) => {
      return await ctx.db.insert("properties", {
        price: 1_800_000,
        bedrooms: 2,
        bathrooms: 2,
        areaSqft: 1200,
        countryCode: "AE",
        title: { en: "Apartment in JBR" },
        description: { en: "Sea view, high floor." },
        city: { en: "Dubai" },
        listingStatus: "for_sale",
        sourceSubmissionId: submissionId,
        publishing: { slug: "apartment-in-jbr", status: "published", updatedAt: Date.now() },
      });
    });

    await t.run(async (ctx) => {
      await ctx.db.patch(submissionId, {
        status: "approved",
        convertedPropertyId: propertyId,
        reviewedAt: Date.now(),
      });
    });

    const approved = await t.run(async (ctx) => ctx.db.get(submissionId));
    expect(approved?.status).toBe("approved");
    expect(approved?.convertedPropertyId).toBe(propertyId);

    const createdProperty = await t.run(async (ctx) => ctx.db.get(propertyId));
    expect(createdProperty?.sourceSubmissionId).toBe(submissionId);
  });

  test("records a rejection reason for the rejected path", async () => {
    const t = convexTest(schema, modules);
    const clientId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        tokenIdentifier: "clerk|client-2",
        email: "owner2@example.com",
        name: "Another Owner",
        role: "client",
        createdAt: Date.now(),
      });
    });
    const submissionId = await t.run(async (ctx) => {
      return await ctx.db.insert("propertySubmissions", {
        clientId,
        price: 500_000,
        bedrooms: 1,
        bathrooms: 1,
        areaSqft: 600,
        countryCode: "AE",
        title: "Studio",
        description: "A studio.",
        city: "Sharjah",
        status: "pending",
        submittedAt: Date.now(),
      });
    });
    await t.run(async (ctx) => {
      await ctx.db.patch(submissionId, {
        status: "rejected",
        rejectionReason: "Missing title deed documentation.",
        reviewedAt: Date.now(),
      });
    });
    const rejected = await t.run(async (ctx) => ctx.db.get(submissionId));
    expect(rejected?.status).toBe("rejected");
    expect(rejected?.rejectionReason).toBe("Missing title deed documentation.");
  });

  test("can be listed by assigned reviewer", async () => {
    const t = convexTest(schema, modules);
    const clientId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        tokenIdentifier: "clerk|client-3",
        email: "owner3@example.com",
        name: "Owner Three",
        role: "client",
        createdAt: Date.now(),
      });
    });
    const reviewerId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        tokenIdentifier: "clerk|agent-3",
        email: "agent3@example.com",
        name: "Agent Three",
        role: "agent",
        createdAt: Date.now(),
      });
    });
    await t.run(async (ctx) => {
      await ctx.db.insert("propertySubmissions", {
        clientId,
        assignedReviewerId: reviewerId,
        price: 900_000,
        bedrooms: 2,
        bathrooms: 1,
        areaSqft: 950,
        countryCode: "AE",
        title: "Family home",
        description: "Nice place.",
        city: "Abu Dhabi",
        status: "under_review",
        submittedAt: Date.now(),
      });
    });
    const assigned = await t.run(async (ctx) => {
      return await ctx.db
        .query("propertySubmissions")
        .withIndex("by_assigned_reviewer", (q) => q.eq("assignedReviewerId", reviewerId))
        .collect();
    });
    expect(assigned).toHaveLength(1);
  });
});
