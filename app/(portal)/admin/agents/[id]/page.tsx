"use client";

import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AgentForm } from "@/components/admin/agents/agent-form";
import { GuardedBackLink, UnsavedChangesProvider } from "@/components/admin/unsaved-changes";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAuthedQuery } from "@/components/admin/use-authed-query";

export default function AgentEditPage() {
  const params = useParams<{ id: string }>();
  const agent = useAuthedQuery(api.agents.get, { id: params.id as Id<"agents"> });

  if (agent === undefined) {
    return (
      <div className="space-y-8">
        <AdminPageHeader back={<GuardedBackLink href="/admin/agents" label="Agents" />} title="Agent" />
        <div className="h-48 border border-border bg-muted/60" aria-hidden />
      </div>
    );
  }
  if (agent === null) {
    return (
      <div className="space-y-8">
        <AdminPageHeader back={<GuardedBackLink href="/admin/agents" label="Agents" />} title="Agent" />
        <p className="max-w-prose text-sm text-muted-foreground">This agent is not in your catalog.</p>
      </div>
    );
  }

  return (
    <UnsavedChangesProvider>
      <div className="space-y-8">
        <AdminPageHeader
          back={<GuardedBackLink href="/admin/agents" label="Agents" />}
          title={agent.name}
          description="Edit profile, photo, and publishing."
        />
        <AgentForm mode="edit" agent={agent} />
      </div>
    </UnsavedChangesProvider>
  );
}
