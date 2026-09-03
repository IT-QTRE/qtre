"use client";

import { WebsiteSettingsForm } from "@/components/admin/settings/website-settings-form";
import { UnsavedChangesProvider } from "@/components/admin/unsaved-changes";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default function WebsiteSettingsPage() {
  return (
    <UnsavedChangesProvider>
      <div className="space-y-8">
        <AdminPageHeader
          title="Website Settings"
          description="Site-wide contact, social links, and fallback SEO."
        />
        <WebsiteSettingsForm />
      </div>
    </UnsavedChangesProvider>
  );
}
