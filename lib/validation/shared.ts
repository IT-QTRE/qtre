import { z } from "zod";

export const localizedTextSchema = z.object({
  en: z.string().min(1),
  ar: z.string().min(1).optional(),
  tr: z.string().min(1).optional(),
});

// `.email()`/`.url()` combined with plain `.optional()` only accepts
// `undefined` — a cleared input still submits `""`, which then fails format
// validation even though the field is meant to be optional. These variants
// treat an empty string as "not provided" while still validating format
// whenever a non-empty value is present.
export const optionalEmailSchema = z
  .string()
  .optional()
  .refine((value) => !value || z.email().safeParse(value).success, { message: "Invalid email address" });

export const optionalUrlSchema = z
  .string()
  .optional()
  .refine((value) => !value || z.url().safeParse(value).success, { message: "Invalid URL" });

// A malformed canonical (missing leading slash, a full URL, stray
// whitespace) is one of the few SEO fields here that can actively hurt
// rankings rather than just being incomplete — a wrong canonical tells
// Google to attribute this page's authority elsewhere. Kept intentionally
// permissive on depth/characters (still allows any real route), just
// rejects the shapes that clearly aren't a site-relative path.
export const optionalCanonicalPathSchema = z
  .string()
  .optional()
  .refine((value) => !value || /^\/[a-z0-9-]+(\/[a-z0-9-]+)*\/?$/.test(value), {
    message: "Must be a site-relative path starting with /, e.g. /projects/marina-heights",
  });

export const seoFieldsSchema = z.object({
  seoTitle: localizedTextSchema.optional(),
  seoDescription: localizedTextSchema.optional(),
  canonicalPath: optionalCanonicalPathSchema,
});

export const paymentMilestoneSchema = z.object({
  label: z.string().min(1, "Required"),
  percentage: z.number().min(0, "Must be 0 or more").max(100, "Must be 100 or less"),
  note: z.string().optional(),
});

export const paymentPlanSchema = z.array(paymentMilestoneSchema).optional();

export const publishingFieldsSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, and hyphen-separated"),
  status: z.enum(["draft", "published", "archived"]),
  publishedAt: z.number().optional(),
  updatedAt: z.number(),
});
