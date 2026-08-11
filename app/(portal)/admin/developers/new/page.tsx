"use client";

import { DeveloperForm } from "@/components/admin/developers/developer-form";
import { BackLink } from "@/components/admin/back-link";

export default function NewDeveloperPage() {
  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin/developers" label="Back to Developers" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Add Developer</h1>
        <p className="text-muted-foreground">Create a new developer profile.</p>
      </div>
      <DeveloperForm mode="create" />
    </div>
  );
}
