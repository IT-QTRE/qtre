"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/data-table";
import { getBlogPostColumns } from "@/components/admin/blog-posts/blog-post-columns";

export default function BlogPostsPage() {
  const blogPosts = useQuery(api.blogPosts.list);
  const thumbnails = useQuery(
    api.mediaItems.listPrimaryByEntityIds,
    blogPosts ? { entityType: "blogPost", entityIds: blogPosts.map((post) => post._id) } : "skip",
  );
  const thumbnailByBlogPostId = new Map(Object.entries(thumbnails ?? {}));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Blog</h1>
          <p className="text-muted-foreground">Manage blog posts.</p>
        </div>
        <Button render={<Link href="/admin/blog/new" />} nativeButton={false}>
          <Plus className="size-4" />
          Add Post
        </Button>
      </div>
      {blogPosts === undefined ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <DataTable
          columns={getBlogPostColumns(thumbnailByBlogPostId)}
          data={blogPosts}
          searchPlaceholder="Search posts..."
          filterColumnId="titleText"
        />
      )}
    </div>
  );
}
