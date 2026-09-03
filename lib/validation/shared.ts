import { z } from "zod";

// English is required. ar/tr are optional — but a mounted form still submits
// `ar: ""` / `tr: ""` for blank tabs. `.min(1).optional()` only allows
// `undefined`, so those empty strings were failing as "Required".
export const localizedTextSchema = z.object({
  en: z.string().min(1, "Required"),
  ar: z.string().optional(),
  tr: z.string().optional(),
});

type LocalizedDraft = { en?: string; ar?: string; tr?: string };

function localeHasCopy(value: string | undefined) {
  return Boolean(value?.trim());
}

function localizedHasAnyCopy(value: LocalizedDraft | undefined) {
  if (!value) return false;
  return localeHasCopy(value.en) || localeHasCopy(value.ar) || localeHasCopy(value.tr);
}

export function compactLocalized(value: LocalizedDraft | undefined) {
  if (!localizedHasAnyCopy(value) || !localeHasCopy(value?.en)) return undefined;
  return {
    en: value!.en!.trim(),
    ...(localeHasCopy(value!.ar) ? { ar: value!.ar!.trim() } : {}),
    ...(localeHasCopy(value!.tr) ? { tr: value!.tr!.trim() } : {}),
  };
}

// Optional localized fields (SEO title/description): a collapsed empty input
// still registers `{ en: "" }` or `{ en: undefined }`. `localizedTextSchema`
// requires English, which turned "leave SEO blank" into a hidden validation
// error. Blank = omitted; any translation still needs English.
export const optionalLocalizedTextSchema = z
  .object({
    en: z.string().optional(),
    ar: z.string().optional(),
    tr: z.string().optional(),
  })
  .optional()
  .refine((value) => !localizedHasAnyCopy(value) || localeHasCopy(value?.en), {
    message: "English is required if you add a translation",
    path: ["en"],
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
  seoTitle: optionalLocalizedTextSchema,
  seoDescription: optionalLocalizedTextSchema,
  canonicalPath: optionalCanonicalPathSchema,
});

export type SeoFieldsInput = z.input<typeof seoFieldsSchema>;

export function compactSeoFields(seo: SeoFieldsInput | undefined) {
  if (!seo) return undefined;
  const seoTitle = compactLocalized(seo.seoTitle);
  const seoDescription = compactLocalized(seo.seoDescription);
  const canonicalPath = seo.canonicalPath?.trim() ? seo.canonicalPath.trim() : undefined;
  if (!seoTitle && !seoDescription && !canonicalPath) return undefined;
  return { seoTitle, seoDescription, canonicalPath };
}

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
