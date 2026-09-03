import { v } from "convex/values";

export const propertyTypeValidator = v.union(
  v.literal("apartment"),
  v.literal("villa"),
  v.literal("townhouse"),
  v.literal("penthouse"),
  v.literal("duplex"),
  v.literal("hotel_apartment"),
);

export const furnishingValidator = v.union(
  v.literal("unfurnished"),
  v.literal("semi_furnished"),
  v.literal("furnished"),
);

export const rentalPeriodValidator = v.union(v.literal("yearly"), v.literal("monthly"));
