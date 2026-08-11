"use client";

import { ProjectForm } from "@/components/admin/projects/project-form";
import { BackLink } from "@/components/admin/back-link";

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin/projects" label="Back to Projects" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Add Project</h1>
        <p className="text-muted-foreground">Create a new real estate development project.</p>
      </div>
      <ProjectForm mode="create" />
    </div>
  );
}
