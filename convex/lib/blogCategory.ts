import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { categorySlugFromName } from "./categorySlug";

export async function ensureBlogCategory(ctx: MutationCtx, nameEn: string): Promise<Id<"blogCategories">> {
  const trimmed = nameEn.trim();
  const slug = categorySlugFromName(trimmed);
  if (!slug) {
    throw new Error("Topic needs a letter or number");
  }
  const existing = await ctx.db
    .query("blogCategories")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (existing) return existing._id;
  return await ctx.db.insert("blogCategories", {
    name: { en: trimmed },
    slug,
  });
}

export async function categoryIdFromTopicName(ctx: MutationCtx, topicName: string | undefined) {
  const trimmed = topicName?.trim() ?? "";
  if (!trimmed) return undefined;
  return await ensureBlogCategory(ctx, trimmed);
}
