import { v } from "convex/values";

export const completionQuarterValidator = v.union(
  v.literal(1),
  v.literal(2),
  v.literal(3),
  v.literal(4),
);

export const completionDateValidator = v.object({
  quarter: completionQuarterValidator,
  year: v.number(),
});
