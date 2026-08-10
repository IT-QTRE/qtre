import { z } from "zod";

export const localizedTextSchema = z.object({
  en: z.string().min(1),
  ar: z.string().min(1).optional(),
  tr: z.string().min(1).optional(),
});

export const seoFieldsSchema = z.object({
  seoTitle: localizedTextSchema.optional(),
  seoDescription: localizedTextSchema.optional(),
  canonicalPath: z.string().optional(),
});

export const publishingFieldsSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, and hyphen-separated"),
  status: z.enum(["draft", "published", "archived"]),
  publishedAt: z.number().optional(),
  updatedAt: z.number(),
});
