import { z } from "zod";
import { localizedTextSchema, paymentPlanSchema, publishingFieldsSchema, seoFieldsSchema } from "./shared";

export const bedroomTypeSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);

export const unitTypeSpecSchema = z.object({
  bedrooms: bedroomTypeSchema,
  minAreaSqm: z.number().positive().optional(),
  maxAreaSqm: z.number().positive().optional(),
  minAreaSqft: z.number().positive().optional(),
  maxAreaSqft: z.number().positive().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
});

export const projectSchema = z.object({
  title: localizedTextSchema,
  description: localizedTextSchema,
  developerId: z.string().min(1),
  communityId: z.string().optional(),
  countryCode: z.string().regex(/^[A-Z]{2}$/, "Use an ISO 3166-1 alpha-2 code, e.g. AE"),
  city: localizedTextSchema,
  status: z.enum(["upcoming", "under_construction", "completed"]),
  completionDate: z
    .object({
      quarter: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
      year: z.number().int().min(2000).max(2100),
    })
    .optional(),
  startingPrice: z.number().positive().optional(),
  bedroomTypes: z.array(bedroomTypeSchema).optional(),
  unitTypes: z.array(unitTypeSpecSchema).optional(),
  address: z.string().min(1).optional(),
  placeId: z.string().min(1).optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  amenities: z.array(z.string()).optional(),
  paymentPlan: paymentPlanSchema,
  seo: seoFieldsSchema.optional(),
  publishing: publishingFieldsSchema,
});
