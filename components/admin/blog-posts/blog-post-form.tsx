"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { blogPostSchema } from "@/lib/validation/blogPosts";
import { publishingFieldsSchema } from "@/lib/validation/shared";
import { uploadMediaFile } from "@/lib/media/uploadMediaFile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LocalizedTextField } from "@/components/forms/localized-text-field";
import { SeoFieldsSection } from "@/components/forms/seo-fields-section";
import { FieldHint } from "@/components/forms/field-hint";
import { MediaUploader } from "@/components/media/media-uploader";
import { MediaPicker, type PendingMediaFile } from "@/components/media/media-picker";

// One form serves both Create and Edit — see developer-form.tsx for the
// rationale. `authorUserId` is intentionally absent: the server sets it on
// create from the acting user, and edit mode only shows it read-only.
const blogPostFormSchema = z.object({
  title: blogPostSchema.shape.title,
  body: blogPostSchema.shape.body,
  seo: blogPostSchema.shape.seo,
  slug: publishingFieldsSchema.shape.slug,
  status: publishingFieldsSchema.shape.status,
});

type BlogPostFormValues = z.infer<typeof blogPostFormSchema>;

const DEFAULT_VALUES: BlogPostFormValues = {
  title: { en: "" },
  body: { en: "" },
  seo: undefined,
  slug: "",
  status: "draft",
};

function toFormValues(blogPost: Doc<"blogPosts">): BlogPostFormValues {
  return {
    title: blogPost.title,
    body: blogPost.body,
    seo: blogPost.seo,
    slug: blogPost.publishing.slug,
    status: blogPost.publishing.status,
  };
}

function PostedByLine({ authorUserId }: { authorUserId: Doc<"blogPosts">["authorUserId"] }) {
  const author = useQuery(api.users.getById, { id: authorUserId });

  const label =
    author === undefined ? "…" : author === null ? "(deleted user)" : author.email;

  return <p className="text-sm text-muted-foreground">Posted by {label}</p>;
}

type BlogPostFormProps = { mode: "edit"; blogPost: Doc<"blogPosts"> } | { mode: "create" };

export function BlogPostForm(props: BlogPostFormProps) {
  const router = useRouter();
  const createBlogPost = useMutation(api.blogPosts.create);
  const updateBlogPost = useMutation(api.blogPosts.update);
  const createMediaItem = useMutation(api.mediaItems.create);
  const [pendingCoverImage, setPendingCoverImage] = useState<PendingMediaFile[]>([]);
  const form = useForm<BlogPostFormValues>(
    props.mode === "edit"
      ? { resolver: zodResolver(blogPostFormSchema), values: toFormValues(props.blogPost) }
      : { resolver: zodResolver(blogPostFormSchema), defaultValues: DEFAULT_VALUES },
  );

  async function onSubmit(values: BlogPostFormValues) {
    const payload = { ...values };
    try {
      if (props.mode === "edit") {
        await updateBlogPost({ id: props.blogPost._id, ...payload });
        toast.success("Blog post saved");
      } else {
        const id = await createBlogPost(payload);
        if (pendingCoverImage.length > 0) {
          const results = await Promise.allSettled(
            pendingCoverImage.map(async (pending) => {
              const uploaded = await uploadMediaFile(pending.file, "blogPost", id);
              await createMediaItem({ entityType: "blogPost", entityId: id, ...uploaded });
              URL.revokeObjectURL(pending.previewUrl);
            }),
          );
          const failedCount = results.filter((result) => result.status === "rejected").length;
          if (failedCount > 0) {
            toast.warning(
              "Blog post created, but the cover image failed to upload — add it from the edit page.",
            );
          } else {
            toast.success("Blog post created");
          }
        } else {
          toast.success("Blog post created");
        }
        router.push(`/admin/blog/${id}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save blog post");
    }
  }

  return (
    <div className="space-y-8">
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {props.mode === "edit" && <PostedByLine authorUserId={props.blogPost.authorUserId} />}

          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 pt-4">
              <LocalizedTextField
                name="title"
                label="Title"
                required
                placeholder="e.g. 5 Tips for First-Time Dubai Buyers"
              />
              <LocalizedTextField
                name="body"
                label="Body"
                richText
                required
                placeholder="Write the post…"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="blog-slug">Slug *</Label>
                  <Input
                    id="blog-slug"
                    placeholder="5-tips-for-first-time-dubai-buyers"
                    {...form.register("slug")}
                  />
                  <FieldHint>Used in the page URL. Lowercase letters, numbers, and dashes only.</FieldHint>
                  {form.formState.errors.slug && (
                    <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Controller
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldHint>
                    Draft is hidden from the public site. Published is live. Archived is hidden but
                    kept for records.
                  </FieldHint>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4 pt-4">
              <SeoFieldsSection
                idPrefix="blog"
                titlePlaceholder="e.g. 5 Tips for First-Time Dubai Buyers | QuickTalk Real Estate"
                descriptionPlaceholder="A search-engine-friendly summary…"
                canonicalPlaceholder="/blog/5-tips-for-first-time-dubai-buyers"
              />
            </TabsContent>
          </Tabs>

          <Separator />
          <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? props.mode === "edit"
                  ? "Saving…"
                  : "Creating…"
                : props.mode === "edit"
                  ? "Save Changes"
                  : "Create Post"}
            </Button>
          </div>
        </form>
      </FormProvider>

      <Separator />
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Cover Image</h2>
        {props.mode === "edit" ? (
          <MediaUploader entityType="blogPost" entityId={props.blogPost._id} />
        ) : (
          <MediaPicker
            entityType="blogPost"
            value={pendingCoverImage}
            onChange={setPendingCoverImage}
          />
        )}
      </div>
    </div>
  );
}
