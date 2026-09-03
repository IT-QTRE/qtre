"use client";

import { DeveloperForm } from "@/components/admin/developers/developer-form";
import { GuardedBackLink, UnsavedChangesProvider } from "@/components/admin/unsaved-changes";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default function NewDeveloperPage() {
  return (
    <UnsavedChangesProvider>
      <div className="space-y-8">
        <AdminPageHeader
          back={<GuardedBackLink href="/admin/developers" label="Developers" />}
          title="New developer"
          description="Add a developer house to the catalog."
        />
        <DeveloperForm mode="create" />
      </div>
    </UnsavedChangesProvider>
  );
}
