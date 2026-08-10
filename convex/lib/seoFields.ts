import { v, type Infer } from "convex/values";
import { localizedTextValidator } from "./localizedText";

export const seoFieldsValidator = v.object({
  seoTitle: v.optional(localizedTextValidator),
  seoDescription: v.optional(localizedTextValidator),
  canonicalPath: v.optional(v.string()),
});

export type SeoFields = Infer<typeof seoFieldsValidator>;

// Distinct from any entity's own listing/construction status (e.g.
// `properties.listingStatus`) — this is CMS visibility only: draft content
// is never served on the public site regardless of any other status field.
export const publishingFieldsValidator = v.object({
  slug: v.string(),
  status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
  publishedAt: v.optional(v.number()),
  updatedAt: v.number(),
});

export type PublishingFields = Infer<typeof publishingFieldsValidator>;
