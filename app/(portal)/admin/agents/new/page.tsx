"use client";

import { AgentForm } from "@/components/admin/agents/agent-form";
import { GuardedBackLink, UnsavedChangesProvider } from "@/components/admin/unsaved-changes";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default function NewAgentPage() {
  return (
    <UnsavedChangesProvider>
      <div className="space-y-8">
        <AdminPageHeader
          back={<GuardedBackLink href="/admin/agents" label="Agents" />}
          title="New agent"
          description="Add an agent profile to the catalog."
        />
        <AgentForm mode="create" />
      </div>
    </UnsavedChangesProvider>
  );
}
