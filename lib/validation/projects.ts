import { z } from "zod";
import { localizedTextSchema, paymentPlanSchema, publishingFieldsSchema, seoFieldsSchema } from "./shared";

export const projectSchema = z.object({
  title: localizedTextSchema,
  description: localizedTextSchema,
  developerId: z.string().min(1),
  communityId: z.string().optional(),
  countryCode: z.string().regex(/^[A-Z]{2}$/, "Use an ISO 3166-1 alpha-2 code, e.g. AE"),
  city: localizedTextSchema,
  status: z.enum(["upcoming", "under_construction", "completed"]),
  startingPrice: z.number().positive().optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  amenities: z.array(z.string()).optional(),
  paymentPlan: paymentPlanSchema,
  seo: seoFieldsSchema.optional(),
  publishing: publishingFieldsSchema,
});
