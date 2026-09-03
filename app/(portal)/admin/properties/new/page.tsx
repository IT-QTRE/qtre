"use client";

import { PropertyForm } from "@/components/admin/properties/property-form";
import { GuardedBackLink, UnsavedChangesProvider } from "@/components/admin/unsaved-changes";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default function NewPropertyPage() {
  return (
    <UnsavedChangesProvider>
      <div className="space-y-8">
        <AdminPageHeader
          back={<GuardedBackLink href="/admin/properties" label="Properties" />}
          title="New property"
          description="Add a sale or rent listing to the catalog."
        />
        <PropertyForm mode="create" />
      </div>
    </UnsavedChangesProvider>
  );
}
