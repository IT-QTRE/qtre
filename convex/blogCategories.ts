import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole } from "./lib/permissions";
import { localizedTextValidator } from "./lib/localizedText";
import { ensureBlogCategory } from "./lib/blogCategory";

const CATEGORY_LIST_LIMIT = 200;

const categoryRowValidator = v.object({
  _id: v.id("blogCategories"),
  name: localizedTextValidator,
  slug: v.string(),
});

export const list = query({
  args: {},
  returns: v.array(categoryRowValidator),
  handler: async (ctx) => {
    await requireRole(ctx, "blogPosts", "read");
    const rows = await ctx.db.query("blogCategories").take(CATEGORY_LIST_LIMIT);
    return rows
      .map((row) => ({ _id: row._id, name: row.name, slug: row.slug }))
      .sort((a, b) => a.name.en.localeCompare(b.name.en));
  },
});

export const ensure = mutation({
  args: { nameEn: v.string() },
  returns: categoryRowValidator,
  handler: async (ctx, args) => {
    await requireRole(ctx, "blogPosts", "update");
    const id = await ensureBlogCategory(ctx, args.nameEn);
    const row = await ctx.db.get(id);
    if (!row) {
      throw new Error("Topic was not saved");
    }
    return { _id: row._id, name: row.name, slug: row.slug };
  },
});
