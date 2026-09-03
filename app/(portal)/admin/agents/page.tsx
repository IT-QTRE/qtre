"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminFilterGroup } from "@/components/admin/admin-filter-group";
import { AgentList } from "@/components/admin/agents/agent-list";
import { useAuthedQuery } from "@/components/admin/use-authed-query";

const PUBLISHING_FILTERS = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Draft" },
] as const;

type PublishingFilter = (typeof PUBLISHING_FILTERS)[number]["id"];

function parsePublishing(value: string | null): PublishingFilter {
  if (value === "published" || value === "draft") return value;
  return "all";
}

function hrefWithFilters(pathname: string, queryString: string, publishing: PublishingFilter) {
  const params = new URLSearchParams(queryString);
  if (publishing === "all") params.delete("publishing");
  else params.set("publishing", publishing);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function AgentListSkeleton() {
  return (
    <div className="divide-y divide-border border-y border-border" aria-hidden>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 py-3.5">
          <div className="size-10 bg-muted" />
          <div className="h-3 w-40 bg-muted" />
          <div className="ms-auto h-3 w-16 bg-muted" />
        </div>
      ))}
    </div>
  );
}

export default function AgentsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const publishing = parsePublishing(searchParams.get("publishing"));
  const agents = useAuthedQuery(api.agents.list, {});

  function setPublishing(value: PublishingFilter) {
    router.replace(hrefWithFilters(pathname, searchParams.toString(), value), { scroll: false });
  }

  const thumbnails = useQuery(
    api.mediaItems.listPrimaryByEntityIds,
    agents ? { entityType: "agent", entityIds: agents.map((agent) => agent._id) } : "skip",
  );
  const thumbnailByAgentId = new Map(Object.entries(thumbnails ?? {}));

  const scoped = useMemo(() => {
    if (!agents) return [];
    return agents.filter((agent) => {
      if (publishing !== "all" && agent.publishing.status !== publishing) return false;
      return true;
    });
  }, [agents, publishing]);

  const filters = (
    <AdminFilterGroup label="Publishing status" options={PUBLISHING_FILTERS} value={publishing} onChange={setPublishing} />
  );

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Agents"
        description="People who represent listings."
        actions={
          <Button render={<Link href="/admin/agents/new" />} nativeButton={false}>
            <Plus className="size-4" aria-hidden />
            New agent
          </Button>
        }
      />

      {agents === undefined ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">{filters}</div>
          <AgentListSkeleton />
        </div>
      ) : agents.length === 0 ? (
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          No agents yet.{" "}
          <Link href="/admin/agents/new" className="font-medium text-primary underline-offset-4 hover:underline">
            Add an agent
          </Link>
          .
        </p>
      ) : (
        <AgentList agents={scoped} thumbnailByAgentId={thumbnailByAgentId} toolbar={filters} />
      )}
    </div>
  );
}
