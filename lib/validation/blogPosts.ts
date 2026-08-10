import { z } from "zod";
import { localizedTextSchema, publishingFieldsSchema, seoFieldsSchema } from "./shared";

export const blogPostSchema = z.object({
  title: localizedTextSchema,
  body: localizedTextSchema,
  authorUserId: z.string().min(1),
  seo: seoFieldsSchema.optional(),
  publishing: publishingFieldsSchema,
});
