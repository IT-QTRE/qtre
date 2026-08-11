"use client";

import { WebsiteSettingsForm } from "@/components/admin/settings/website-settings-form";

export default function WebsiteSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Website Settings</h1>
        <p className="text-muted-foreground">
          Manage site-wide contact info, social links, and default SEO.
        </p>
      </div>
      <WebsiteSettingsForm />
    </div>
  );
}
