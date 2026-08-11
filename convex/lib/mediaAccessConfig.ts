import type { MediaEntityType } from "./mediaEntityType";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

type MediaAccessRule = {
  access: "public" | "private";
  allowedContentTypes: string[];
  maxSizeBytes: number;
};

// Single source of truth for both halves of the upload pipeline: the Route
// Handler (app/api/blob/upload/route.ts) reads this to pick which Blob
// store's token to use and what to allow; convex/lib/mediaAuthorization.ts
// reads the `access` field to decide whether a read requires authentication.
export const MEDIA_ACCESS_CONFIG: Record<MediaEntityType, MediaAccessRule> = {
  property: { access: "public", allowedContentTypes: IMAGE_TYPES, maxSizeBytes: 15 * 1024 * 1024 },
  project: { access: "public", allowedContentTypes: IMAGE_TYPES, maxSizeBytes: 15 * 1024 * 1024 },
  developer: { access: "public", allowedContentTypes: IMAGE_TYPES, maxSizeBytes: 15 * 1024 * 1024 },
  agent: { access: "public", allowedContentTypes: IMAGE_TYPES, maxSizeBytes: 15 * 1024 * 1024 },
  community: { access: "public", allowedContentTypes: IMAGE_TYPES, maxSizeBytes: 15 * 1024 * 1024 },
  blogPost: { access: "public", allowedContentTypes: IMAGE_TYPES, maxSizeBytes: 15 * 1024 * 1024 },
  // Real client-submitted documents (title deeds, floor plans) — private
  // store, images+PDF, and a slightly higher cap since multi-page scans
  // aren't pre-compressed the way images are (compressImage.ts only
  // touches image/* files, PDFs pass through unchanged).
  propertySubmission: {
    access: "private",
    allowedContentTypes: [...IMAGE_TYPES, "application/pdf"],
    maxSizeBytes: 25 * 1024 * 1024,
  },
};

// Every blob's pathname must live under this entity-scoped prefix — enforced
// both at upload-token time (app/api/blob/upload/route.ts's
// onBeforeGenerateToken) and again at record-creation time
// (convex/mediaItems.ts's `create`). Without this, a client mutation's
// `pathname` argument is just a string the caller can set to ANY value,
// including another entity's real (leaked) pathname — since `create`'s
// authorization only checks that the caller owns `entityId`, not that the
// blob at `pathname` has anything to do with it. Binding `entityId` into the
// required prefix makes that cross-entity substitution impossible: a
// pathname claiming to belong to entity A can't simultaneously satisfy "the
// pathname is prefixed with the caller's own entity B's id."
export function requiredPathnamePrefix(entityType: MediaEntityType, entityId: string): string {
  return `${entityType}/${entityId}/`;
}
