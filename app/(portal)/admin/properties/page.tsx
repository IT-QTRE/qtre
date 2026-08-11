"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table";
import { getPropertyColumns } from "@/components/admin/properties/property-columns";

export default function PropertiesPage() {
  const properties = useQuery(api.properties.list);
  const thumbnails = useQuery(
    api.mediaItems.listPrimaryByEntityIds,
    properties ? { entityType: "property", entityIds: properties.map((property) => property._id) } : "skip",
  );
  const thumbnailByPropertyId = new Map(Object.entries(thumbnails ?? {}));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Properties</h1>
          <p className="text-muted-foreground">Manage property listings.</p>
        </div>
        <Button render={<Link href="/admin/properties/new" />} nativeButton={false}>
          <Plus className="size-4" />
          Add Property
        </Button>
      </div>
      {properties === undefined ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <DataTable
          columns={getPropertyColumns(thumbnailByPropertyId)}
          data={properties}
          searchPlaceholder="Search properties..."
          filterColumnId="titleText"
        />
      )}
    </div>
  );
}
