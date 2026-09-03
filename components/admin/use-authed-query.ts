"use client";

import { useConvexAuth, useQuery } from "convex/react";
import type { FunctionArgs, FunctionReference } from "convex/server";

// Clerk's JWT is not on the Convex client on the first client render, even
// after the admin layout already checked the session on the server. Calling
// a requireRole query in that window throws ForbiddenError and Next's dev
// overlay treats it as a runtime crash. Skip until Convex reports auth.
export function useAuthedQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args: FunctionArgs<Query> | "skip",
) {
  const { isAuthenticated } = useConvexAuth();
  const skipped = !isAuthenticated || args === "skip";
  return useQuery(query, (skipped ? "skip" : args) as typeof args);
}
