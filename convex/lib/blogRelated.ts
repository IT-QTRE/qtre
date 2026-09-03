import { v, type Infer } from "convex/values";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export const RELATED_MAX = 4;

export const relatedItemValidator = v.union(
  v.object({ type: v.literal("property"), id: v.id("properties") }),
  v.object({ type: v.literal("project"), id: v.id("projects") }),
  v.object({ type: v.literal("blogPost"), id: v.id("blogPosts") }),
);

export const relatedValidator = v.array(relatedItemValidator);

export type RelatedItem = Infer<typeof relatedItemValidator>;

export async function assertRelatedValid(
  ctx: MutationCtx,
  related: RelatedItem[] | undefined,
  excludePostId?: Id<"blogPosts">,
) {
  if (!related || related.length === 0) return;
  if (related.length > RELATED_MAX) {
    throw new Error(`Also see can list at most ${RELATED_MAX} items`);
  }
  const seen = new Set<string>();
  for (const item of related) {
    const key = `${item.type}:${item.id}`;
    if (seen.has(key)) {
      throw new Error("Also see cannot list the same record twice");
    }
    seen.add(key);
    if (item.type === "property") {
      const doc = await ctx.db.get(item.id);
      if (!doc) throw new Error("Related property not found");
    } else if (item.type === "project") {
      const doc = await ctx.db.get(item.id);
      if (!doc) throw new Error("Related project not found");
    } else {
      if (excludePostId && item.id === excludePostId) {
        throw new Error("A post cannot list itself in Also see");
      }
      const doc = await ctx.db.get(item.id);
      if (!doc) throw new Error("Related post not found");
    }
  }
}
