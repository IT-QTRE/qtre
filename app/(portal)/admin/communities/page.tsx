"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table";
import { getCommunityColumns } from "@/components/admin/communities/community-columns";

export default function CommunitiesPage() {
  const communities = useQuery(api.communities.list);
  const thumbnails = useQuery(
    api.mediaItems.listPrimaryByEntityIds,
    communities ? { entityType: "community", entityIds: communities.map((community) => community._id) } : "skip",
  );
  const thumbnailByCommunityId = new Map(Object.entries(thumbnails ?? {}));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Communities</h1>
          <p className="text-muted-foreground">Manage neighborhood and community profiles.</p>
        </div>
        <Button render={<Link href="/admin/communities/new" />} nativeButton={false}>
          <Plus className="size-4" />
          Add Community
        </Button>
      </div>
      {communities === undefined ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <DataTable
          columns={getCommunityColumns(thumbnailByCommunityId)}
          data={communities}
          searchPlaceholder="Search communities..."
          filterColumnId="nameText"
        />
      )}
    </div>
  );
}
