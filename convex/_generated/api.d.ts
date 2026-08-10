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
import type * as lib_agentInvitation from "../lib/agentInvitation.js";
import type * as lib_auditLog from "../lib/auditLog.js";
import type * as lib_clerkMetadata from "../lib/clerkMetadata.js";
import type * as lib_localizedText from "../lib/localizedText.js";
import type * as lib_mediaEntityType from "../lib/mediaEntityType.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_propertyFacts from "../lib/propertyFacts.js";
import type * as lib_roles from "../lib/roles.js";
import type * as lib_seoFields from "../lib/seoFields.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentInvitations: typeof agentInvitations;
  "lib/agentInvitation": typeof lib_agentInvitation;
  "lib/auditLog": typeof lib_auditLog;
  "lib/clerkMetadata": typeof lib_clerkMetadata;
  "lib/localizedText": typeof lib_localizedText;
  "lib/mediaEntityType": typeof lib_mediaEntityType;
  "lib/permissions": typeof lib_permissions;
  "lib/propertyFacts": typeof lib_propertyFacts;
  "lib/roles": typeof lib_roles;
  "lib/seoFields": typeof lib_seoFields;
  users: typeof users;
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
