"use client";

import { BlogPostForm } from "@/components/admin/blog-posts/blog-post-form";
import { GuardedBackLink, UnsavedChangesProvider } from "@/components/admin/unsaved-changes";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default function NewBlogPostPage() {
  return (
    <UnsavedChangesProvider>
      <div className="space-y-8">
        <AdminPageHeader
          back={<GuardedBackLink href="/admin/blog" label="Blog" />}
          title="New post"
          description="Write an article for the public site."
        />
        <BlogPostForm mode="create" />
      </div>
    </UnsavedChangesProvider>
  );
}
