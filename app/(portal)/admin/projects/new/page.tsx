"use client";

import { ProjectForm } from "@/components/admin/projects/project-form";
import { GuardedBackLink, UnsavedChangesProvider } from "@/components/admin/unsaved-changes";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default function NewProjectPage() {
  return (
    <UnsavedChangesProvider>
      <div className="space-y-8">
        <AdminPageHeader
          back={<GuardedBackLink href="/admin/projects" label="Projects" />}
          title="New project"
          description="Add a development project to the catalog."
        />
        <ProjectForm mode="create" />
      </div>
    </UnsavedChangesProvider>
  );
}
