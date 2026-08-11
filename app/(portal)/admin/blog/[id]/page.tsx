"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { BlogPostForm } from "@/components/admin/blog-posts/blog-post-form";
import { BackLink } from "@/components/admin/back-link";

export default function BlogPostEditPage() {
  const params = useParams<{ id: string }>();
  const blogPost = useQuery(api.blogPosts.get, { id: params.id as Id<"blogPosts"> });

  if (blogPost === undefined) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  if (blogPost === null) {
    return <p className="text-muted-foreground">Blog post not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin/blog" label="Back to Blog" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{blogPost.title.en}</h1>
        <p className="text-muted-foreground">Edit blog post.</p>
      </div>
      <BlogPostForm mode="edit" blogPost={blogPost} />
    </div>
  );
}
