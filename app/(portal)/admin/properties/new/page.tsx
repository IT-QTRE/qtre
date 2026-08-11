"use client";

import { PropertyForm } from "@/components/admin/properties/property-form";
import { BackLink } from "@/components/admin/back-link";

export default function NewPropertyPage() {
  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin/properties" label="Back to Properties" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Add Property</h1>
        <p className="text-muted-foreground">Create a new property listing.</p>
      </div>
      <PropertyForm mode="create" />
    </div>
  );
}
