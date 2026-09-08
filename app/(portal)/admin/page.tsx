import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { OverviewMonitor } from "@/components/admin/overview-monitor";
import { formatAdminRole } from "@/components/admin/admin-nav-items";
import type { Resource } from "@/convex/lib/roles";

const ATTENTION_LIMIT = 8;

type AttentionItem = {
  id: string;
  href: string;
  title: string;
  kind: string;
  at: number;
};

function canAccess(role: string, disabled: readonly string[], resource: Resource) {
  if (role !== "admin") return true;
  return !disabled.includes(resource);
}

function formatWhen(ms: number) {
  return new Intl.DateTimeFormat("en-AE", { day: "numeric", month: "short" }).format(new Date(ms));
}

export default async function AdminHomePage() {
  const { getToken } = await auth();
  const token = (await getToken()) ?? undefined;

  const [currentUser, projects, properties, leads, serviceLeads, blogPosts] = await Promise.all([
    fetchQuery(api.users.current, {}, { token }),
    fetchQuery(api.projects.list, {}, { token }),
    fetchQuery(api.properties.list, {}, { token }),
    fetchQuery(api.leads.list, {}, { token }),
    fetchQuery(api.serviceLeads.list, {}, { token }),
    fetchQuery(api.blogPosts.list, {}, { token }),
  ]);

  const role = currentUser?.role ?? "";
  const disabled = currentUser?.disabledResources ?? [];
  const showProperties = canAccess(role, disabled, "properties");
  const showProjects = canAccess(role, disabled, "projects");
  const showBlog = canAccess(role, disabled, "blogPosts");
  const showLeads = canAccess(role, disabled, "leads");
  const showServiceLeads = canAccess(role, disabled, "serviceLeads");

  const attention: AttentionItem[] = [
    ...properties
      .filter((row) => row.publishing.status === "draft")
      .map((row) => ({
        id: row._id,
        href: `/admin/properties/${row._id}`,
        title: row.title.en,
        kind: "Draft property",
        at: row.publishing.updatedAt,
      })),
    ...projects
      .filter((row) => row.publishing.status === "draft")
      .map((row) => ({
        id: row._id,
        href: `/admin/projects/${row._id}`,
        title: row.title.en,
        kind: "Draft project",
        at: row.publishing.updatedAt,
      })),
    ...blogPosts
      .filter((row) => row.publishing.status === "draft")
      .map((row) => ({
        id: row._id,
        href: `/admin/blog/${row._id}`,
        title: row.title.en,
        kind: "Draft post",
        at: row.publishing.updatedAt,
      })),
    ...serviceLeads
      .filter((row) => row.status === "new")
      .map((row) => ({
        id: row._id,
        href: `/admin/service-leads/${row._id}`,
        title: row.name,
        kind: "New service lead",
        at: row.createdAt,
      })),
  ]
    .toSorted((a, b) => b.at - a.at)
    .slice(0, ATTENTION_LIMIT);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Overview</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {currentUser?.name ? `${currentUser.name} · ` : ""}
            {formatAdminRole(role)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showProperties ? (
            <Button render={<Link href="/admin/properties/new" />} nativeButton={false}>
              <Plus className="size-4" />
              New property
            </Button>
          ) : null}
          {showProjects ? (
            <Button variant="outline" render={<Link href="/admin/projects/new" />} nativeButton={false}>
              New project
            </Button>
          ) : null}
          {showBlog ? (
            <Button variant="outline" render={<Link href="/admin/blog/new" />} nativeButton={false}>
              New post
            </Button>
          ) : null}
        </div>
      </div>

      <OverviewMonitor />

      <section aria-labelledby="attention-heading">
        <h2 id="attention-heading" className="font-heading text-lg font-semibold tracking-tight">
          Needs attention
        </h2>
        {attention.length === 0 ? (
          <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted-foreground">
            Nothing waiting. New leads and unpublished inventory will show here.
            {showProperties ? (
              <>
                {" "}
                <Link href="/admin/properties/new" className="font-medium text-primary underline-offset-4 hover:underline">
                  Add a property
                </Link>
                .
              </>
            ) : null}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {attention.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-baseline justify-between gap-4 py-3.5 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-heading text-sm font-medium">{item.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{item.kind}</span>
                  </span>
                  <time className="shrink-0 text-xs tabular-nums text-muted-foreground" dateTime={new Date(item.at).toISOString()}>
                    {formatWhen(item.at)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {showLeads && leads.some((lead) => lead.status === "new") ? (
          <p className="mt-4">
            <Link href="/admin/leads" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              All leads
            </Link>
          </p>
        ) : null}
        {showServiceLeads && serviceLeads.some((lead) => lead.status === "new") ? (
          <p className="mt-4">
            <Link href="/admin/service-leads" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              All service leads
            </Link>
          </p>
        ) : null}
      </section>
    </div>
  );
}
