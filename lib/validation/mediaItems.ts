import { z } from "zod";
import { localizedTextSchema } from "./shared";

export const mediaItemSchema = z.object({
  entityType: z.enum(["property", "project", "developer", "agent", "community", "blogPost", "propertySubmission"]),
  entityId: z.string().min(1),
  url: z.string().url(),
  pathname: z.string().min(1),
  alt: localizedTextSchema.optional(),
  order: z.number().int().nonnegative(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  mimeType: z.string().min(1),
});
