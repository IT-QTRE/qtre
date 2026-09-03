import { cache } from "react";
import { fetchQuery } from "convex/nextjs";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";

// Per-request only (React.cache). Same query + args in generateMetadata and
// the page share one Convex round-trip. Never pass a Clerk token here.
const cachedFetch = cache(async (query: FunctionReference<"query">, argsJson: string) => {
  return fetchQuery(query, JSON.parse(argsJson) as never);
});

export function fetchPublicQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args: FunctionArgs<Query>,
): Promise<FunctionReturnType<Query>> {
  return cachedFetch(query, JSON.stringify(args ?? {})) as Promise<FunctionReturnType<Query>>;
}
