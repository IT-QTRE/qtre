import { z } from "zod";
import { localizedTextSchema, publishingFieldsSchema, seoFieldsSchema } from "./shared";

export const communitySchema = z.object({
  name: localizedTextSchema,
  city: localizedTextSchema,
  countryCode: z.string().regex(/^[A-Z]{2}$/, "Use an ISO 3166-1 alpha-2 code, e.g. AE"),
  description: localizedTextSchema.optional(),
  seo: seoFieldsSchema.optional(),
  publishing: publishingFieldsSchema,
});
