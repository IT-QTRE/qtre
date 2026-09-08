import { z } from "zod";
import { optionalEmailSchema, optionalUrlSchema, seoFieldsSchema } from "./shared";
import { safeGhlFormUrl } from "../ghl-form-url";
import { safeGhlChatWidgetId } from "../ghl-chat-widget-id";
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
  chatWidgetId: z
    .string()
    .optional()
    .refine((value) => !value || Boolean(safeGhlChatWidgetId(value)), {
      message: "Paste the chat widget ID or the loader script (data-widget-id).",
    }),
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
