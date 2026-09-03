"use client";

import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { BlogPostForm } from "@/components/admin/blog-posts/blog-post-form";
import { GuardedBackLink, UnsavedChangesProvider } from "@/components/admin/unsaved-changes";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAuthedQuery } from "@/components/admin/use-authed-query";

export default function BlogPostEditPage() {
  const params = useParams<{ id: string }>();
  const blogPost = useAuthedQuery(api.blogPosts.get, { id: params.id as Id<"blogPosts"> });

  if (blogPost === undefined) {
    return (
      <div className="space-y-8">
        <AdminPageHeader back={<GuardedBackLink href="/admin/blog" label="Blog" />} title="Post" />
        <div className="h-48 border border-border bg-muted/60" aria-hidden />
      </div>
    );
  }

  if (blogPost === null) {
    return (
      <div className="space-y-8">
        <AdminPageHeader back={<GuardedBackLink href="/admin/blog" label="Blog" />} title="Post" />
        <p className="max-w-prose text-sm text-muted-foreground">This post is not in your catalog.</p>
      </div>
    );
  }

  return (
    <UnsavedChangesProvider>
      <div className="space-y-8">
        <AdminPageHeader
          back={<GuardedBackLink href="/admin/blog" label="Blog" />}
          title={blogPost.title.en}
          description="Edit copy, cover, and publishing."
        />
        <BlogPostForm mode="edit" blogPost={blogPost} />
      </div>
    </UnsavedChangesProvider>
  );
}
