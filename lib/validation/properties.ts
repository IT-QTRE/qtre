import { z } from "zod";
import { localizedTextSchema, publishingFieldsSchema, seoFieldsSchema } from "./shared";
import { propertySharedFactsSchema } from "./propertyShared";

export const propertySchema = propertySharedFactsSchema.extend({
  title: localizedTextSchema,
  description: localizedTextSchema,
  city: localizedTextSchema,
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  listingStatus: z.enum(["for_sale", "for_rent", "sold", "rented", "off_market"]),
  amenities: z.array(z.string()).optional(),
  communityId: z.string().optional(),
  developerId: z.string().optional(),
  projectId: z.string().optional(),
  agentId: z.string().optional(),
  seo: seoFieldsSchema.optional(),
  publishing: publishingFieldsSchema,
});
