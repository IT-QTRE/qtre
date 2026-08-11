import { z } from "zod";
import { localizedTextSchema, optionalEmailSchema, optionalUrlSchema, publishingFieldsSchema, seoFieldsSchema } from "./shared";

export const developerSchema = z.object({
  name: localizedTextSchema,
  description: localizedTextSchema.optional(),
  website: optionalUrlSchema,
  phone: z.string().optional(),
  email: optionalEmailSchema,
  seo: seoFieldsSchema.optional(),
  publishing: publishingFieldsSchema,
});
