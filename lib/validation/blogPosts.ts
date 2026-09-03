import { z } from "zod";
import { localizedTextSchema, publishingFieldsSchema, seoFieldsSchema } from "./shared";

export const RELATED_MAX = 4;

export const relatedItemSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("property"), id: z.string().min(1) }),
  z.object({ type: z.literal("project"), id: z.string().min(1) }),
  z.object({ type: z.literal("blogPost"), id: z.string().min(1) }),
]);

export const relatedSchema = z
  .array(relatedItemSchema)
  .max(RELATED_MAX, `Also see can list at most ${RELATED_MAX} items`)
  .superRefine((items, ctx) => {
    const seen = new Set<string>();
    for (const [index, item] of items.entries()) {
      const key = `${item.type}:${item.id}`;
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          message: "Also see cannot list the same record twice",
          path: [index],
        });
      }
      seen.add(key);
    }
  });

export type RelatedItemInput = z.infer<typeof relatedItemSchema>;

export function compactRelated(
  related: Array<{ type: RelatedItemInput["type"]; id: string }> | undefined,
  excludePostId?: string,
) {
  const items = (related ?? []).filter((item) => item.id.trim().length > 0);
  if (items.length === 0) return undefined;
  if (excludePostId && items.some((item) => item.type === "blogPost" && item.id === excludePostId)) {
    throw new Error("A post cannot list itself in Also see");
  }
  const parsed = relatedSchema.safeParse(items);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Also see is invalid");
  }
  return parsed.data;
}

export const blogPostSchema = z.object({
  title: localizedTextSchema,
  body: localizedTextSchema,
  authorUserId: z.string().min(1),
  seo: seoFieldsSchema.optional(),
  related: relatedSchema.optional(),
  topicName: z.string().max(80).optional(),
  publishing: publishingFieldsSchema,
});

export function compactTopicName(topicName: string | undefined) {
  const trimmed = topicName?.trim() ?? "";
  return trimmed.length > 0 ? trimmed.slice(0, 80) : "";
}
