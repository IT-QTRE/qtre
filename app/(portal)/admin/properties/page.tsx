"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminFilterGroup } from "@/components/admin/admin-filter-group";
import { PropertyList } from "@/components/admin/properties/property-list";
import { useAuthedQuery } from "@/components/admin/use-authed-query";

const PUBLISHING_FILTERS = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Draft" },
] as const;

const LISTING_FILTERS = [
  { id: "all", label: "All" },
  { id: "sale", label: "Sale" },
  { id: "rent", label: "Rent" },
] as const;

type PublishingFilter = (typeof PUBLISHING_FILTERS)[number]["id"];
type ListingFilter = (typeof LISTING_FILTERS)[number]["id"];

function parsePublishing(value: string | null): PublishingFilter {
  if (value === "published" || value === "draft") return value;
  return "all";
}

function parseListing(value: string | null): ListingFilter {
  if (value === "sale" || value === "rent") return value;
  return "all";
}

function hrefWithFilters(
  pathname: string,
  queryString: string,
  patch: { publishing?: PublishingFilter; listing?: ListingFilter },
) {
  const params = new URLSearchParams(queryString);
  const publishing = patch.publishing ?? parsePublishing(params.get("publishing"));
  const listing = patch.listing ?? parseListing(params.get("listing"));
  if (publishing === "all") params.delete("publishing");
  else params.set("publishing", publishing);
  if (listing === "all") params.delete("listing");
  else params.set("listing", listing);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function PropertyListSkeleton() {
  return (
    <div className="divide-y divide-border border-y border-border" aria-hidden>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 py-3.5">
          <div className="size-10 bg-muted" />
          <div className="h-3 w-40 bg-muted" />
          <div className="ms-auto h-3 w-16 bg-muted" />
        </div>
      ))}
    </div>
  );
}

export default function PropertiesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const publishing = parsePublishing(searchParams.get("publishing"));
  const listing = parseListing(searchParams.get("listing"));
  const properties = useAuthedQuery(api.properties.list, {});
  const communities = useAuthedQuery(api.communities.list, {});

  function setPublishing(value: PublishingFilter) {
    router.replace(hrefWithFilters(pathname, searchParams.toString(), { publishing: value }), { scroll: false });
  }

  function setListing(value: ListingFilter) {
    router.replace(hrefWithFilters(pathname, searchParams.toString(), { listing: value }), { scroll: false });
  }
  const thumbnails = useQuery(
    api.mediaItems.listPrimaryByEntityIds,
    properties ? { entityType: "property", entityIds: properties.map((property) => property._id) } : "skip",
  );
  const thumbnailByPropertyId = new Map(Object.entries(thumbnails ?? {}));
  const communityNameById = new Map((communities ?? []).map((community) => [community._id, community.name.en]));

  const scoped = useMemo(() => {
    if (!properties) return [];
    return properties.filter((property) => {
      if (publishing !== "all" && property.publishing.status !== publishing) return false;
      if (listing === "sale" && property.listingStatus !== "for_sale") return false;
      if (listing === "rent" && property.listingStatus !== "for_rent") return false;
      return true;
    });
  }, [properties, publishing, listing]);

  const filters = (
    <>
      <AdminFilterGroup label="Publishing status" options={PUBLISHING_FILTERS} value={publishing} onChange={setPublishing} />
      <AdminFilterGroup label="Listing type" options={LISTING_FILTERS} value={listing} onChange={setListing} />
    </>
  );

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Properties"
        description="Sale and rent listings in the catalog."
        actions={
          <Button render={<Link href="/admin/properties/new" />} nativeButton={false}>
            <Plus className="size-4" aria-hidden />
            New property
          </Button>
        }
      />

      {properties === undefined ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">{filters}</div>
          <PropertyListSkeleton />
        </div>
      ) : properties.length === 0 ? (
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          No properties yet.{" "}
          <Link href="/admin/properties/new" className="font-medium text-primary underline-offset-4 hover:underline">
            Add a property
          </Link>
          .
        </p>
      ) : (
        <PropertyList
          properties={scoped}
          thumbnailByPropertyId={thumbnailByPropertyId}
          communityNameById={communityNameById}
          toolbar={filters}
        />
      )}
    </div>
  );
}
