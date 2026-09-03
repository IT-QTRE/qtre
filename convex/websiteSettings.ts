import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole } from "./lib/permissions";
import { writeAuditLog } from "./lib/auditLog";
import { seoFieldsValidator } from "./lib/seoFields";
import { safeGhlFormUrl } from "./lib/ghlFormUrl";
import { whatsappHref } from "./lib/whatsappHref";

function resolvedContactFormUrl(value: string | undefined) {
  if (!value?.trim()) return undefined;
  const safe = safeGhlFormUrl(value);
  if (!safe) throw new Error("Paste the form iframe src, not the embed script.");
  return safe;
}

function resolvedWhatsapp(value: string | undefined) {
  if (!value?.trim()) return undefined;
  if (!whatsappHref(value)) throw new Error("Enter a WhatsApp number or wa.me link");
  return value.trim();
}

const publicSettingsValidator = v.union(
  v.null(),
  v.object({
    siteName: v.string(),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    contactWhatsapp: v.optional(v.string()),
    contactFormUrl: v.optional(v.string()),
    socialLinks: v.optional(
      v.object({
        facebook: v.optional(v.string()),
        instagram: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        twitter: v.optional(v.string()),
      }),
    ),
  }),
);

export const get = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "websiteSettings", "read");
    return await ctx.db.query("websiteSettings").first();
  },
});

export const publicGet = query({
  args: {},
  returns: publicSettingsValidator,
  handler: async (ctx) => {
    const settings = await ctx.db.query("websiteSettings").first();
    if (!settings) return null;
    return {
      siteName: settings.siteName,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      contactWhatsapp: settings.contactWhatsapp && whatsappHref(settings.contactWhatsapp) ? settings.contactWhatsapp : undefined,
      contactFormUrl: safeGhlFormUrl(settings.contactFormUrl) ?? undefined,
      socialLinks: settings.socialLinks,
    };
  },
});

export const upsert = mutation({
  args: {
    siteName: v.string(),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    contactWhatsapp: v.optional(v.string()),
    contactFormUrl: v.optional(v.string()),
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
    const { contactFormUrl: rawFormUrl, contactWhatsapp: rawWhatsapp, ...rest } = args;
    const contactFormUrl = resolvedContactFormUrl(rawFormUrl);
    const contactWhatsapp = resolvedWhatsapp(rawWhatsapp);

    let id;
    if (existing) {
      await ctx.db.replace(existing._id, {
        siteName: rest.siteName,
        updatedAt: now,
        ...(rest.contactEmail ? { contactEmail: rest.contactEmail } : {}),
        ...(rest.contactPhone ? { contactPhone: rest.contactPhone } : {}),
        ...(contactWhatsapp ? { contactWhatsapp } : {}),
        ...(contactFormUrl ? { contactFormUrl } : {}),
        ...(rest.socialLinks ? { socialLinks: rest.socialLinks } : {}),
        ...(rest.defaultSeo ? { defaultSeo: rest.defaultSeo } : {}),
      });
      id = existing._id;
    } else {
      id = await ctx.db.insert("websiteSettings", {
        ...rest,
        updatedAt: now,
        ...(contactWhatsapp ? { contactWhatsapp } : {}),
        ...(contactFormUrl ? { contactFormUrl } : {}),
      });
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
