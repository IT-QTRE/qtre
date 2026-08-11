"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PropertyForm } from "@/components/admin/properties/property-form";
import { BackLink } from "@/components/admin/back-link";

export default function PropertyEditPage() {
  const params = useParams<{ id: string }>();
  const property = useQuery(api.properties.get, { id: params.id as Id<"properties"> });

  if (property === undefined) {
    return <p className="text-muted-foreground">Loading…</p>;
  }
  if (property === null) {
    return <p className="text-muted-foreground">Property not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin/properties" label="Back to Properties" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{property.title.en}</h1>
        <p className="text-muted-foreground">Edit property listing.</p>
      </div>
      <PropertyForm mode="edit" property={property} />
    </div>
  );
}
