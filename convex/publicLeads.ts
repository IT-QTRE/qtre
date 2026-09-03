import { v } from "convex/values";
import { mutation } from "./_generated/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_FAILURE = "Couldn't send this inquiry.";

function optionalTrim(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export const createListingInquiry = mutation({
  args: {
    propertyId: v.id("properties"),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    message: v.optional(v.string()),
    companyUrl: v.optional(v.string()),
  },
  returns: v.object({ ok: v.literal(true) }),
  handler: async (ctx, args) => {
    if (optionalTrim(args.companyUrl)) {
      return { ok: true as const };
    }

    const name = args.name.trim();
    const email = args.email.trim();
    if (!name || !EMAIL.test(email)) {
      throw new Error(GENERIC_FAILURE);
    }

    const property = await ctx.db.get(args.propertyId);
    if (!property || property.publishing.status !== "published") {
      throw new Error(GENERIC_FAILURE);
    }

    const phone = optionalTrim(args.phone);
    const message = optionalTrim(args.message);

    await ctx.db.insert("leads", {
      name,
      email,
      ...(phone ? { phone } : {}),
      ...(message ? { message } : {}),
      propertyId: args.propertyId,
      status: "new",
      ...(property.agentId ? { assignedAgentId: property.agentId } : {}),
      createdAt: Date.now(),
    });

    return { ok: true as const };
  },
});

export const createProjectInquiry = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    message: v.optional(v.string()),
    companyUrl: v.optional(v.string()),
  },
  returns: v.object({ ok: v.literal(true) }),
  handler: async (ctx, args) => {
    if (optionalTrim(args.companyUrl)) {
      return { ok: true as const };
    }

    const name = args.name.trim();
    const email = args.email.trim();
    if (!name || !EMAIL.test(email)) {
      throw new Error(GENERIC_FAILURE);
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.publishing.status !== "published") {
      throw new Error(GENERIC_FAILURE);
    }

    const phone = optionalTrim(args.phone);
    const message = optionalTrim(args.message);

    await ctx.db.insert("leads", {
      name,
      email,
      ...(phone ? { phone } : {}),
      ...(message ? { message } : {}),
      projectId: args.projectId,
      status: "new",
      createdAt: Date.now(),
    });

    return { ok: true as const };
  },
});
