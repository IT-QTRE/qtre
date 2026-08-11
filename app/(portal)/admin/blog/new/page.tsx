"use client";

import { BlogPostForm } from "@/components/admin/blog-posts/blog-post-form";
import { BackLink } from "@/components/admin/back-link";

export default function NewBlogPostPage() {
  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin/blog" label="Back to Blog" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Add Post</h1>
        <p className="text-muted-foreground">Create a new blog post.</p>
      </div>
      <BlogPostForm mode="create" />
    </div>
  );
}
