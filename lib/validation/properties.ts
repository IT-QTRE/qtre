import { z } from "zod";
import { localizedTextSchema, publishingFieldsSchema, seoFieldsSchema } from "./shared";
import { propertySharedFactsSchema } from "./propertyShared";

export const propertySchema = propertySharedFactsSchema.extend({
  title: localizedTextSchema,
  description: localizedTextSchema,
  city: localizedTextSchema,
  address: z.string().min(1).optional(),
  placeId: z.string().min(1).optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  listingStatus: z.enum(["for_sale", "for_rent", "sold", "rented", "off_market"]),
  propertyType: z.enum(["apartment", "villa", "townhouse", "penthouse", "duplex", "hotel_apartment"]).optional(),
  furnishing: z.enum(["unfurnished", "semi_furnished", "furnished"]).optional(),
  rentalPeriod: z.enum(["yearly", "monthly"]).optional(),
  amenities: z.array(z.string()).optional(),
  communityId: z.string().optional(),
  developerId: z.string().optional(),
  projectId: z.string().optional(),
  agentId: z.string().optional(),
  seo: seoFieldsSchema.optional(),
  publishing: publishingFieldsSchema,
});
