"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, type FieldErrors } from "react-hook-form";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { blogPostSchema, compactRelated, compactTopicName, RELATED_MAX } from "@/lib/validation/blogPosts";
import { compactSeoFields, publishingFieldsSchema } from "@/lib/validation/shared";
import { formLocalized, formSeo } from "@/lib/admin/form-values";
import { uploadMediaFile } from "@/lib/media/uploadMediaFile";
import { slugFromTitle } from "@/lib/format/slug";
import { AdminStickyActions } from "@/components/admin/admin-sticky-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LocalizedTextField } from "@/components/forms/localized-text-field";
import { FormLocaleProvider, FormLocaleSwitch, useFormLocale, type FormLocale } from "@/components/forms/form-locale";
import { AlsoSeeFields } from "@/components/admin/blog-posts/also-see-fields";
import { TopicField } from "@/components/admin/blog-posts/topic-field";
import { SeoFieldsSection } from "@/components/forms/seo-fields-section";
import { FieldHint } from "@/components/forms/field-hint";
import { MediaUploader } from "@/components/media/media-uploader";
import { MediaPicker, type PendingMediaFile } from "@/components/media/media-picker";
import { AdminSection } from "@/components/admin/admin-section";
import { useUnsavedChanges } from "@/components/admin/unsaved-changes";
import { useAuthedQuery } from "@/components/admin/use-authed-query";

const LIST_HREF = "/admin/blog";

const relatedFormSchema = z
  .array(
    z.object({
      type: z.enum(["property", "project", "blogPost"]),
      id: z.string(),
    }),
  )
  .max(RELATED_MAX, `Also see can list at most ${RELATED_MAX} items`)
  .superRefine((items, ctx) => {
    const seen = new Set<string>();
    for (const [index, item] of items.entries()) {
      if (!item.id) continue;
      const key = `${item.type}:${item.id}`;
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          message: "Also see cannot list the same record twice",
          path: [index],
        });
      }
      seen.add(key);
    }
  });

const blogPostFormSchema = z.object({
  title: blogPostSchema.shape.title,
  body: blogPostSchema.shape.body,
  seo: blogPostSchema.shape.seo,
  related: relatedFormSchema,
  topicName: z.string().max(80),
  slug: publishingFieldsSchema.shape.slug,
  status: publishingFieldsSchema.shape.status,
});

type BlogPostFormValues = z.infer<typeof blogPostFormSchema>;

const DEFAULT_VALUES: BlogPostFormValues = {
  title: formLocalized(undefined),
  body: formLocalized(undefined),
  seo: formSeo(undefined),
  related: [],
  topicName: "",
  slug: "",
  status: "draft",
};

function toFormValues(blogPost: Doc<"blogPosts">, topicName: string): BlogPostFormValues {
  return {
    title: formLocalized(blogPost.title),
    body: formLocalized(blogPost.body),
    seo: formSeo(blogPost.seo),
    related: blogPost.related ?? [],
    topicName,
    slug: blogPost.publishing.slug,
    status: blogPost.publishing.status,
  };
}

function relatedForMutation(related: NonNullable<ReturnType<typeof compactRelated>>) {
  return related.map((item) => {
    if (item.type === "property") return { type: "property" as const, id: item.id as Id<"properties"> };
    if (item.type === "project") return { type: "project" as const, id: item.id as Id<"projects"> };
    return { type: "blogPost" as const, id: item.id as Id<"blogPosts"> };
  });
}

function firstErrorPath(errors: FieldErrors, prefix = ""): string | null {
  for (const [key, value] of Object.entries(errors)) {
    if (!value || typeof value !== "object") continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if ("message" in value && value.message) return path;
    const nested = firstErrorPath(value as FieldErrors, path);
    if (nested) return nested;
  }
  return null;
}

function localeFromPath(path: string): FormLocale {
  if (path.includes(".ar")) return "ar";
  if (path.includes(".tr")) return "tr";
  return "en";
}

function localeHasCopy(title: BlogPostFormValues["title"], body: BlogPostFormValues["body"], locale: FormLocale) {
  return Boolean(title[locale]?.trim() || body[locale]?.trim());
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

function PostedByLine({ authorUserId }: { authorUserId: Doc<"blogPosts">["authorUserId"] }) {
  const author = useAuthedQuery(api.users.getById, { id: authorUserId });
  const label = author === undefined ? "…" : author === null ? "a deleted account" : author.name || author.email;
  return <p className="text-xs text-muted-foreground">Posted by {label}</p>;
}

type BlogPostFormProps = { mode: "edit"; blogPost: Doc<"blogPosts"> } | { mode: "create" };

function BlogPostFormFields(props: BlogPostFormProps) {
  const router = useRouter();
  const unsaved = useUnsavedChanges();
  const formLocale = useFormLocale();
  const categories = useAuthedQuery(api.blogCategories.list, {});
  const savedPhotos = useAuthedQuery(
    api.mediaItems.listByEntity,
    props.mode === "edit" ? { entityType: "blogPost", entityId: props.blogPost._id } : "skip",
  );
  const createBlogPost = useMutation(api.blogPosts.create);
  const updateBlogPost = useMutation(api.blogPosts.update);
  const createMediaItem = useMutation(api.mediaItems.create);
  const [pendingCover, setPendingCover] = useState<PendingMediaFile[]>([]);
  const [confirm, setConfirm] = useState<"publish" | "unpublish" | null>(null);
  const [saveIntent, setSaveIntent] = useState<"draft" | "published" | null>(null);
  const slugEdited = useRef(props.mode === "edit");
  const topicName =
    props.mode === "edit" && props.blogPost.categoryId
      ? (categories ?? []).find((row) => row._id === props.blogPost.categoryId)?.name.en ?? ""
      : "";
  const form = useForm<BlogPostFormValues>(
    props.mode === "edit"
      ? {
          resolver: zodResolver(blogPostFormSchema),
          defaultValues: toFormValues(props.blogPost, topicName),
          values: toFormValues(props.blogPost, topicName),
        }
      : { resolver: zodResolver(blogPostFormSchema), defaultValues: DEFAULT_VALUES },
  );

  const title = form.watch("title");
  const body = form.watch("body");
  const slug = form.watch("slug");
  const savedStatus = props.mode === "edit" ? props.blogPost.publishing.status : "draft";
  const titleEn = title.en;
  const photoCount = props.mode === "create" ? pendingCover.length : savedPhotos === undefined ? null : savedPhotos.length;
  const missingArabic = !localeHasCopy(title, body, "ar");
  const missingTurkish = !localeHasCopy(title, body, "tr");

  useEffect(() => {
    unsaved?.setDirty(form.formState.isDirty || pendingCover.length > 0);
  }, [form.formState.isDirty, pendingCover.length, unsaved]);

  useEffect(() => {
    if (slugEdited.current) return;
    const next = slugFromTitle(titleEn ?? "");
    if (next && next !== slug) {
      form.setValue("slug", next, { shouldDirty: false, shouldValidate: true });
    }
  }, [form, slug, titleEn]);

  function onInvalid(errors: FieldErrors<BlogPostFormValues>) {
    setSaveIntent(null);
    const path = firstErrorPath(errors);
    if (!path) return;
    formLocale?.setLocale(localeFromPath(path));
    if (path === "seo" || path.startsWith("seo.")) {
      document.getElementById("post-seo")?.setAttribute("open", "");
    }
    void form.setFocus(path as Parameters<typeof form.setFocus>[0]);
    requestAnimationFrame(() => {
      document.querySelector("[aria-invalid='true'], .text-destructive")?.scrollIntoView({ block: "center" });
    });
  }

  async function onSubmit(values: BlogPostFormValues) {
    const related = compactRelated(
      values.related,
      props.mode === "edit" ? props.blogPost._id : undefined,
    );
    const payload = {
      title: values.title,
      body: values.body,
      seo: compactSeoFields(values.seo),
      slug: values.slug,
      status: values.status,
      related: related ? relatedForMutation(related) : [],
      topicName: compactTopicName(values.topicName),
    };

    try {
      if (props.mode === "edit") {
        await updateBlogPost({ id: props.blogPost._id, ...payload });
        form.reset(form.getValues());
        unsaved?.setDirty(false);
        toast.success(values.status === "published" ? "Post is live" : "Draft saved");
      } else {
        const id = await createBlogPost({
          title: payload.title,
          body: payload.body,
          seo: payload.seo,
          slug: payload.slug,
          status: payload.status,
          topicName: payload.topicName,
          ...(payload.related.length > 0 ? { related: payload.related } : {}),
        });
        if (pendingCover.length > 0) {
          const results = await Promise.allSettled(
            pendingCover.map(async (pending) => {
              const uploaded = await uploadMediaFile(pending.file, "blogPost", id);
              await createMediaItem({ entityType: "blogPost", entityId: id, ...uploaded });
              URL.revokeObjectURL(pending.previewUrl);
            }),
          );
          const failedCount = results.filter((result) => result.status === "rejected").length;
          if (failedCount > 0) {
            toast.warning("Post created, but the cover image failed to upload — add it from the edit page.");
          } else {
            toast.success(values.status === "published" ? "Post is live" : "Draft saved");
          }
        } else {
          toast.success(values.status === "published" ? "Post is live" : "Draft saved");
        }
        unsaved?.setDirty(false);
        router.push(`/admin/blog/${id}`);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      toast.error(
        detail && detail !== "Failed to save blog post"
          ? detail
          : "Couldn't save this post. Check the highlighted fields and try again.",
      );
    } finally {
      setSaveIntent(null);
    }
  }

  function requestSave(status: "draft" | "published") {
    form.setValue("status", status, { shouldDirty: true });
    if (status === "published" && savedStatus !== "published") {
      void form.handleSubmit(() => {
        setConfirm("publish");
      }, onInvalid)();
      return;
    }
    if (status === "draft" && savedStatus === "published") {
      void form.handleSubmit(() => {
        setConfirm("unpublish");
      }, onInvalid)();
      return;
    }
    setSaveIntent(status);
    void form.handleSubmit(onSubmit, onInvalid)();
  }

  const publicPath = slug ? `/en/blog/${slug}` : "/en/blog/…";
  const slugField = form.register("slug");

  return (
    <FormProvider {...form}>
      <form
        autoComplete="off"
        onSubmit={(event) => {
          event.preventDefault();
          requestSave(savedStatus === "published" ? "published" : "draft");
        }}
        className="flex flex-col gap-4 [&_input]:scroll-mb-32 [&_textarea]:scroll-mb-32 **:data-[slot=select-trigger]:scroll-mb-32"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FormLocaleSwitch
            filled={{
              en: localeHasCopy(title, body, "en"),
              ar: localeHasCopy(title, body, "ar"),
              tr: localeHasCopy(title, body, "tr"),
            }}
          />
        </div>

        <AdminSection title="Post">
          {props.mode === "edit" ? <PostedByLine authorUserId={props.blogPost.authorUserId} /> : null}
          <LocalizedTextField
            name="title"
            label="Title"
            required
            placeholder="e.g. Five things to know before buying in Dubai"
          />
          <TopicField
            id="post-topic"
            value={form.watch("topicName")}
            onChange={(next) => form.setValue("topicName", next, { shouldDirty: true, shouldValidate: true })}
            options={(categories ?? []).map((row) => row.name.en)}
          />
          <LocalizedTextField
            name="body"
            label="Body"
            richText
            required
            placeholder="Write the post…"
            excludePostId={props.mode === "edit" ? props.blogPost._id : undefined}
          />
        </AdminSection>

        <AdminSection
          title="Cover"
          hint={
            props.mode === "edit"
              ? "Shown on the public post. Uploads immediately."
              : "Shown on the public post. Uploads when you save."
          }
        >
          {props.mode === "edit" ? (
            <MediaUploader entityType="blogPost" entityId={props.blogPost._id} />
          ) : (
            <MediaPicker entityType="blogPost" value={pendingCover} onChange={setPendingCover} />
          )}
        </AdminSection>

        <AdminSection
          title="Also see"
          hint="Up to four listings or posts shown after the article. Drafts stay hidden on the public page until they are published."
        >
          <AlsoSeeFields excludePostId={props.mode === "edit" ? props.blogPost._id : undefined} />
        </AdminSection>

        <AdminSection title="Publishing">
          <div className="space-y-1">
            <Label htmlFor="post-slug">Slug *</Label>
            <Input
              id="post-slug"
              placeholder="five-things-to-know…"
              autoComplete="off"
              spellCheck={false}
              translate="no"
              {...slugField}
              onChange={(event) => {
                slugEdited.current = true;
                void slugField.onChange(event);
              }}
            />
            <p className="font-mono text-xs text-muted-foreground" translate="no">
              {publicPath}
            </p>
            <FieldHint>Live URL for English. Arabic and Turkish use the same slug under /ar and /tr.</FieldHint>
            <FieldError message={form.formState.errors.slug?.message} />
          </div>
        </AdminSection>

        <AdminSection id="post-seo" title="SEO" hint="Leave blank to fall back to the post title and body." collapsible>
          <SeoFieldsSection
            idPrefix="post"
            titlePlaceholder="e.g. Five things to know before buying in Dubai | QuickTalk Real Estate"
            descriptionPlaceholder="A search-engine-friendly summary…"
            canonicalPlaceholder="/blog/five-things-to-know"
          />
        </AdminSection>

        <AdminStickyActions
          disabled={form.formState.isSubmitting}
          draftLabel={form.formState.isSubmitting && saveIntent === "draft" ? "Saving…" : "Save draft"}
          publishLabel={
            form.formState.isSubmitting && saveIntent === "published"
              ? savedStatus === "published"
                ? "Saving…"
                : "Publishing…"
              : savedStatus === "published"
                ? "Save"
                : "Publish"
          }
          onCancel={() => {
            if (unsaved) unsaved.requestLeave(LIST_HREF);
            else router.push(LIST_HREF);
          }}
          onSaveDraft={() => requestSave("draft")}
          onPublish={() => requestSave("published")}
        />
      </form>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => { if (!open) setConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "unpublish" ? "Hide this post?" : "Publish this post?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "unpublish" ? (
                "It will be removed from the public site. You can publish it again later."
              ) : (
                <>
                  Live at {publicPath}. /ar and /tr use the same slug and fall back to English where a translation is blank.
                  {photoCount === 0 ? " No cover yet — the post will go live without one." : null}
                  {missingArabic ? " Arabic is empty." : null}
                  {missingTurkish ? " Turkish is empty." : null}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const nextStatus = confirm === "unpublish" ? "draft" : "published";
                setConfirm(null);
                setSaveIntent(nextStatus);
                void form.handleSubmit(onSubmit, onInvalid)();
              }}
            >
              {confirm === "unpublish" ? "Save as draft" : "Publish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FormProvider>
  );
}

export function BlogPostForm(props: BlogPostFormProps) {
  return (
    <FormLocaleProvider>
      <BlogPostFormFields {...props} />
    </FormLocaleProvider>
  );
}
