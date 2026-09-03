import { z } from "zod";
import { localizedTextSchema, publishingFieldsSchema, seoFieldsSchema } from "./shared";

export const agentSchema = z.object({
  name: z.string().min(1),
  position: z.string().max(80).optional(),
  bio: localizedTextSchema.optional(),
  email: z.email(),
  phone: z.string().optional(),
  userId: z.string().optional(),
  seo: seoFieldsSchema.optional(),
  publishing: publishingFieldsSchema,
});
