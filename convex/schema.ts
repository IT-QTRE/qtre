import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { localizedTextValidator } from "./lib/localizedText";
import { seoFieldsValidator, publishingFieldsValidator } from "./lib/seoFields";
import { relatedValidator } from "./lib/blogRelated";
import { mediaEntityTypeValidator } from "./lib/mediaEntityType";
import { roleValidator, resourceValidator } from "./lib/roles";
import { propertySharedFactsValidator } from "./lib/propertyFacts";
import { furnishingValidator, propertyTypeValidator, rentalPeriodValidator } from "./lib/propertyAttributes";
import { completionDateValidator } from "./lib/completionDate";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.string(),
    name: v.string(),
    role: roleValidator,
    createdAt: v.number(),
    // Super Admin-configured, per-account runtime override — resources
    // listed here are hidden from the nav AND blocked server-side (via
    // `requireRole`) for this specific user. Only ever meaningful/settable
    // when `role === "admin"`; never affects super_admin/agent/client.
    disabledResources: v.optional(v.array(resourceValidator)),
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
    .index("by_created_at", ["createdAt"])
    .index("by_resource", ["resource", "createdAt"]),

  developers: defineTable({
    name: localizedTextValidator,
    description: v.optional(localizedTextValidator),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    seo: v.optional(seoFieldsValidator),
    publishing: publishingFieldsValidator,
    rank: v.optional(v.number()),
  })
    .index("by_publishing_slug", ["publishing.slug"])
    .index("by_publishing_status", ["publishing.status"]),

  // `name` and `position` are plain strings, not LocalizedText — a person's
  // proper name and job title stay in one language (admin is English).
  agents: defineTable({
    name: v.string(),
    position: v.optional(v.string()),
    bio: v.optional(localizedTextValidator),
    email: v.string(),
    phone: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    seo: v.optional(seoFieldsValidator),
    publishing: publishingFieldsValidator,
  })
    .index("by_publishing_slug", ["publishing.slug"])
    .index("by_publishing_status", ["publishing.status"])
    .index("by_user", ["userId"]),

  communities: defineTable({
    name: localizedTextValidator,
    city: localizedTextValidator,
    countryCode: v.string(),
    description: v.optional(localizedTextValidator),
    seo: v.optional(seoFieldsValidator),
    publishing: publishingFieldsValidator,
    rank: v.optional(v.number()),
  })
    .index("by_country_and_slug", ["countryCode", "publishing.slug"])
    .index("by_publishing_status", ["publishing.status"]),

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
    // Portal-style handover window (Q4 2027), not a calendar day.
    completionDate: v.optional(completionDateValidator),
    startingPrice: v.optional(v.number()),
    // Studio = 0, 4 = 4+. Size/price ranges live on `unitTypes`; this list
    // is the selected mix for catalog cards (kept in sync on write).
    bedroomTypes: v.optional(v.array(v.number())),
    unitTypes: v.optional(
      v.array(
        v.object({
          bedrooms: v.union(v.literal(0), v.literal(1), v.literal(2), v.literal(3), v.literal(4)),
          minAreaSqm: v.optional(v.number()),
          maxAreaSqm: v.optional(v.number()),
          minAreaSqft: v.optional(v.number()),
          maxAreaSqft: v.optional(v.number()),
          minPrice: v.optional(v.number()),
          maxPrice: v.optional(v.number()),
        }),
      ),
    ),
    coordinates: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    address: v.optional(v.string()),
    placeId: v.optional(v.string()),
    amenities: v.optional(v.array(v.string())),
    // A handful of milestones (down payment, construction stages, handover,
    // etc.), not an open-ended log — small and bounded like `amenities`, so
    // it stays a plain array on the document rather than its own table.
    paymentPlan: v.optional(
      v.array(v.object({ label: v.string(), percentage: v.number(), note: v.optional(v.string()) })),
    ),
    seo: v.optional(seoFieldsValidator),
    publishing: publishingFieldsValidator,
    // The Admin (never Super Admin) who created this project — Admins may
    // only update/delete/see projects where this matches their own
    // `users._id` (enforced in `convex/projects.ts`, not by the role
    // matrix). Super Admin is exempt and always sees/manages everything.
    createdBy: v.id("users"),
  })
    .index("by_developer", ["developerId"])
    .index("by_community", ["communityId"])
    .index("by_publishing_slug", ["publishing.slug"])
    .index("by_publishing_status", ["publishing.status"])
    .index("by_created_by", ["createdBy"]),

  properties: defineTable({
    ...propertySharedFactsValidator.fields,
    title: localizedTextValidator,
    description: localizedTextValidator,
    city: localizedTextValidator,
    coordinates: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    address: v.optional(v.string()),
    placeId: v.optional(v.string()),
    listingStatus: v.union(
      v.literal("for_sale"),
      v.literal("for_rent"),
      v.literal("sold"),
      v.literal("rented"),
      v.literal("off_market"),
    ),
    propertyType: v.optional(propertyTypeValidator),
    furnishing: v.optional(furnishingValidator),
    rentalPeriod: v.optional(rentalPeriodValidator),
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
    // Same Admin-scoping as `projects.createdBy` above — see that comment.
    createdBy: v.id("users"),
  })
    .index("by_agent", ["agentId"])
    .index("by_project", ["projectId"])
    .index("by_developer", ["developerId"])
    .index("by_community", ["communityId"])
    .index("by_publishing_slug", ["publishing.slug"])
    .index("by_listing_status", ["listingStatus"])
    .index("by_publishing_status_and_listingStatus", ["publishing.status", "listingStatus"])
    .index("by_created_by", ["createdBy"]),

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
    .index("by_assigned_agent", ["assignedAgentId"])
    .index("by_created_at", ["createdAt"]),

  blogCategories: defineTable({
    name: localizedTextValidator,
    slug: v.string(),
  }).index("by_slug", ["slug"]),

  blogPosts: defineTable({
    title: localizedTextValidator,
    body: localizedTextValidator,
    // Also doubles as the Admin-scoping field described on
    // `projects.createdBy` above — an Admin (never Super Admin) may only
    // update/delete/see posts where this matches their own `users._id`.
    authorUserId: v.id("users"),
    categoryId: v.optional(v.id("blogCategories")),
    seo: v.optional(seoFieldsValidator),
    related: v.optional(relatedValidator),
    publishing: publishingFieldsValidator,
  })
    .index("by_publishing_slug", ["publishing.slug"])
    .index("by_publishing_status", ["publishing.status"])
    .index("by_author", ["authorUserId"])
    .index("by_category", ["categoryId"]),

  websiteSettings: defineTable({
    siteName: v.string(),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    contactWhatsapp: v.optional(v.string()),
    socialLinks: v.optional(
      v.object({
        facebook: v.optional(v.string()),
        instagram: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        twitter: v.optional(v.string()),
      }),
    ),
    defaultSeo: v.optional(seoFieldsValidator),
    contactFormUrl: v.optional(v.string()),
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
