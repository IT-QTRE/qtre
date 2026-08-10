import { z } from "zod";
import { seoFieldsSchema } from "./shared";

export const websiteSettingsSchema = z.object({
  siteName: z.string().min(1),
  contactEmail: z.email().optional(),
  contactPhone: z.string().optional(),
  socialLinks: z
    .object({
      facebook: z.string().url().optional(),
      instagram: z.string().url().optional(),
      linkedin: z.string().url().optional(),
      twitter: z.string().url().optional(),
    })
    .optional(),
  defaultSeo: seoFieldsSchema.optional(),
});
