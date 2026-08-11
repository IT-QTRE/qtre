"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table";
import { getDeveloperColumns } from "@/components/admin/developers/developer-columns";

export default function DevelopersPage() {
  const developers = useQuery(api.developers.list);
  const thumbnails = useQuery(
    api.mediaItems.listPrimaryByEntityIds,
    developers ? { entityType: "developer", entityIds: developers.map((developer) => developer._id) } : "skip",
  );
  const thumbnailByDeveloperId = new Map(Object.entries(thumbnails ?? {}));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Developers</h1>
          <p className="text-muted-foreground">Manage real estate developer profiles.</p>
        </div>
        <Button render={<Link href="/admin/developers/new" />} nativeButton={false}>
          <Plus className="size-4" />
          Add Developer
        </Button>
      </div>
      {developers === undefined ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <DataTable
          columns={getDeveloperColumns(thumbnailByDeveloperId)}
          data={developers}
          searchPlaceholder="Search developers..."
          filterColumnId="nameText"
        />
      )}
    </div>
  );
}
