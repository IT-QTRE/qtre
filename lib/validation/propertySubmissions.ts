import { z } from "zod";
import { propertySharedFactsSchema } from "./propertyShared";

// Only the fields a client fills out on the public "List Your Property"
// form. Staff-only fields (status, assignedReviewerId, rejectionReason,
// convertedPropertyId, submittedAt/reviewedAt) are set server-side by the
// Convex mutation itself in Phase 6, never supplied by the client, so they
// are intentionally absent here.
export const propertySubmissionSchema = propertySharedFactsSchema.extend({
  title: z.string().min(1),
  description: z.string().min(1),
  city: z.string().min(1),
});
