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
import { BlogPostList } from "@/components/admin/blog-posts/blog-post-list";
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

function BlogListSkeleton() {
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

export default function BlogPostsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const publishing = parsePublishing(searchParams.get("publishing"));
  const posts = useAuthedQuery(api.blogPosts.list, {});

  function setPublishing(value: PublishingFilter) {
    router.replace(hrefWithFilters(pathname, searchParams.toString(), value), { scroll: false });
  }

  const thumbnails = useQuery(
    api.mediaItems.listPrimaryByEntityIds,
    posts ? { entityType: "blogPost", entityIds: posts.map((post) => post._id) } : "skip",
  );
  const thumbnailByPostId = new Map(Object.entries(thumbnails ?? {}));

  const scoped = useMemo(() => {
    if (!posts) return [];
    return posts.filter((post) => {
      if (publishing !== "all" && post.publishing.status !== publishing) return false;
      return true;
    });
  }, [posts, publishing]);

  const filters = (
    <AdminFilterGroup label="Publishing status" options={PUBLISHING_FILTERS} value={publishing} onChange={setPublishing} />
  );

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Blog"
        description="Articles on the public site."
        actions={
          <Button render={<Link href="/admin/blog/new" />} nativeButton={false}>
            <Plus className="size-4" aria-hidden />
            New post
          </Button>
        }
      />

      {posts === undefined ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">{filters}</div>
          <BlogListSkeleton />
        </div>
      ) : posts.length === 0 ? (
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          No posts yet.{" "}
          <Link href="/admin/blog/new" className="font-medium text-primary underline-offset-4 hover:underline">
            Add a post
          </Link>
          .
        </p>
      ) : (
        <BlogPostList posts={scoped} thumbnailByPostId={thumbnailByPostId} toolbar={filters} />
      )}
    </div>
  );
}
