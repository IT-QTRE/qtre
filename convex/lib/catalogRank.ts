import type { MutationCtx } from "../_generated/server";

export function compareCatalogRank<T extends { rank?: number; _creationTime: number; name: { en: string } }>(
  a: T,
  b: T,
) {
  const aRank = a.rank;
  const bRank = b.rank;
  if (aRank != null && bRank != null && aRank !== bRank) return aRank - bRank;
  if (aRank != null && bRank == null) return -1;
  if (aRank == null && bRank != null) return 1;
  const byName = a.name.en.localeCompare(b.name.en, "en");
  if (byName !== 0) return byName;
  return b._creationTime - a._creationTime;
}

export function sortPublishedCatalog<T extends { rank?: number; _creationTime: number; name: { en: string } }>(
  rows: T[],
  unranked: "name" | "newest",
) {
  const anyRanked = rows.some((row) => row.rank != null);
  if (!anyRanked) {
    return unranked === "name"
      ? [...rows].sort((a, b) => a.name.en.localeCompare(b.name.en, "en"))
      : [...rows].sort((a, b) => b._creationTime - a._creationTime);
  }
  return [...rows].sort(compareCatalogRank);
}

export async function nextCatalogRank(ctx: MutationCtx, table: "communities" | "developers") {
  const rows = await ctx.db.query(table).collect();
  let max: number | undefined;
  for (const row of rows) {
    if (row.rank == null) continue;
    max = max == null ? row.rank : Math.max(max, row.rank);
  }
  if (max == null) return undefined;
  return max + 1;
}
