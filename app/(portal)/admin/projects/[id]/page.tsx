"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ProjectForm } from "@/components/admin/projects/project-form";
import { BackLink } from "@/components/admin/back-link";

export default function ProjectEditPage() {
  const params = useParams<{ id: string }>();
  const project = useQuery(api.projects.get, { id: params.id as Id<"projects"> });

  if (project === undefined) {
    return <p className="text-muted-foreground">Loading…</p>;
  }
  if (project === null) {
    return <p className="text-muted-foreground">Project not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin/projects" label="Back to Projects" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{project.title.en}</h1>
        <p className="text-muted-foreground">Edit project details.</p>
      </div>
      <ProjectForm mode="edit" project={project} />
    </div>
  );
}
