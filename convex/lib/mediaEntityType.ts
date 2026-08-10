import { v, type Infer } from "convex/values";

export const mediaEntityTypeValidator = v.union(
  v.literal("property"),
  v.literal("project"),
  v.literal("developer"),
  v.literal("agent"),
  v.literal("community"),
  v.literal("blogPost"),
  v.literal("propertySubmission"),
);

export type MediaEntityType = Infer<typeof mediaEntityTypeValidator>;
