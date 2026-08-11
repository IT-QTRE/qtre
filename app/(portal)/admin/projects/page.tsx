"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table";
import { getProjectColumns } from "@/components/admin/projects/project-columns";

export default function ProjectsPage() {
  const projects = useQuery(api.projects.list);
  const developers = useQuery(api.developers.list);
  const thumbnails = useQuery(
    api.mediaItems.listPrimaryByEntityIds,
    projects ? { entityType: "project", entityIds: projects.map((project) => project._id) } : "skip",
  );

  const developerNameById = new Map((developers ?? []).map((developer) => [developer._id, developer.name.en]));
  const thumbnailByProjectId = new Map(Object.entries(thumbnails ?? {}));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Projects</h1>
          <p className="text-muted-foreground">Manage real estate development projects.</p>
        </div>
        <Button render={<Link href="/admin/projects/new" />} nativeButton={false}>
          <Plus className="size-4" />
          Add Project
        </Button>
      </div>
      {projects === undefined ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <DataTable
          columns={getProjectColumns(developerNameById, thumbnailByProjectId)}
          data={projects}
          searchPlaceholder="Search projects..."
          filterColumnId="titleText"
        />
      )}
    </div>
  );
}
