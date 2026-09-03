/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentInvitations from "../agentInvitations.js";
import type * as agents from "../agents.js";
import type * as auditLogs from "../auditLogs.js";
import type * as blogCategories from "../blogCategories.js";
import type * as blogPosts from "../blogPosts.js";
import type * as communities from "../communities.js";
import type * as developers from "../developers.js";
import type * as leads from "../leads.js";
import type * as lib_agentInvitation from "../lib/agentInvitation.js";
import type * as lib_auditLog from "../lib/auditLog.js";
import type * as lib_bedroomTypes from "../lib/bedroomTypes.js";
import type * as lib_blogCategory from "../lib/blogCategory.js";
import type * as lib_blogRelated from "../lib/blogRelated.js";
import type * as lib_catalogRank from "../lib/catalogRank.js";
import type * as lib_categorySlug from "../lib/categorySlug.js";
import type * as lib_clerkMetadata from "../lib/clerkMetadata.js";
import type * as lib_completionDate from "../lib/completionDate.js";
import type * as lib_ghlFormUrl from "../lib/ghlFormUrl.js";
import type * as lib_localizedText from "../lib/localizedText.js";
import type * as lib_mediaAccessConfig from "../lib/mediaAccessConfig.js";
import type * as lib_mediaAuthorization from "../lib/mediaAuthorization.js";
import type * as lib_mediaEntityType from "../lib/mediaEntityType.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_propertyAttributes from "../lib/propertyAttributes.js";
import type * as lib_propertyFacts from "../lib/propertyFacts.js";
import type * as lib_roles from "../lib/roles.js";
import type * as lib_seoFields from "../lib/seoFields.js";
import type * as lib_whatsappHref from "../lib/whatsappHref.js";
import type * as mediaItems from "../mediaItems.js";
import type * as overview from "../overview.js";
import type * as projects from "../projects.js";
import type * as properties from "../properties.js";
import type * as publicCatalog from "../publicCatalog.js";
import type * as publicLeads from "../publicLeads.js";
import type * as users from "../users.js";
import type * as websiteSettings from "../websiteSettings.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentInvitations: typeof agentInvitations;
  agents: typeof agents;
  auditLogs: typeof auditLogs;
  blogCategories: typeof blogCategories;
  blogPosts: typeof blogPosts;
  communities: typeof communities;
  developers: typeof developers;
  leads: typeof leads;
  "lib/agentInvitation": typeof lib_agentInvitation;
  "lib/auditLog": typeof lib_auditLog;
  "lib/bedroomTypes": typeof lib_bedroomTypes;
  "lib/blogCategory": typeof lib_blogCategory;
  "lib/blogRelated": typeof lib_blogRelated;
  "lib/catalogRank": typeof lib_catalogRank;
  "lib/categorySlug": typeof lib_categorySlug;
  "lib/clerkMetadata": typeof lib_clerkMetadata;
  "lib/completionDate": typeof lib_completionDate;
  "lib/ghlFormUrl": typeof lib_ghlFormUrl;
  "lib/localizedText": typeof lib_localizedText;
  "lib/mediaAccessConfig": typeof lib_mediaAccessConfig;
  "lib/mediaAuthorization": typeof lib_mediaAuthorization;
  "lib/mediaEntityType": typeof lib_mediaEntityType;
  "lib/permissions": typeof lib_permissions;
  "lib/propertyAttributes": typeof lib_propertyAttributes;
  "lib/propertyFacts": typeof lib_propertyFacts;
  "lib/roles": typeof lib_roles;
  "lib/seoFields": typeof lib_seoFields;
  "lib/whatsappHref": typeof lib_whatsappHref;
  mediaItems: typeof mediaItems;
  overview: typeof overview;
  projects: typeof projects;
  properties: typeof properties;
  publicCatalog: typeof publicCatalog;
  publicLeads: typeof publicLeads;
  users: typeof users;
  websiteSettings: typeof websiteSettings;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
