"use client";

import { useConvexAuth, usePaginatedQuery } from "convex/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminFilterGroup } from "@/components/admin/admin-filter-group";
import {
  ENTITY_TYPE_LABEL,
  MediaLibraryGrid,
  MediaLibrarySkeleton,
  MediaLoadMore,
  PUBLIC_ENTITY_TYPES,
  type PublicMediaEntityType,
} from "@/components/admin/media/media-library";

const TYPE_FILTERS = [
  { id: "all", label: "All" },
  ...PUBLIC_ENTITY_TYPES.map((type) => ({ id: type, label: ENTITY_TYPE_LABEL[type] })),
] as const;

type TypeFilter = (typeof TYPE_FILTERS)[number]["id"];

function parseType(value: string | null): TypeFilter {
  if (value && PUBLIC_ENTITY_TYPES.includes(value as PublicMediaEntityType)) {
    return value as PublicMediaEntityType;
  }
  return "all";
}

function hrefWithType(pathname: string, queryString: string, type: TypeFilter) {
  const params = new URLSearchParams(queryString);
  if (type === "all") params.delete("type");
  else params.set("type", type);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function statusMessage({
  loading,
  loadingMore,
  count,
  typeFilter,
}: {
  loading: boolean;
  loadingMore: boolean;
  count: number;
  typeFilter: TypeFilter;
}) {
  if (loading) return "Loading photos…";
  if (loadingMore) return "Loading more photos…";
  if (count === 0) {
    return typeFilter === "all"
      ? "No photos yet. Add them from a property, project, or profile."
      : `No photos on ${ENTITY_TYPE_LABEL[typeFilter].toLowerCase()} records.`;
  }
  return `${count} photos`;
}

export default function MediaLibraryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useConvexAuth();
  const typeFilter = parseType(searchParams.get("type"));
  const entityType = typeFilter !== "all" ? typeFilter : undefined;

  const { results, status, loadMore } = usePaginatedQuery(
    api.mediaItems.listAllPaginated,
    isAuthenticated ? { entityType } : "skip",
    { initialNumItems: 40 },
  );

  function setType(value: TypeFilter) {
    router.replace(hrefWithType(pathname, searchParams.toString(), value), { scroll: false });
  }

  const filters = (
    <AdminFilterGroup
      label="Attached to"
      layout="wrap"
      options={TYPE_FILTERS}
      value={typeFilter}
      onChange={setType}
    />
  );

  const loading = !isAuthenticated || status === "LoadingFirstPage";
  const emptyCopy =
    typeFilter === "all"
      ? "No photos yet. Add them from a property, project, or profile."
      : `No photos on ${ENTITY_TYPE_LABEL[typeFilter].toLowerCase()} records.`;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Media"
        description="Photos attached to listings and profiles. Add them on the record."
      />

      <p className="sr-only" aria-live="polite">
        {statusMessage({
          loading,
          loadingMore: status === "LoadingMore",
          count: results.length,
          typeFilter,
        })}
      </p>

      <div className="space-y-3" aria-busy={loading || status === "LoadingMore"}>
        {filters}
        {loading ? (
          <MediaLibrarySkeleton />
        ) : results.length === 0 ? (
          <p className="max-w-prose py-8 text-sm leading-relaxed text-muted-foreground">{emptyCopy}</p>
        ) : (
          <>
            <MediaLibraryGrid items={results} />
            <MediaLoadMore
              canLoadMore={status === "CanLoadMore"}
              isLoadingMore={status === "LoadingMore"}
              onLoadMore={() => loadMore(40)}
            />
          </>
        )}
      </div>
    </div>
  );
}
