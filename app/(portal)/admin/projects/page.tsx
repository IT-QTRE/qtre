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
import { ProjectList } from "@/components/admin/projects/project-list";
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

function ProjectListSkeleton() {
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

export default function ProjectsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const publishing = parsePublishing(searchParams.get("publishing"));
  const projects = useAuthedQuery(api.projects.list, {});
  const developers = useAuthedQuery(api.developers.list, {});
  const communities = useAuthedQuery(api.communities.list, {});

  function setPublishing(value: PublishingFilter) {
    router.replace(hrefWithFilters(pathname, searchParams.toString(), value), { scroll: false });
  }

  const thumbnails = useQuery(
    api.mediaItems.listPrimaryByEntityIds,
    projects ? { entityType: "project", entityIds: projects.map((project) => project._id) } : "skip",
  );
  const thumbnailByProjectId = new Map(Object.entries(thumbnails ?? {}));
  const developerNameById = new Map((developers ?? []).map((developer) => [developer._id, developer.name.en]));
  const communityNameById = new Map((communities ?? []).map((community) => [community._id, community.name.en]));

  const scoped = useMemo(() => {
    if (!projects) return [];
    return projects.filter((project) => {
      if (publishing !== "all" && project.publishing.status !== publishing) return false;
      return true;
    });
  }, [projects, publishing]);

  const filters = (
    <AdminFilterGroup label="Publishing status" options={PUBLISHING_FILTERS} value={publishing} onChange={setPublishing} />
  );

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Projects"
        description="Development projects in the catalog."
        actions={
          <Button render={<Link href="/admin/projects/new" />} nativeButton={false}>
            <Plus className="size-4" aria-hidden />
            New project
          </Button>
        }
      />

      {projects === undefined ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">{filters}</div>
          <ProjectListSkeleton />
        </div>
      ) : projects.length === 0 ? (
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          No projects yet.{" "}
          <Link href="/admin/projects/new" className="font-medium text-primary underline-offset-4 hover:underline">
            Add a project
          </Link>
          .
        </p>
      ) : (
        <ProjectList
          projects={scoped}
          thumbnailByProjectId={thumbnailByProjectId}
          developerNameById={developerNameById}
          communityNameById={communityNameById}
          toolbar={filters}
        />
      )}
    </div>
  );
}
