import { z } from "zod";
import { optionalEmailSchema, optionalUrlSchema, seoFieldsSchema } from "./shared";

export const websiteSettingsSchema = z.object({
  siteName: z.string().min(1),
  contactEmail: optionalEmailSchema,
  contactPhone: z.string().optional(),
  socialLinks: z
    .object({
      facebook: optionalUrlSchema,
      instagram: optionalUrlSchema,
      linkedin: optionalUrlSchema,
      twitter: optionalUrlSchema,
    })
    .optional(),
  defaultSeo: seoFieldsSchema.optional(),
});
