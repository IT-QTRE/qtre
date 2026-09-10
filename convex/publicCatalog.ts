import { v } from "convex/values";
import type { QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { localizedTextValidator } from "./lib/localizedText";
import { seoFieldsValidator } from "./lib/seoFields";
import { furnishingValidator, propertyTypeValidator, rentalPeriodValidator } from "./lib/propertyAttributes";
import { normalizeBedroomTypes, resolvedAreaSqm } from "./lib/bedroomTypes";
import { completionDateValidator } from "./lib/completionDate";
import { sortPublishedCatalog } from "./lib/catalogRank";

const activeListingStatusValidator = v.union(v.literal("for_sale"), v.literal("for_rent"));
const listingStatusValidator = v.union(
  v.literal("for_sale"),
  v.literal("for_rent"),
  v.literal("sold"),
  v.literal("rented"),
  v.literal("off_market"),
);

const propertyCardValidator = v.object({
  _id: v.id("properties"),
  slug: v.string(),
  title: localizedTextValidator,
  city: localizedTextValidator,
  price: v.number(),
  bedrooms: v.number(),
  bathrooms: v.number(),
  areaSqft: v.number(),
  listingStatus: listingStatusValidator,
  communityName: v.union(localizedTextValidator, v.null()),
  imageUrl: v.union(v.string(), v.null()),
  imageAlt: v.union(localizedTextValidator, v.null()),
  description: localizedTextValidator,
});

const constructionStatusValidator = v.union(
  v.literal("upcoming"),
  v.literal("under_construction"),
  v.literal("completed"),
);

const projectCardValidator = v.object({
  _id: v.id("projects"),
  slug: v.string(),
  title: localizedTextValidator,
  city: localizedTextValidator,
  startingPrice: v.union(v.number(), v.null()),
  constructionStatus: constructionStatusValidator,
  completionDate: v.union(v.null(), completionDateValidator),
  communityName: v.union(localizedTextValidator, v.null()),
  developerName: v.union(localizedTextValidator, v.null()),
  developerSlug: v.union(v.string(), v.null()),
  imageUrl: v.union(v.string(), v.null()),
  imageAlt: v.union(localizedTextValidator, v.null()),
  description: localizedTextValidator,
  bedroomTypes: v.array(v.number()),
});

const propertyDetailValidator = v.union(
  v.null(),
  propertyCardValidator.extend({
    address: v.union(v.string(), v.null()),
    placeId: v.union(v.string(), v.null()),
    coordinates: v.union(v.object({ lat: v.number(), lng: v.number() }), v.null()),
    images: v.array(
      v.object({
        url: v.string(),
        alt: v.union(localizedTextValidator, v.null()),
      }),
    ),
    amenities: v.array(v.string()),
    agent: v.union(
      v.null(),
      v.object({
        name: v.string(),
        position: v.union(v.string(), v.null()),
        slug: v.string(),
        imageUrl: v.union(v.string(), v.null()),
        imageAlt: v.union(localizedTextValidator, v.null()),
      }),
    ),
    project: v.union(
      v.null(),
      v.object({
        title: localizedTextValidator,
        slug: v.string(),
      }),
    ),
    developerName: v.union(localizedTextValidator, v.null()),
    developerSlug: v.union(v.string(), v.null()),
    propertyType: v.union(propertyTypeValidator, v.null()),
    furnishing: v.union(furnishingValidator, v.null()),
    rentalPeriod: v.union(rentalPeriodValidator, v.null()),
  }),
);

const unitTypePublicValidator = v.object({
  bedrooms: v.number(),
  minAreaSqm: v.union(v.number(), v.null()),
  maxAreaSqm: v.union(v.number(), v.null()),
  minPrice: v.union(v.number(), v.null()),
  maxPrice: v.union(v.number(), v.null()),
});

const projectDetailValidator = v.union(
  v.null(),
  projectCardValidator.extend({
    address: v.union(v.string(), v.null()),
    placeId: v.union(v.string(), v.null()),
    coordinates: v.union(v.object({ lat: v.number(), lng: v.number() }), v.null()),
    images: v.array(
      v.object({
        url: v.string(),
        alt: v.union(localizedTextValidator, v.null()),
      }),
    ),
    amenities: v.array(v.string()),
    paymentPlan: v.array(
      v.object({
        label: v.string(),
        percentage: v.number(),
        note: v.union(v.string(), v.null()),
      }),
    ),
    unitTypes: v.array(unitTypePublicValidator),
    units: v.array(propertyCardValidator),
  }),
);

function localizedHaystack(text: { en: string; ar?: string; tr?: string }) {
  return [text.en, text.ar, text.tr].filter(Boolean).join(" ").toLowerCase();
}

function matchesCount(value: number, wanted: number | undefined) {
  if (wanted == null) return true;
  if (wanted >= 4) return value >= 4;
  return value === wanted;
}

function matchesBedroomMix(types: number[], wanted: number | undefined) {
  if (wanted == null) return true;
  if (types.length === 0) return false;
  return types.some((bedrooms) => matchesCount(bedrooms, wanted));
}

function projectBedroomMix(project: Doc<"projects">) {
  const fromProject = normalizeBedroomTypes(project.bedroomTypes);
  if (fromProject.length > 0) return fromProject;
  return normalizeBedroomTypes((project.unitTypes ?? []).map((spec) => spec.bedrooms));
}

function matchesRange(value: number, min: number | undefined, max: number | undefined) {
  if (min != null && value < min) return false;
  if (max != null && value > max) return false;
  return true;
}

function matchesOptionalRange(value: number | undefined, min: number | undefined, max: number | undefined) {
  if (min == null && max == null) return true;
  if (value == null) return false;
  return matchesRange(value, min, max);
}

function matchesTitle(queryText: string | undefined, title: { en: string; ar?: string; tr?: string }) {
  const needle = queryText?.trim().toLowerCase();
  if (!needle) return true;
  return localizedHaystack(title).includes(needle);
}

function matchesLocation(
  queryText: string | undefined,
  title: { en: string; ar?: string; tr?: string },
  city: { en: string; ar?: string; tr?: string },
  communityName: { en: string; ar?: string; tr?: string } | null,
) {
  const needle = queryText?.trim().toLowerCase();
  if (!needle) return true;
  const hay = [
    localizedHaystack(title),
    localizedHaystack(city),
    communityName ? localizedHaystack(communityName) : "",
  ].join(" ");
  return hay.includes(needle);
}

async function communityNameIfPublished(ctx: QueryCtx, communityId: Id<"communities"> | undefined) {
  if (!communityId) return null;
  const community = await ctx.db.get(communityId);
  if (!community || community.publishing.status !== "published") return null;
  return community.name;
}

async function primaryImage(
  ctx: QueryCtx,
  entityType: "property" | "project" | "blogPost" | "community" | "developer" | "agent",
  entityId: string,
) {
  const item = await ctx.db
    .query("mediaItems")
    .withIndex("by_entity", (q) => q.eq("entityType", entityType).eq("entityId", entityId))
    .first();
  if (!item || !item.mimeType.startsWith("image/")) return { url: null, alt: null };
  return { url: item.url, alt: item.alt ?? null };
}

async function entityImages(
  ctx: QueryCtx,
  entityType: "property" | "project" | "blogPost" | "community" | "developer" | "agent",
  entityId: string,
) {
  const items = await ctx.db
    .query("mediaItems")
    .withIndex("by_entity", (q) => q.eq("entityType", entityType).eq("entityId", entityId))
    .collect();
  return items
    .filter((item) => item.mimeType.startsWith("image/"))
    .map((item) => ({ url: item.url, alt: item.alt ?? null }));
}

async function publishedAgentCard(ctx: QueryCtx, agentId: Id<"agents"> | undefined) {
  if (!agentId) return null;
  const agent = await ctx.db.get(agentId);
  if (!agent || agent.publishing.status !== "published") return null;
  const image = await primaryImage(ctx, "agent", agent._id);
  return { name: agent.name, position: agent.position ?? null, slug: agent.publishing.slug, imageUrl: image.url, imageAlt: image.alt };
}

async function publishedProjectRef(ctx: QueryCtx, projectId: Id<"projects"> | undefined) {
  if (!projectId) return null;
  const project = await ctx.db.get(projectId);
  if (!project || project.publishing.status !== "published") return null;
  return { title: project.title, slug: project.publishing.slug };
}

async function publishedDeveloperRef(ctx: QueryCtx, developerId: Id<"developers"> | undefined) {
  if (!developerId) return null;
  const developer = await ctx.db.get(developerId);
  if (!developer || developer.publishing.status !== "published") return null;
  return { name: developer.name, slug: developer.publishing.slug };
}

async function toPropertyCard(ctx: QueryCtx, property: Doc<"properties">) {
  const [communityName, image] = await Promise.all([
    communityNameIfPublished(ctx, property.communityId),
    primaryImage(ctx, "property", property._id),
  ]);
  return {
    _id: property._id,
    slug: property.publishing.slug,
    title: property.title,
    city: property.city,
    price: property.price,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    areaSqft: property.areaSqft,
    listingStatus: property.listingStatus,
    communityName,
    imageUrl: image.url,
    imageAlt: image.alt,
    description: property.description,
  };
}

const LINKED_UNITS_LIMIT = 48;
const DIRECTORY_SCAN_LIMIT = 200;

async function publishedPropertiesForProject(ctx: QueryCtx, projectId: Id<"projects">) {
  const linked = await ctx.db
    .query("properties")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .take(LINKED_UNITS_LIMIT);
  return linked.filter((property) => property.publishing.status === "published");
}

async function publishedProjectsForDeveloper(ctx: QueryCtx, developerId: Id<"developers">) {
  const linked = await ctx.db
    .query("projects")
    .withIndex("by_developer", (q) => q.eq("developerId", developerId))
    .take(LINKED_UNITS_LIMIT);
  return linked.filter((project) => project.publishing.status === "published");
}

async function publishedPropertiesForDeveloper(ctx: QueryCtx, developerId: Id<"developers">) {
  const linked = await ctx.db
    .query("properties")
    .withIndex("by_developer", (q) => q.eq("developerId", developerId))
    .take(LINKED_UNITS_LIMIT);
  return linked.filter((property) => property.publishing.status === "published");
}

async function publishedProjectsForCommunity(ctx: QueryCtx, communityId: Id<"communities">) {
  const linked = await ctx.db
    .query("projects")
    .withIndex("by_community", (q) => q.eq("communityId", communityId))
    .take(LINKED_UNITS_LIMIT);
  return linked.filter((project) => project.publishing.status === "published");
}

async function publishedPropertiesForCommunity(ctx: QueryCtx, communityId: Id<"communities">) {
  const linked = await ctx.db
    .query("properties")
    .withIndex("by_community", (q) => q.eq("communityId", communityId))
    .take(LINKED_UNITS_LIMIT);
  return linked.filter((property) => property.publishing.status === "published");
}

const PUBLIC_COMMUNITY_COUNTRY = "AE";

async function publishedCommunityBySlug(ctx: QueryCtx, slug: string) {
  const inAe = await ctx.db
    .query("communities")
    .withIndex("by_country_and_slug", (q) => q.eq("countryCode", PUBLIC_COMMUNITY_COUNTRY).eq("publishing.slug", slug))
    .unique();
  if (inAe?.publishing.status === "published") return inAe;

  const published = await ctx.db
    .query("communities")
    .withIndex("by_publishing_status", (q) => q.eq("publishing.status", "published"))
    .take(DIRECTORY_SCAN_LIMIT);
  const matches = published.filter((community) => community.publishing.slug === slug);
  return matches.length === 1 ? matches[0] : null;
}

async function publishedPropertiesForAgent(ctx: QueryCtx, agentId: Id<"agents">) {
  const linked = await ctx.db
    .query("properties")
    .withIndex("by_agent", (q) => q.eq("agentId", agentId))
    .take(LINKED_UNITS_LIMIT);
  return linked.filter((property) => property.publishing.status === "published");
}

function unitTypesForProject(project: Doc<"projects">) {
  const specs = project.unitTypes;
  if (specs && specs.length > 0) {
    return specs.map((spec) => {
      const area = resolvedAreaSqm(spec);
      return {
        bedrooms: spec.bedrooms,
        minAreaSqm: area.minAreaSqm,
        maxAreaSqm: area.maxAreaSqm,
        minPrice: spec.minPrice ?? null,
        maxPrice: spec.maxPrice ?? null,
      };
    });
  }
  return normalizeBedroomTypes(project.bedroomTypes).map((bedrooms) => ({
    bedrooms,
    minAreaSqm: null,
    maxAreaSqm: null,
    minPrice: null,
    maxPrice: null,
  }));
}

function bedroomTypesForProject(project: Doc<"projects">, publishedUnits: Doc<"properties">[]) {
  const fromProject = normalizeBedroomTypes(project.bedroomTypes);
  if (fromProject.length > 0) return fromProject;
  return normalizeBedroomTypes(publishedUnits.map((unit) => unit.bedrooms));
}

async function toProjectCard(
  ctx: QueryCtx,
  project: Doc<"projects">,
  publishedUnits?: Doc<"properties">[],
) {
  const units = publishedUnits ?? (await publishedPropertiesForProject(ctx, project._id));
  const [communityName, image, developer] = await Promise.all([
    communityNameIfPublished(ctx, project.communityId),
    primaryImage(ctx, "project", project._id),
    publishedDeveloperRef(ctx, project.developerId),
  ]);
  return {
    _id: project._id,
    slug: project.publishing.slug,
    title: project.title,
    city: project.city,
    startingPrice: project.startingPrice ?? null,
    constructionStatus: project.status,
    completionDate: project.completionDate ?? null,
    communityName,
    developerName: developer?.name ?? null,
    developerSlug: developer?.slug ?? null,
    imageUrl: image.url,
    imageAlt: image.alt,
    description: project.description,
    bedroomTypes: bedroomTypesForProject(project, units),
  };
}

async function publishedByListingStatus(ctx: QueryCtx, listingStatus: "for_sale" | "for_rent", take: number) {
  return await ctx.db
    .query("properties")
    .withIndex("by_publishing_status_and_listingStatus", (q) =>
      q.eq("publishing.status", "published").eq("listingStatus", listingStatus),
    )
    .order("desc")
    .take(take);
}

const SUGGESTED_PROPERTIES_LIMIT = 3;
const SUGGESTED_SCAN_LIMIT = 200;

function isActiveListingStatus(
  listingStatus: Doc<"properties">["listingStatus"],
): listingStatus is "for_sale" | "for_rent" {
  return listingStatus === "for_sale" || listingStatus === "for_rent";
}

function sameCity(a: Doc<"properties">["city"], b: Doc<"properties">["city"]) {
  return a.en.trim().toLowerCase() === b.en.trim().toLowerCase();
}

function suggestionScore(source: Doc<"properties">, candidate: Doc<"properties">) {
  let score = 0;
  if (source.communityId && candidate.communityId === source.communityId) score += 8;
  if (source.projectId && candidate.projectId === source.projectId) score += 4;
  if (sameCity(source.city, candidate.city)) score += 2;
  if (candidate.bedrooms === source.bedrooms) score += 1;
  return score;
}

function compareSuggested(source: Doc<"properties">, a: Doc<"properties">, b: Doc<"properties">) {
  const byScore = suggestionScore(source, b) - suggestionScore(source, a);
  if (byScore !== 0) return byScore;
  const byPrice = Math.abs(a.price - source.price) - Math.abs(b.price - source.price);
  if (byPrice !== 0) return byPrice;
  return (b.publishing.publishedAt ?? b._creationTime) - (a.publishing.publishedAt ?? a._creationTime);
}

function takeSuggested(
  source: Doc<"properties">,
  rows: Doc<"properties">[],
  picked: Doc<"properties">[],
  seen: Set<Id<"properties">>,
) {
  const eligible = rows
    .filter(
      (row) =>
        row.publishing.status === "published" &&
        row.listingStatus === source.listingStatus &&
        !seen.has(row._id),
    )
    .sort((a, b) => compareSuggested(source, a, b));
  for (const row of eligible) {
    if (picked.length >= SUGGESTED_PROPERTIES_LIMIT) break;
    seen.add(row._id);
    picked.push(row);
  }
}

async function suggestedPropertiesFor(ctx: QueryCtx, property: Doc<"properties">) {
  if (!isActiveListingStatus(property.listingStatus)) return [];

  const picked: Doc<"properties">[] = [];
  const seen = new Set<Id<"properties">>([property._id]);

  const communityId = property.communityId;
  if (communityId) {
    const linked = await ctx.db
      .query("properties")
      .withIndex("by_community", (q) => q.eq("communityId", communityId))
      .take(LINKED_UNITS_LIMIT);
    takeSuggested(property, linked, picked, seen);
  }
  const projectId = property.projectId;
  if (picked.length < SUGGESTED_PROPERTIES_LIMIT && projectId) {
    const linked = await ctx.db
      .query("properties")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .take(LINKED_UNITS_LIMIT);
    takeSuggested(property, linked, picked, seen);
  }
  if (picked.length < SUGGESTED_PROPERTIES_LIMIT) {
    const published = await publishedByListingStatus(ctx, property.listingStatus, SUGGESTED_SCAN_LIMIT);
    takeSuggested(
      property,
      published.filter((row) => sameCity(row.city, property.city)),
      picked,
      seen,
    );
  }

  return await Promise.all(picked.map((row) => toPropertyCard(ctx, row)));
}

const FEATURED_LIMIT = 6;

export const featuredProperties = query({
  args: {},
  returns: v.array(propertyCardValidator),
  handler: async (ctx) => {
    const [forSale, forRent] = await Promise.all([
      publishedByListingStatus(ctx, "for_sale", 6),
      publishedByListingStatus(ctx, "for_rent", 6),
    ]);
    const merged = [...forSale, ...forRent]
      .sort((a, b) => (b.publishing.publishedAt ?? b._creationTime) - (a.publishing.publishedAt ?? a._creationTime))
      .slice(0, FEATURED_LIMIT);
    return await Promise.all(merged.map((property) => toPropertyCard(ctx, property)));
  },
});

export const featuredProjects = query({
  args: {},
  returns: v.array(projectCardValidator),
  handler: async (ctx) => {
    const published = await ctx.db
      .query("projects")
      .withIndex("by_publishing_status", (q) => q.eq("publishing.status", "published"))
      .order("desc")
      .take(FEATURED_LIMIT);
    return await Promise.all(published.map((project) => toProjectCard(ctx, project)));
  },
});

const communityCardValidator = v.object({
  _id: v.id("communities"),
  slug: v.string(),
  countryCode: v.string(),
  name: localizedTextValidator,
  city: localizedTextValidator,
  imageUrl: v.union(v.string(), v.null()),
  imageAlt: v.union(localizedTextValidator, v.null()),
});

const communityDirectoryCardValidator = communityCardValidator.extend({
  description: v.union(localizedTextValidator, v.null()),
});

async function toCommunityCard(ctx: QueryCtx, community: Doc<"communities">) {
  const image = await primaryImage(ctx, "community", community._id);
  return {
    _id: community._id,
    slug: community.publishing.slug,
    countryCode: community.countryCode,
    name: community.name,
    city: community.city,
    imageUrl: image.url,
    imageAlt: image.alt,
  };
}

const FEATURED_COMMUNITIES_LIMIT = 5;
const FEATURED_DEVELOPERS_LIMIT = 8;
const FEATURED_BLOG_POSTS_LIMIT = 5;

function communitiesByCountry(published: Doc<"communities">[]) {
  const groups = new Map<string, Doc<"communities">[]>();
  for (const community of published) {
    const list = groups.get(community.countryCode) ?? [];
    list.push(community);
    groups.set(community.countryCode, list);
  }
  return groups;
}

export const featuredCommunities = query({
  args: {},
  returns: v.array(communityCardValidator),
  handler: async (ctx) => {
    const published = await ctx.db
      .query("communities")
      .withIndex("by_publishing_status", (q) => q.eq("publishing.status", "published"))
      .take(DIRECTORY_SCAN_LIMIT);
    const cards: Array<Awaited<ReturnType<typeof toCommunityCard>>> = [];
    for (const communities of communitiesByCountry(published).values()) {
      const ranked = sortPublishedCatalog(communities, "newest");
      let taken = 0;
      for (const community of ranked) {
        const card = await toCommunityCard(ctx, community);
        if (!card.imageUrl) continue;
        cards.push(card);
        taken += 1;
        if (taken >= FEATURED_COMMUNITIES_LIMIT) break;
      }
    }
    return cards;
  },
});

export const listPublishedCommunities = query({
  args: {},
  returns: v.array(communityDirectoryCardValidator),
  handler: async (ctx) => {
    const published = await ctx.db
      .query("communities")
      .withIndex("by_publishing_status", (q) => q.eq("publishing.status", "published"))
      .take(DIRECTORY_SCAN_LIMIT);
    const sorted = sortPublishedCatalog(published, "name");
    return await Promise.all(
      sorted.map(async (community) => ({
        ...(await toCommunityCard(ctx, community)),
        description: community.description ?? null,
      })),
    );
  },
});

const searchPlaceKindValidator = v.union(v.literal("for_sale"), v.literal("for_rent"), v.literal("offplan"));
const searchPlaceValidator = v.object({
  _id: v.id("communities"),
  name: localizedTextValidator,
  city: localizedTextValidator,
});

async function communityIdsWithPublishedStock(ctx: QueryCtx, kind: "for_sale" | "for_rent" | "offplan") {
  const ids = new Set<Id<"communities">>();
  if (kind === "offplan") {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_publishing_status", (q) => q.eq("publishing.status", "published"))
      .take(DIRECTORY_SCAN_LIMIT);
    for (const project of projects) {
      if (project.communityId) ids.add(project.communityId);
    }
    return ids;
  }
  const properties = await ctx.db
    .query("properties")
    .withIndex("by_publishing_status_and_listingStatus", (q) =>
      q.eq("publishing.status", "published").eq("listingStatus", kind),
    )
    .take(DIRECTORY_SCAN_LIMIT);
  for (const property of properties) {
    if (property.communityId) ids.add(property.communityId);
  }
  return ids;
}

export const listSearchPlaces = query({
  args: { kind: searchPlaceKindValidator },
  returns: v.array(searchPlaceValidator),
  handler: async (ctx, args) => {
    const stock = await communityIdsWithPublishedStock(ctx, args.kind);
    if (stock.size === 0) return [];
    const published = await ctx.db
      .query("communities")
      .withIndex("by_publishing_status", (q) => q.eq("publishing.status", "published"))
      .take(DIRECTORY_SCAN_LIMIT);
    const withStock = published.filter((community) => stock.has(community._id));
    return sortPublishedCatalog(withStock, "name").map((community) => ({
      _id: community._id,
      name: community.name,
      city: community.city,
    }));
  },
});

const communityDetailValidator = v.union(
  v.null(),
  communityDirectoryCardValidator.extend({
    seo: v.union(seoFieldsValidator, v.null()),
    images: v.array(
      v.object({
        url: v.string(),
        alt: v.union(localizedTextValidator, v.null()),
      }),
    ),
    properties: v.array(propertyCardValidator),
    projects: v.array(projectCardValidator),
  }),
);

export const getPublishedCommunityBySlug = query({
  args: { slug: v.string() },
  returns: communityDetailValidator,
  handler: async (ctx, args) => {
    const community = await publishedCommunityBySlug(ctx, args.slug);
    if (!community) return null;
    const [card, images, linkedProjects, linkedProperties] = await Promise.all([
      toCommunityCard(ctx, community),
      entityImages(ctx, "community", community._id),
      publishedProjectsForCommunity(ctx, community._id),
      publishedPropertiesForCommunity(ctx, community._id),
    ]);
    const [projects, properties] = await Promise.all([
      Promise.all(linkedProjects.map((project) => toProjectCard(ctx, project))),
      Promise.all(linkedProperties.map((property) => toPropertyCard(ctx, property))),
    ]);
    return {
      ...card,
      description: community.description ?? null,
      seo: community.seo ?? null,
      images,
      projects,
      properties,
    };
  },
});

const blogCategoryPublicValidator = v.object({
  slug: v.string(),
  name: localizedTextValidator,
});

const blogCardBaseValidator = v.object({
  _id: v.id("blogPosts"),
  slug: v.string(),
  title: localizedTextValidator,
  publishedAt: v.number(),
  imageUrl: v.union(v.string(), v.null()),
  imageAlt: v.union(localizedTextValidator, v.null()),
});

const blogCardValidator = blogCardBaseValidator.extend({
  category: v.union(blogCategoryPublicValidator, v.null()),
});

async function resolveBlogCategory(ctx: QueryCtx, categoryId: Id<"blogCategories"> | undefined) {
  if (!categoryId) return null;
  const row = await ctx.db.get(categoryId);
  if (!row) return null;
  return { slug: row.slug, name: row.name };
}

async function toBlogCardBase(ctx: QueryCtx, post: Doc<"blogPosts">) {
  const image = await primaryImage(ctx, "blogPost", post._id);
  return {
    _id: post._id,
    slug: post.publishing.slug,
    title: post.title,
    publishedAt: post.publishing.publishedAt ?? post._creationTime,
    imageUrl: image.url,
    imageAlt: image.alt,
  };
}

async function toBlogCard(ctx: QueryCtx, post: Doc<"blogPosts">) {
  const [card, category] = await Promise.all([
    toBlogCardBase(ctx, post),
    resolveBlogCategory(ctx, post.categoryId),
  ]);
  return { ...card, category };
}

const relatedPublicItemValidator = v.union(
  v.object({
    type: v.literal("property"),
    slug: v.string(),
    title: localizedTextValidator,
    listingStatus: listingStatusValidator,
    price: v.number(),
    city: localizedTextValidator,
    countryCode: v.string(),
  }),
  v.object({
    type: v.literal("project"),
    slug: v.string(),
    title: localizedTextValidator,
    city: localizedTextValidator,
    startingPrice: v.union(v.number(), v.null()),
  }),
  v.object({
    type: v.literal("blogPost"),
    slug: v.string(),
    title: localizedTextValidator,
    publishedAt: v.number(),
  }),
);

async function resolvePublishedRelated(ctx: QueryCtx, related: Doc<"blogPosts">["related"]) {
  if (!related || related.length === 0) return [];
  const rows: Array<
    | {
        type: "property";
        slug: string;
        title: Doc<"properties">["title"];
        listingStatus: Doc<"properties">["listingStatus"];
        price: number;
        city: Doc<"properties">["city"];
        countryCode: string;
      }
    | {
        type: "project";
        slug: string;
        title: Doc<"projects">["title"];
        city: Doc<"projects">["city"];
        startingPrice: number | null;
      }
    | {
        type: "blogPost";
        slug: string;
        title: Doc<"blogPosts">["title"];
        publishedAt: number;
      }
  > = [];
  for (const item of related) {
    if (item.type === "property") {
      const doc = await ctx.db.get(item.id);
      if (!doc || doc.publishing.status !== "published") continue;
      rows.push({
        type: "property",
        slug: doc.publishing.slug,
        title: doc.title,
        listingStatus: doc.listingStatus,
        price: doc.price,
        city: doc.city,
        countryCode: doc.countryCode,
      });
    } else if (item.type === "project") {
      const doc = await ctx.db.get(item.id);
      if (!doc || doc.publishing.status !== "published") continue;
      rows.push({
        type: "project",
        slug: doc.publishing.slug,
        title: doc.title,
        city: doc.city,
        startingPrice: doc.startingPrice ?? null,
      });
    } else {
      const doc = await ctx.db.get(item.id);
      if (!doc || doc.publishing.status !== "published") continue;
      rows.push({
        type: "blogPost",
        slug: doc.publishing.slug,
        title: doc.title,
        publishedAt: doc.publishing.publishedAt ?? doc._creationTime,
      });
    }
  }
  return rows;
}

const developerCardValidator = v.object({
  _id: v.id("developers"),
  slug: v.string(),
  name: localizedTextValidator,
  imageUrl: v.union(v.string(), v.null()),
  imageAlt: v.union(localizedTextValidator, v.null()),
});

async function toDeveloperCard(ctx: QueryCtx, developer: Doc<"developers">) {
  const image = await primaryImage(ctx, "developer", developer._id);
  return {
    _id: developer._id,
    slug: developer.publishing.slug,
    name: developer.name,
    imageUrl: image.url,
    imageAlt: image.alt,
  };
}

export const featuredDevelopers = query({
  args: {},
  returns: v.array(developerCardValidator),
  handler: async (ctx) => {
    const published = await ctx.db
      .query("developers")
      .withIndex("by_publishing_status", (q) => q.eq("publishing.status", "published"))
      .take(DIRECTORY_SCAN_LIMIT);
    const ranked = sortPublishedCatalog(published, "newest").slice(0, FEATURED_DEVELOPERS_LIMIT);
    return await Promise.all(ranked.map((developer) => toDeveloperCard(ctx, developer)));
  },
});

export const featuredBlogPosts = query({
  args: {},
  returns: v.array(blogCardBaseValidator),
  handler: async (ctx) => {
    const published = await ctx.db
      .query("blogPosts")
      .withIndex("by_publishing_status", (q) => q.eq("publishing.status", "published"))
      .order("desc")
      .take(FEATURED_BLOG_POSTS_LIMIT);
    return await Promise.all(published.map((post) => toBlogCardBase(ctx, post)));
  },
});

export const listPublishedBlogPosts = query({
  args: {
    q: v.optional(v.string()),
    topic: v.optional(v.string()),
  },
  returns: v.array(blogCardValidator),
  handler: async (ctx, args) => {
    const topicSlug = args.topic?.trim();
    let published: Doc<"blogPosts">[];
    if (topicSlug) {
      const category = await ctx.db
        .query("blogCategories")
        .withIndex("by_slug", (q) => q.eq("slug", topicSlug))
        .unique();
      if (!category) return [];
      const inTopic = await ctx.db
        .query("blogPosts")
        .withIndex("by_category", (q) => q.eq("categoryId", category._id))
        .take(DIRECTORY_SCAN_LIMIT);
      published = inTopic.filter((post) => post.publishing.status === "published");
    } else {
      published = await ctx.db
        .query("blogPosts")
        .withIndex("by_publishing_status", (q) => q.eq("publishing.status", "published"))
        .take(DIRECTORY_SCAN_LIMIT);
    }
    const matched = published.filter((post) => matchesTitle(args.q, post.title));
    const cards = await Promise.all(matched.map((post) => toBlogCard(ctx, post)));
    return [...cards].sort((a, b) => b.publishedAt - a.publishedAt);
  },
});

export const listPublishedBlogTopics = query({
  args: {},
  returns: v.array(blogCategoryPublicValidator),
  handler: async (ctx) => {
    const published = await ctx.db
      .query("blogPosts")
      .withIndex("by_publishing_status", (q) => q.eq("publishing.status", "published"))
      .take(DIRECTORY_SCAN_LIMIT);
    const ids = [...new Set(published.flatMap((post) => (post.categoryId ? [post.categoryId] : [])))];
    const rows = await Promise.all(ids.map((id) => ctx.db.get(id)));
    return rows
      .flatMap((row) => (row ? [{ slug: row.slug, name: row.name }] : []))
      .sort((a, b) => a.name.en.localeCompare(b.name.en));
  },
});

const blogDetailValidator = v.union(
  v.null(),
  blogCardValidator.extend({
    body: localizedTextValidator,
    seoTitle: v.union(localizedTextValidator, v.null()),
    seoDescription: v.union(localizedTextValidator, v.null()),
    related: v.array(relatedPublicItemValidator),
  }),
);

export const getPublishedBlogPostBySlug = query({
  args: { slug: v.string() },
  returns: blogDetailValidator,
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("blogPosts")
      .withIndex("by_publishing_slug", (q) => q.eq("publishing.slug", args.slug))
      .unique();
    if (!post || post.publishing.status !== "published") return null;
    const card = await toBlogCard(ctx, post);
    return {
      ...card,
      body: post.body,
      seoTitle: post.seo?.seoTitle ?? null,
      seoDescription: post.seo?.seoDescription ?? null,
      related: await resolvePublishedRelated(ctx, post.related),
    };
  },
});

const CATALOG_SCAN_LIMIT = 200;
const DEFAULT_PAGE_SIZE = 12;

type PropertyListArgs = {
  listingStatus: "for_sale" | "for_rent";
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  minArea?: number;
  maxArea?: number;
};

async function matchedPublishedProperties(ctx: QueryCtx, args: PropertyListArgs, take: number) {
  const published = await publishedByListingStatus(ctx, args.listingStatus, take);
  const withCommunity = await Promise.all(
    published.map(async (property) => ({
      property,
      communityName: await communityNameIfPublished(ctx, property.communityId),
    })),
  );
  return withCommunity.filter(
    ({ property, communityName }) =>
      matchesLocation(args.q, property.title, property.city, communityName) &&
      matchesRange(property.price, args.minPrice, args.maxPrice) &&
      matchesCount(property.bedrooms, args.beds) &&
      matchesCount(property.bathrooms, args.baths) &&
      matchesRange(property.areaSqft, args.minArea, args.maxArea),
  );
}

const propertyListArgs = {
  listingStatus: activeListingStatusValidator,
  q: v.optional(v.string()),
  minPrice: v.optional(v.number()),
  maxPrice: v.optional(v.number()),
  beds: v.optional(v.number()),
  baths: v.optional(v.number()),
  minArea: v.optional(v.number()),
  maxArea: v.optional(v.number()),
};

export const listPublishedProperties = query({
  args: propertyListArgs,
  returns: v.array(propertyCardValidator),
  handler: async (ctx, args) => {
    const matched = await matchedPublishedProperties(ctx, args, 48);
    return await Promise.all(matched.map(({ property }) => toPropertyCard(ctx, property)));
  },
});

export const listPublishedPropertiesPage = query({
  args: {
    ...propertyListArgs,
    page: v.number(),
    pageSize: v.optional(v.number()),
  },
  returns: v.object({
    items: v.array(propertyCardValidator),
    total: v.number(),
    page: v.number(),
    pageSize: v.number(),
    pageCount: v.number(),
  }),
  handler: async (ctx, args) => {
    // Facets are in-memory on a bounded scan of published rows — not a
    // search index. Fine while inventory is small; replace with indexes
    // before this list is asked to scan the whole catalog.
    const matched = await matchedPublishedProperties(ctx, args, CATALOG_SCAN_LIMIT);
    const pageSize = Math.min(24, Math.max(1, Math.floor(args.pageSize ?? DEFAULT_PAGE_SIZE)));
    const total = matched.length;
    const pageCount = total === 0 ? 0 : Math.ceil(total / pageSize);
    const page = total === 0 ? 1 : Math.min(pageCount, Math.max(1, Math.floor(args.page)));
    const start = (page - 1) * pageSize;
    const items = await Promise.all(
      matched.slice(start, start + pageSize).map(({ property }) => toPropertyCard(ctx, property)),
    );
    return { items, total, page, pageSize, pageCount };
  },
});

type ProjectListArgs = {
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  construction?: "upcoming" | "under_construction" | "completed";
  developer?: string;
};

async function publishedDeveloperIdForSlug(ctx: QueryCtx, slug: string | undefined) {
  const trimmed = slug?.trim();
  if (!trimmed) return undefined;
  const developer = await ctx.db
    .query("developers")
    .withIndex("by_publishing_slug", (q) => q.eq("publishing.slug", trimmed))
    .unique();
  if (!developer || developer.publishing.status !== "published") return null;
  return developer._id;
}

async function matchedPublishedProjects(ctx: QueryCtx, args: ProjectListArgs, take: number) {
  const developerId = await publishedDeveloperIdForSlug(ctx, args.developer);
  if (developerId === null) return [];
  const published = await ctx.db
    .query("projects")
    .withIndex("by_publishing_status", (q) => q.eq("publishing.status", "published"))
    .order("desc")
    .take(take);
  const withCommunity = await Promise.all(
    published.map(async (project) => ({
      project,
      communityName: await communityNameIfPublished(ctx, project.communityId),
    })),
  );
  return withCommunity.filter(
    ({ project, communityName }) =>
      matchesLocation(args.q, project.title, project.city, communityName) &&
      matchesOptionalRange(project.startingPrice, args.minPrice, args.maxPrice) &&
      matchesBedroomMix(projectBedroomMix(project), args.beds) &&
      (args.construction == null || project.status === args.construction) &&
      (developerId == null || project.developerId === developerId),
  );
}

const projectListArgs = {
  q: v.optional(v.string()),
  minPrice: v.optional(v.number()),
  maxPrice: v.optional(v.number()),
  beds: v.optional(v.number()),
  construction: v.optional(constructionStatusValidator),
  developer: v.optional(v.string()),
};

export const listPublishedProjects = query({
  args: projectListArgs,
  returns: v.array(projectCardValidator),
  handler: async (ctx, args) => {
    const matched = await matchedPublishedProjects(ctx, args, 48);
    return await Promise.all(matched.map(({ project }) => toProjectCard(ctx, project)));
  },
});

export const listPublishedProjectsPage = query({
  args: {
    ...projectListArgs,
    page: v.number(),
    pageSize: v.optional(v.number()),
  },
  returns: v.object({
    items: v.array(projectCardValidator),
    total: v.number(),
    page: v.number(),
    pageSize: v.number(),
    pageCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const matched = await matchedPublishedProjects(ctx, args, CATALOG_SCAN_LIMIT);
    const pageSize = Math.min(24, Math.max(1, Math.floor(args.pageSize ?? DEFAULT_PAGE_SIZE)));
    const total = matched.length;
    const pageCount = total === 0 ? 0 : Math.ceil(total / pageSize);
    const page = total === 0 ? 1 : Math.min(pageCount, Math.max(1, Math.floor(args.page)));
    const start = (page - 1) * pageSize;
    const items = await Promise.all(
      matched.slice(start, start + pageSize).map(({ project }) => toProjectCard(ctx, project)),
    );
    return { items, total, page, pageSize, pageCount };
  },
});

const projectDeveloperOptionValidator = v.object({
  slug: v.string(),
  name: localizedTextValidator,
});

export const listPublishedProjectDevelopers = query({
  args: {},
  returns: v.array(projectDeveloperOptionValidator),
  handler: async (ctx) => {
    const published = await ctx.db
      .query("projects")
      .withIndex("by_publishing_status", (q) => q.eq("publishing.status", "published"))
      .take(CATALOG_SCAN_LIMIT);
    const developerIds = [...new Set(published.map((project) => project.developerId))];
    const developers = await Promise.all(developerIds.map((id) => ctx.db.get(id)));
    return developers.flatMap((developer) =>
      developer && developer.publishing.status === "published"
        ? [{ slug: developer.publishing.slug, name: developer.name }]
        : [],
    );
  },
});

export const getPublishedPropertyBySlug = query({
  args: { slug: v.string() },
  returns: propertyDetailValidator,
  handler: async (ctx, args) => {
    const property = await ctx.db
      .query("properties")
      .withIndex("by_publishing_slug", (q) => q.eq("publishing.slug", args.slug))
      .unique();
    if (!property || property.publishing.status !== "published") return null;
    const card = await toPropertyCard(ctx, property);
    const [images, agent, project, developer] = await Promise.all([
      entityImages(ctx, "property", property._id),
      publishedAgentCard(ctx, property.agentId),
      publishedProjectRef(ctx, property.projectId),
      publishedDeveloperRef(ctx, property.developerId),
    ]);
    return {
      ...card,
      address: property.address ?? null,
      placeId: property.placeId ?? null,
      coordinates: property.coordinates ?? null,
      images,
      amenities: property.amenities ?? [],
      agent,
      project,
      developerName: developer?.name ?? null,
      developerSlug: developer?.slug ?? null,
      propertyType: property.propertyType ?? null,
      furnishing: property.furnishing ?? null,
      rentalPeriod: property.listingStatus === "for_rent" ? (property.rentalPeriod ?? null) : null,
    };
  },
});

export const listSuggestedProperties = query({
  args: { slug: v.string() },
  returns: v.array(propertyCardValidator),
  handler: async (ctx, args) => {
    const property = await ctx.db
      .query("properties")
      .withIndex("by_publishing_slug", (q) => q.eq("publishing.slug", args.slug))
      .unique();
    if (!property || property.publishing.status !== "published") return [];
    return await suggestedPropertiesFor(ctx, property);
  },
});

export const getPublishedProjectBySlug = query({
  args: { slug: v.string() },
  returns: projectDetailValidator,
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("projects")
      .withIndex("by_publishing_slug", (q) => q.eq("publishing.slug", args.slug))
      .unique();
    if (!project || project.publishing.status !== "published") return null;
    const publishedUnits = await publishedPropertiesForProject(ctx, project._id);
    const [card, images, units] = await Promise.all([
      toProjectCard(ctx, project, publishedUnits),
      entityImages(ctx, "project", project._id),
      Promise.all(publishedUnits.map((property) => toPropertyCard(ctx, property))),
    ]);
    return {
      ...card,
      address: project.address ?? null,
      placeId: project.placeId ?? null,
      coordinates: project.coordinates ?? null,
      images,
      amenities: project.amenities ?? [],
      paymentPlan: (project.paymentPlan ?? []).map((row) => ({
        label: row.label,
        percentage: row.percentage,
        note: row.note ?? null,
      })),
      unitTypes: unitTypesForProject(project),
      units,
    };
  },
});

export const listPublishedDevelopers = query({
  args: {},
  returns: v.array(developerCardValidator),
  handler: async (ctx) => {
    const published = await ctx.db
      .query("developers")
      .withIndex("by_publishing_status", (q) => q.eq("publishing.status", "published"))
      .take(DIRECTORY_SCAN_LIMIT);
    const sorted = sortPublishedCatalog(published, "name");
    return await Promise.all(sorted.map((developer) => toDeveloperCard(ctx, developer)));
  },
});

const developerDetailValidator = v.union(
  v.null(),
  developerCardValidator.extend({
    description: v.union(localizedTextValidator, v.null()),
    website: v.union(v.string(), v.null()),
    email: v.union(v.string(), v.null()),
    phone: v.union(v.string(), v.null()),
    images: v.array(
      v.object({
        url: v.string(),
        alt: v.union(localizedTextValidator, v.null()),
      }),
    ),
    projects: v.array(projectCardValidator),
    properties: v.array(propertyCardValidator),
  }),
);

export const getPublishedDeveloperBySlug = query({
  args: { slug: v.string() },
  returns: developerDetailValidator,
  handler: async (ctx, args) => {
    const developer = await ctx.db
      .query("developers")
      .withIndex("by_publishing_slug", (q) => q.eq("publishing.slug", args.slug))
      .unique();
    if (!developer || developer.publishing.status !== "published") return null;
    const [card, images, linkedProjects, linkedProperties] = await Promise.all([
      toDeveloperCard(ctx, developer),
      entityImages(ctx, "developer", developer._id),
      publishedProjectsForDeveloper(ctx, developer._id),
      publishedPropertiesForDeveloper(ctx, developer._id),
    ]);
    const [projects, properties] = await Promise.all([
      Promise.all(linkedProjects.map((project) => toProjectCard(ctx, project))),
      Promise.all(linkedProperties.map((property) => toPropertyCard(ctx, property))),
    ]);
    return {
      ...card,
      description: developer.description ?? null,
      website: developer.website ?? null,
      email: developer.email ?? null,
      phone: developer.phone ?? null,
      images,
      projects,
      properties,
    };
  },
});

const agentCardValidator = v.object({
  _id: v.id("agents"),
  slug: v.string(),
  name: v.string(),
  position: v.union(v.string(), v.null()),
  imageUrl: v.union(v.string(), v.null()),
  imageAlt: v.union(localizedTextValidator, v.null()),
  email: v.string(),
  phone: v.union(v.string(), v.null()),
});

async function toAgentCard(ctx: QueryCtx, agent: Doc<"agents">) {
  const image = await primaryImage(ctx, "agent", agent._id);
  return {
    _id: agent._id,
    slug: agent.publishing.slug,
    name: agent.name,
    position: agent.position ?? null,
    imageUrl: image.url,
    imageAlt: image.alt,
    email: agent.email,
    phone: agent.phone ?? null,
  };
}

export const listPublishedAgents = query({
  args: {},
  returns: v.array(agentCardValidator),
  handler: async (ctx) => {
    const published = await ctx.db
      .query("agents")
      .withIndex("by_publishing_status", (q) => q.eq("publishing.status", "published"))
      .take(DIRECTORY_SCAN_LIMIT);
    const sorted = [...published].sort((a, b) => a.name.localeCompare(b.name, "en"));
    return await Promise.all(sorted.map((agent) => toAgentCard(ctx, agent)));
  },
});

const agentDetailValidator = v.union(
  v.null(),
  agentCardValidator.extend({
    bio: v.union(localizedTextValidator, v.null()),
    properties: v.array(propertyCardValidator),
  }),
);

export const getPublishedAgentBySlug = query({
  args: { slug: v.string() },
  returns: agentDetailValidator,
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_publishing_slug", (q) => q.eq("publishing.slug", args.slug))
      .unique();
    if (!agent || agent.publishing.status !== "published") return null;
    const [card, linkedProperties] = await Promise.all([
      toAgentCard(ctx, agent),
      publishedPropertiesForAgent(ctx, agent._id),
    ]);
    return {
      ...card,
      bio: agent.bio ?? null,
      properties: await Promise.all(linkedProperties.map((property) => toPropertyCard(ctx, property))),
    };
  },
});
