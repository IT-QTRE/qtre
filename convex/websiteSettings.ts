import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole } from "./lib/permissions";
import { writeAuditLog } from "./lib/auditLog";
import { seoFieldsValidator } from "./lib/seoFields";

export const get = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "websiteSettings", "read");
    return await ctx.db.query("websiteSettings").first();
  },
});

export const upsert = mutation({
  args: {
    siteName: v.string(),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    socialLinks: v.optional(
      v.object({
        facebook: v.optional(v.string()),
        instagram: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        twitter: v.optional(v.string()),
      }),
    ),
    defaultSeo: v.optional(seoFieldsValidator),
  },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "websiteSettings", "update");
    const existing = await ctx.db.query("websiteSettings").first();
    const now = Date.now();

    let id;
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      id = existing._id;
    } else {
      id = await ctx.db.insert("websiteSettings", { ...args, updatedAt: now });
    }

    await writeAuditLog(ctx, {
      actorUserId: actor._id,
      resource: "websiteSettings",
      action: "upsert",
      targetId: id,
    });
    return id;
  },
});
