import { z } from "zod";
import { optionalEmailSchema, optionalUrlSchema, seoFieldsSchema } from "./shared";
import { safeGhlFormUrl } from "../ghl-form-url";
import { whatsappHref } from "../whatsapp-href";

export const optionalGhlFormUrlSchema = z
  .string()
  .optional()
  .refine((value) => !value || Boolean(safeGhlFormUrl(value)), {
    message: "Paste the form iframe src (https://go.quicktalkbusiness.com/widget/form/…), not the embed script.",
  });

export const websiteSettingsSchema = z.object({
  siteName: z.string().min(1),
  contactEmail: optionalEmailSchema,
  contactPhone: z.string().optional(),
  contactWhatsapp: z
    .string()
    .optional()
    .refine((value) => !value || Boolean(whatsappHref(value)), {
      message: "Enter a WhatsApp number or wa.me link",
    }),
  contactFormUrl: optionalGhlFormUrlSchema,
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
