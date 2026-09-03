"use client";

import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ProjectForm } from "@/components/admin/projects/project-form";
import { GuardedBackLink, UnsavedChangesProvider } from "@/components/admin/unsaved-changes";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAuthedQuery } from "@/components/admin/use-authed-query";

export default function ProjectEditPage() {
  const params = useParams<{ id: string }>();
  const project = useAuthedQuery(api.projects.get, { id: params.id as Id<"projects"> });

  if (project === undefined) {
    return (
      <div className="space-y-8">
        <AdminPageHeader back={<GuardedBackLink href="/admin/projects" label="Projects" />} title="Project" />
        <div className="h-48 border border-border bg-muted/60" aria-hidden />
      </div>
    );
  }
  if (project === null) {
    return (
      <div className="space-y-8">
        <AdminPageHeader back={<GuardedBackLink href="/admin/projects" label="Projects" />} title="Project" />
        <p className="max-w-prose text-sm text-muted-foreground">This project is not in your catalog.</p>
      </div>
    );
  }

  return (
    <UnsavedChangesProvider>
      <div className="space-y-8">
        <AdminPageHeader
          back={<GuardedBackLink href="/admin/projects" label="Projects" />}
          title={project.title.en}
          description="Edit project, photos, and publishing."
        />
        <ProjectForm mode="edit" project={project} />
      </div>
    </UnsavedChangesProvider>
  );
}
