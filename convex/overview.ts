import { v } from "convex/values";
import type { QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { ForbiddenError, getCurrentUser, isHiddenFromAdmin } from "./lib/permissions";
import { can, type Resource, type Role } from "./lib/roles";

const TREND_DAYS = 30;
const ACTIVITY_LIMIT = 8;
const ACTIVITY_SCAN = 40;
const DUBAI_OFFSET_MS = 4 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const CATALOG_ACTIVITY_RESOURCES = new Set([
  "properties",
  "projects",
  "leads",
  "blogPosts",
  "developers",
  "agents",
  "communities",
]);

const MAROON = "#6A1017";
const GOLD = "#C8A15B";
const MUTED_SLICE = "#A9A29A";

const LISTING_STATUSES = ["for_sale", "for_rent", "sold", "rented", "off_market"] as const;
const PUBLISHING_STATUSES = ["draft", "published", "archived"] as const;
const LEAD_STATUSES = ["new", "contacted", "qualified", "closed"] as const;

const kpiValidator = v.object({
  label: v.string(),
  value: v.string(),
  hint: v.string(),
});

const trendPointValidator = v.object({
  day: v.string(),
  listings: v.number(),
  leads: v.number(),
});

const namedCountValidator = v.object({
  name: v.string(),
  value: v.number(),
});

const applicationSliceValidator = v.object({
  name: v.string(),
  value: v.number(),
  color: v.string(),
});

const activityValidator = v.object({
  id: v.string(),
  title: v.string(),
  kind: v.string(),
  at: v.number(),
});

type Actor = {
  _id: Id<"users">;
  role: Role;
  disabledResources?: Resource[];
};

function canRead(actor: Actor, resource: Resource) {
  if (!can(actor.role, resource, "read")) return false;
  if (actor.role === "admin" && actor.disabledResources?.includes(resource)) return false;
  return true;
}

function dubaiDayKey(ms: number) {
  return new Date(ms + DUBAI_OFFSET_MS).toISOString().slice(0, 10);
}

function lastDubaiDayKeys(now: number, days: number) {
  const today = dubaiDayKey(now);
  const [year, month, day] = today.split("-").map(Number);
  const cursor = Date.UTC(year, month - 1, day);
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const at = new Date(cursor - i * DAY_MS);
    const yyyy = at.getUTCFullYear();
    const mm = String(at.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(at.getUTCDate()).padStart(2, "0");
    keys.push(`${yyyy}-${mm}-${dd}`);
  }
  return keys;
}

function dayLabel(dayKey: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${dayKey}T00:00:00.000Z`),
  );
}

function windowStartMs(dayKeys: string[]) {
  return Date.parse(`${dayKeys[0]}T00:00:00.000Z`) - DUBAI_OFFSET_MS;
}

async function visibleProperties(ctx: QueryCtx, actor: Actor) {
  if (actor.role === "admin") {
    return await ctx.db
      .query("properties")
      .withIndex("by_created_by", (q) => q.eq("createdBy", actor._id))
      .collect();
  }
  const chunks = await Promise.all(
    LISTING_STATUSES.map((listingStatus) =>
      ctx.db
        .query("properties")
        .withIndex("by_listing_status", (q) => q.eq("listingStatus", listingStatus))
        .collect(),
    ),
  );
  return chunks.flat();
}

async function visibleProjects(ctx: QueryCtx, actor: Actor) {
  if (actor.role === "admin") {
    return await ctx.db
      .query("projects")
      .withIndex("by_created_by", (q) => q.eq("createdBy", actor._id))
      .collect();
  }
  const chunks = await Promise.all(
    PUBLISHING_STATUSES.map((status) =>
      ctx.db
        .query("projects")
        .withIndex("by_publishing_status", (q) => q.eq("publishing.status", status))
        .collect(),
    ),
  );
  return chunks.flat();
}

async function allLeads(ctx: QueryCtx) {
  const chunks = await Promise.all(
    LEAD_STATUSES.map((status) =>
      ctx.db
        .query("leads")
        .withIndex("by_status", (q) => q.eq("status", status))
        .collect(),
    ),
  );
  return chunks.flat();
}

const KIND_BY_RESOURCE: Record<string, string> = {
  properties: "Property",
  projects: "Project",
  leads: "Lead",
  blogPosts: "Post",
  developers: "Developer",
  agents: "Agent",
  communities: "Community",
  websiteSettings: "Settings",
  mediaItems: "Media",
  users: "User",
};

const ACTION_LABEL: Record<string, string> = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  upsert: "Updated",
  update_role: "Changed role for",
  update_resource_access: "Updated access for",
  invite_agent: "Invited",
};

function actionLabel(action: string) {
  if (ACTION_LABEL[action]) return ACTION_LABEL[action];
  const words = action.split("_").filter(Boolean);
  if (words.length === 0) return "Updated";
  return words
    .map((word, index) => (index === 0 ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : word))
    .join(" ");
}

function formatAuditTitle(action: string, kind: string, targetTitle: string | null) {
  const verb = actionLabel(action);
  if (targetTitle) return `${verb} ${targetTitle}`;
  return `${verb} ${kind.toLowerCase()}`;
}

async function resolveAuditTitle(
  ctx: QueryCtx,
  actor: Actor,
  resource: string,
  targetId: string | undefined,
): Promise<string | null> {
  if (!targetId) return null;
  if (resource === "properties") {
    const doc = await ctx.db.get(targetId as Id<"properties">);
    if (!doc || isHiddenFromAdmin(actor, doc.createdBy)) return null;
    return doc.title.en;
  }
  if (resource === "projects") {
    const doc = await ctx.db.get(targetId as Id<"projects">);
    if (!doc || isHiddenFromAdmin(actor, doc.createdBy)) return null;
    return doc.title.en;
  }
  if (resource === "blogPosts") {
    const doc = await ctx.db.get(targetId as Id<"blogPosts">);
    if (!doc || isHiddenFromAdmin(actor, doc.authorUserId)) return null;
    return doc.title.en;
  }
  if (resource === "developers") {
    const doc = await ctx.db.get(targetId as Id<"developers">);
    return doc?.name.en ?? null;
  }
  if (resource === "communities") {
    const doc = await ctx.db.get(targetId as Id<"communities">);
    return doc?.name.en ?? null;
  }
  if (resource === "agents") {
    const doc = await ctx.db.get(targetId as Id<"agents">);
    return doc?.name ?? null;
  }
  if (resource === "leads") {
    const doc = await ctx.db.get(targetId as Id<"leads">);
    return doc?.name ?? null;
  }
  if (resource === "users") {
    const doc = await ctx.db.get(targetId as Id<"users">);
    return doc?.name ?? targetId;
  }
  return null;
}

function summarizeProperties(properties: Doc<"properties">[], since: number, listingCounts: Map<string, number>) {
  let liveListings = 0;
  let drafts = 0;
  let sale = 0;
  let rent = 0;
  for (const property of properties) {
    if (property.publishing.status === "draft") drafts += 1;
    if (property.publishing.status === "published" && property.listingStatus === "for_sale") {
      liveListings += 1;
      sale += 1;
    } else if (property.publishing.status === "published" && property.listingStatus === "for_rent") {
      liveListings += 1;
      rent += 1;
    }
    const publishedAt = property.publishing.publishedAt;
    if (publishedAt !== undefined && publishedAt >= since) {
      const key = dubaiDayKey(publishedAt);
      if (listingCounts.has(key)) listingCounts.set(key, (listingCounts.get(key) ?? 0) + 1);
    }
  }
  return { liveListings, drafts, sale, rent };
}

export const dashboard = query({
  args: {},
  returns: v.object({
    kpis: v.array(kpiValidator),
    trend: v.array(trendPointValidator),
    inventory: v.array(namedCountValidator),
    applications: v.array(applicationSliceValidator),
    activities: v.array(activityValidator),
  }),
  handler: async (ctx) => {
    const actor = await getCurrentUser(ctx);
    if (actor.role !== "admin" && actor.role !== "super_admin") {
      throw new ForbiddenError("Overview is limited to Admin and Super Admin");
    }

    const now = Date.now();
    const dayKeys = lastDubaiDayKeys(now, TREND_DAYS);
    const since = windowStartMs(dayKeys);
    const listingCounts = new Map(dayKeys.map((key) => [key, 0]));
    const leadCounts = new Map(dayKeys.map((key) => [key, 0]));

    let liveListings = 0;
    let drafts = 0;
    let sale = 0;
    let rent = 0;
    let offPlan = 0;
    let openLeadCount = 0;
    let propertyApps = 0;
    let projectApps = 0;
    let generalApps = 0;
    const activities: { id: string; title: string; kind: string; at: number }[] = [];

    if (canRead(actor, "properties")) {
      const summary = summarizeProperties(await visibleProperties(ctx, actor), since, listingCounts);
      liveListings = summary.liveListings;
      drafts += summary.drafts;
      sale = summary.sale;
      rent = summary.rent;
    }

    if (canRead(actor, "projects")) {
      const projects = await visibleProjects(ctx, actor);
      for (const project of projects) {
        if (project.publishing.status === "draft") drafts += 1;
        if (project.publishing.status === "published") offPlan += 1;
      }
    }

    if (canRead(actor, "leads")) {
      const leads = await allLeads(ctx);
      for (const lead of leads) {
        if (lead.status === "new" || lead.status === "contacted") openLeadCount += 1;
        if (lead.propertyId) propertyApps += 1;
        else if (lead.projectId) projectApps += 1;
        else generalApps += 1;
        if (lead.createdAt >= since) {
          const key = dubaiDayKey(lead.createdAt);
          if (leadCounts.has(key)) leadCounts.set(key, (leadCounts.get(key) ?? 0) + 1);
        }
      }
      if (actor.role === "super_admin") {
        for (const lead of leads.toSorted((a, b) => b.createdAt - a.createdAt).slice(0, ACTIVITY_LIMIT)) {
          activities.push({
            id: lead._id,
            title: `Inquiry from ${lead.name}`,
            kind: "Lead",
            at: lead.createdAt,
          });
        }
      }
    }

    if (canRead(actor, "auditLogs")) {
      const logs =
        actor.role === "admin"
          ? await ctx.db
              .query("auditLogs")
              .withIndex("by_actor", (q) => q.eq("actorUserId", actor._id))
              .order("desc")
              .take(ACTIVITY_SCAN)
          : await ctx.db.query("auditLogs").withIndex("by_created_at").order("desc").take(ACTIVITY_SCAN);
      for (const log of logs) {
        if (!CATALOG_ACTIVITY_RESOURCES.has(log.resource)) continue;
        const kind = KIND_BY_RESOURCE[log.resource] ?? "Activity";
        const targetTitle = await resolveAuditTitle(ctx, actor, log.resource, log.targetId);
        activities.push({
          id: log._id,
          title: formatAuditTitle(log.action, kind, targetTitle),
          kind,
          at: log.createdAt,
        });
      }
    }

    const uniqueActivities = [];
    const seen = new Set<string>();
    for (const row of activities.toSorted((a, b) => b.at - a.at)) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      uniqueActivities.push(row);
      if (uniqueActivities.length === ACTIVITY_LIMIT) break;
    }

    return {
      kpis: [
        { label: "Live listings", value: String(liveListings), hint: "Sale + rent published" },
        { label: "Open leads", value: String(openLeadCount), hint: "New and contacted" },
        { label: "Drafts", value: String(drafts), hint: "Waiting to publish" },
        { label: "Off-plan", value: String(offPlan), hint: "Active projects" },
      ],
      trend: dayKeys.map((key) => ({
        day: dayLabel(key),
        listings: listingCounts.get(key) ?? 0,
        leads: leadCounts.get(key) ?? 0,
      })),
      inventory: [
        { name: "Sale", value: sale },
        { name: "Rent", value: rent },
        { name: "Off-plan", value: offPlan },
      ],
      applications: [
        { name: "Property", value: propertyApps, color: MAROON },
        { name: "Off-plan", value: projectApps, color: GOLD },
        { name: "General", value: generalApps, color: MUTED_SLICE },
      ],
      activities: uniqueActivities,
    };
  },
});
