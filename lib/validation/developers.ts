import { z } from "zod";
import { localizedTextSchema, publishingFieldsSchema, seoFieldsSchema } from "./shared";

export const developerSchema = z.object({
  name: localizedTextSchema,
  description: localizedTextSchema.optional(),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  email: z.email().optional(),
  seo: seoFieldsSchema.optional(),
  publishing: publishingFieldsSchema,
});
