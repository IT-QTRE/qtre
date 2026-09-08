import { v } from "convex/values";
import { mutation } from "./_generated/server";
import {
  isServiceDesk,
  serviceDeskSlugValidator,
  serviceGroupValidator,
} from "./lib/serviceDesks";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_FAILURE = "Couldn't send this inquiry.";

function optionalTrim(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    message: v.optional(v.string()),
    group: serviceGroupValidator,
    desk: serviceDeskSlugValidator,
    companyUrl: v.optional(v.string()),
  },
  returns: v.object({ ok: v.literal(true) }),
  handler: async (ctx, args) => {
    if (optionalTrim(args.companyUrl)) {
      return { ok: true as const };
    }

    const name = args.name.trim();
    const email = args.email.trim();
    const phone = args.phone.trim();
    if (!name || !EMAIL.test(email) || !phone || !isServiceDesk(args.group, args.desk)) {
      throw new Error(GENERIC_FAILURE);
    }

    const message = optionalTrim(args.message);

    await ctx.db.insert("serviceLeads", {
      name,
      email,
      phone,
      ...(message ? { message } : {}),
      group: args.group,
      desk: args.desk,
      status: "new",
      createdAt: Date.now(),
    });

    return { ok: true as const };
  },
});
