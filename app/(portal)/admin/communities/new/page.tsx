"use client";

import { CommunityForm } from "@/components/admin/communities/community-form";
import { GuardedBackLink, UnsavedChangesProvider } from "@/components/admin/unsaved-changes";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default function NewCommunityPage() {
  return (
    <UnsavedChangesProvider>
      <div className="space-y-8">
        <AdminPageHeader
          back={<GuardedBackLink href="/admin/communities" label="Communities" />}
          title="New community"
          description="Add a neighborhood to the catalog."
        />
        <CommunityForm mode="create" />
      </div>
    </UnsavedChangesProvider>
  );
}
