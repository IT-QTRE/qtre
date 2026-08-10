import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { localizedTextValidator } from "./lib/localizedText";
import { seoFieldsValidator, publishingFieldsValidator } from "./lib/seoFields";
import { mediaEntityTypeValidator } from "./lib/mediaEntityType";
import { roleValidator } from "./lib/roles";
import { propertySharedFactsValidator } from "./lib/propertyFacts";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.string(),
    name: v.string(),
    role: roleValidator,
    createdAt: v.number(),
  })
    .index("by_token_identifier", ["tokenIdentifier"])
    .index("by_role", ["role"]),

  auditLogs: defineTable({
    actorUserId: v.id("users"),
    resource: v.string(),
    action: v.string(),
    targetId: v.optional(v.string()),
    details: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_actor", ["actorUserId"])
    .index("by_created_at", ["createdAt"]),

  developers: defineTable({
    name: localizedTextValidator,
    description: v.optional(localizedTextValidator),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    seo: v.optional(seoFieldsValidator),
    publishing: publishingFieldsValidator,
  })
    .index("by_publishing_slug", ["publishing.slug"])
    .index("by_publishing_status", ["publishing.status"]),

  // `name` is a plain string, not LocalizedText — a person's proper name
  // isn't translated (mirrors how Developer names could be, but people's
  // names generally aren't).
  agents: defineTable({
    name: v.string(),
    bio: v.optional(localizedTextValidator),
    email: v.string(),
    phone: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    seo: v.optional(seoFieldsValidator),
    publishing: publishingFieldsValidator,
  })
    .index("by_publishing_slug", ["publishing.slug"])
    .index("by_user", ["userId"]),

  communities: defineTable({
    name: localizedTextValidator,
    city: localizedTextValidator,
    countryCode: v.string(),
    description: v.optional(localizedTextValidator),
    seo: v.optional(seoFieldsValidator),
    publishing: publishingFieldsValidator,
  }).index("by_country_and_slug", ["countryCode", "publishing.slug"]),

  mediaItems: defineTable({
    entityType: mediaEntityTypeValidator,
    entityId: v.string(),
    url: v.string(),
    pathname: v.string(),
    alt: v.optional(localizedTextValidator),
    order: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    mimeType: v.string(),
  }).index("by_entity", ["entityType", "entityId", "order"]),

  projects: defineTable({
    title: localizedTextValidator,
    description: localizedTextValidator,
    developerId: v.id("developers"),
    communityId: v.optional(v.id("communities")),
    countryCode: v.string(),
    city: localizedTextValidator,
    status: v.union(v.literal("upcoming"), v.literal("under_construction"), v.literal("completed")),
    startingPrice: v.optional(v.number()),
    coordinates: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    amenities: v.optional(v.array(v.string())),
    seo: v.optional(seoFieldsValidator),
    publishing: publishingFieldsValidator,
  })
    .index("by_developer", ["developerId"])
    .index("by_community", ["communityId"])
    .index("by_publishing_slug", ["publishing.slug"])
    .index("by_publishing_status", ["publishing.status"]),

  properties: defineTable({
    ...propertySharedFactsValidator.fields,
    title: localizedTextValidator,
    description: localizedTextValidator,
    city: localizedTextValidator,
    coordinates: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    listingStatus: v.union(
      v.literal("for_sale"),
      v.literal("for_rent"),
      v.literal("sold"),
      v.literal("rented"),
      v.literal("off_market"),
    ),
    amenities: v.optional(v.array(v.string())),
    communityId: v.optional(v.id("communities")),
    developerId: v.optional(v.id("developers")),
    projectId: v.optional(v.id("projects")),
    agentId: v.optional(v.id("agents")),
    // Added now (not in Task 9) because it references `propertySubmissions`,
    // defined for the first time just below in this same file.
    sourceSubmissionId: v.optional(v.id("propertySubmissions")),
    seo: v.optional(seoFieldsValidator),
    publishing: publishingFieldsValidator,
  })
    .index("by_agent", ["agentId"])
    .index("by_project", ["projectId"])
    .index("by_developer", ["developerId"])
    .index("by_community", ["communityId"])
    .index("by_publishing_slug", ["publishing.slug"])
    .index("by_listing_status", ["listingStatus"]),

  leads: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    message: v.optional(v.string()),
    propertyId: v.optional(v.id("properties")),
    projectId: v.optional(v.id("projects")),
    status: v.union(v.literal("new"), v.literal("contacted"), v.literal("qualified"), v.literal("closed")),
    assignedAgentId: v.optional(v.id("agents")),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_assigned_agent", ["assignedAgentId"]),

  blogPosts: defineTable({
    title: localizedTextValidator,
    body: localizedTextValidator,
    authorUserId: v.id("users"),
    seo: v.optional(seoFieldsValidator),
    publishing: publishingFieldsValidator,
  })
    .index("by_publishing_slug", ["publishing.slug"])
    .index("by_author", ["authorUserId"]),

  websiteSettings: defineTable({
    siteName: v.string(),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    socialLinks: v.optional(
      v.object({
        facebook: v.optional(v.string()),
        instagram: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        twitter: v.optional(v.string()),
      }),
    ),
    defaultSeo: v.optional(seoFieldsValidator),
    updatedAt: v.number(),
  }),

  propertySubmissions: defineTable({
    ...propertySharedFactsValidator.fields,
    clientId: v.id("users"),
    assignedReviewerId: v.optional(v.id("users")),
    title: v.string(),
    description: v.string(),
    city: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("under_review"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    rejectionReason: v.optional(v.string()),
    convertedPropertyId: v.optional(v.id("properties")),
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
  })
    .index("by_client", ["clientId"])
    .index("by_assigned_reviewer", ["assignedReviewerId"])
    .index("by_status", ["status"]),
});
