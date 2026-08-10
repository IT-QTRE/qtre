import { z } from "zod";

export const propertySharedFactsSchema = z.object({
  price: z.number().positive(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().int().nonnegative(),
  areaSqft: z.number().positive(),
  countryCode: z.string().regex(/^[A-Z]{2}$/, "Use an ISO 3166-1 alpha-2 code, e.g. AE"),
});
